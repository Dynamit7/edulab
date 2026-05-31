import { Client } from "pg";
import createhash from "../lib/crypto.js";
import { dbconfig } from "../config.js";

const client = new Client(dbconfig);

await client.connect();

async function getUsers(id) {
	const result = await client.query("SELECT * FROM users WHERE id = $1", [
		id,
	]);
	return result;
}

async function getUserByLogin(login) {
	const result = await client.query("SELECT * FROM users WHERE login = $1", [
		login,
	]);
	return result;
}

async function authUser(login, password) {
	const result = await client.query(
		`SELECT * FROM users WHERE username = $1 AND password = $2`,
		[login, createhash(password)],
	);
	return result.rows;
}

async function createUser(
	name,
	phone_number,
	role,
	created_by,
	login,
	password,
) {
	const result = await client.query(
		`INSERT INTO users (name, phone_number, role, created_by, login, password_hash)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, name, login, role`,
		[name, phone_number, role, created_by, login, createhash(password)],
	);

	return result;
}

async function getAllUsers(cursor, role) {
	const limit = 10;
	const { rows: users } = await client.query(
		`SELECT id, name, login, phone_number, email, role, status, created_at
		FROM users
		WHERE id > $1 AND role <= $2
		ORDER BY id
		LIMIT $3`,
		[cursor, role, limit],
	);
	const nextCursor =
		users.length === limit ? users[users.length - 1].id : null;
	return { users, nextCursor };
}

function query(sql, params) {
	return client.query(sql, params);
}

export { createUser, getUsers, authUser, getUserByLogin, getAllUsers, query };
