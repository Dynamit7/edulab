import { Client } from "pg";
import createhash from "../lib/crypto.js";
import { dbconfig } from "../config.js";

const client = new Client(dbconfig);

await client.connect();

async function getUsers(id) {
	const result = await client.query("SELECT * FROM users WHERE id = $1", [id]);
	return result;
}

async function getUserByLogin(login) {
	const result = await client.query("SELECT * FROM users WHERE username = $1", [
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
		`INSERT INTO users (name, phone_number, role, created_by, username, password)
  	VALUES ($1, $2, $3, $4, $5, $6)`,
		[name, phone_number, role, created_by, login, createhash(password)],
	);

	return result;
}

export { createUser, getUsers, authUser, getUserByLogin };
