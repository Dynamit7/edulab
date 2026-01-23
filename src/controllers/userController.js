import jwt from "jsonwebtoken";
import { getUserByLogin, authUser } from "../lib/dbquery.js";
import { jwtsecret } from "../config.js";
import createhash from "../lib/crypto.js";

async function auth(req, res) {
	try {
		const { login, password } = req.body[0];

		let user = await getUserByLogin(login);

		// First: check if user exists
		if (!user.rows || user.rows.length === 0) {
			return res.status(404).send("Username not found!");
		}

		// Second: check password
		if (user.rows[0].password !== createhash(password)) {
			return res.status(404).send("Password not correct!");
		}

		// Create JWT token
		const payload = {
			id: user.rows[0].id,
			login: user.rows[0].username,
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

export default { auth };
