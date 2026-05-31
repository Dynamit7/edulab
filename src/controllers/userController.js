import jwt from "jsonwebtoken";
import { getUserByLogin, authUser, getAllUsers, createUser, query } from "../lib/dbquery.js";
import { jwtsecret } from "../config.js";
import createhash from "../lib/crypto.js";

// Roles a user can assign (only strictly below their own role)
const ASSIGNABLE_ROLES = {
	15: [{ value: 12, label: "Admin" }, { value: 10, label: "Supervisor" }, { value: 8, label: "Teacher" }, { value: 5, label: "Student" }],
	12: [{ value: 10, label: "Supervisor" }, { value: 8, label: "Teacher" }, { value: 5, label: "Student" }],
	10: [{ value: 8, label: "Teacher" }, { value: 5, label: "Student" }],
	8:  [{ value: 5, label: "Student" }],
};

async function auth(req, res) {
	try {
		const { login, password } = req.body[0];

		let user = await getUserByLogin(login);

		// First: check if user exists
		if (!user.rows || user.rows.length === 0) {
			return res.status(404).send("Username not found!");
		}

		// Second: check password
		// console.log("password:", createhash(password));

		if (user.rows[0].password_hash !== createhash(password)) {
			return res.status(404).send("Password not correct!");
		}

		// Create JWT token
		const payload = {
			id: user.rows[0].id,
			name: user.rows[0].name,
			login: user.rows[0].login,
			role: user.rows[0].role,
		};

		const token = jwt.sign(payload, jwtsecret, {
			expiresIn: "30d",
		});

		let role = "student"
			? user.rows[0].role < 5
			: "teacher"
				? user.rows[0].role >= 5 && user.rows[0].role < 8
				: "admin"
					? user.rows[0].role >= 8 && user.rows[0].role < 11
					: "superuser;";

		res.status(200).cookie("token", token).redirect("/");
	} catch (error) {
		console.log(error);
		res.status(500).send("Server error");
	}
}

async function getUsers(req, res) {
	if (parseInt(req.user.role) < 10) {
		return res.status(403).json({ error: "Нет доступа" });
	}
	try {
		const cursor = parseInt(req.query.cursor) || 0;
		const result = await getAllUsers(cursor, req.user.role);
		return res.status(200).json(result);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Ошибка сервера" });
	}
}

async function addUser(req, res) {
	try {
		const creator = req.user;
		const { name, login, phone_number, email, telegram_username, role, password } = req.body;

		// Validate required fields
		if (!name || !login || !phone_number || !role || !password) {
			return res.status(400).json({ error: "Заполните все обязательные поля" });
		}

		const targetRole = parseInt(role);

		// Role check: can only assign roles strictly below own
		const allowed = ASSIGNABLE_ROLES[creator.role];
		if (!allowed || !allowed.find(r => r.value === targetRole)) {
			return res.status(403).json({ error: "Нельзя назначить эту роль" });
		}

		// Check login uniqueness
		const existing = await getUserByLogin(login);
		if (existing.rows.length > 0) {
			return res.status(409).json({ error: "Такой логин уже занят" });
		}

		const result = await createUser(name, phone_number, targetRole, creator.id, login, password);

		// Optionally save email / telegram if provided
		if (email || telegram_username) {
			const newId = result.rows[0].id;
			if (email) await query("UPDATE users SET email=$1 WHERE id=$2", [email, newId]);
			if (telegram_username) await query("UPDATE users SET telegram_username=$1 WHERE id=$2", [telegram_username, newId]);
		}

		return res.status(201).json({ success: true, user: result.rows[0] });
	} catch (error) {
		console.error(error);
		if (error.code === "23505") {
			return res.status(409).json({ error: "Логин, email или телефон уже используется" });
		}
		return res.status(500).json({ error: "Ошибка сервера" });
	}
}

export default { auth, getUsers, addUser };
