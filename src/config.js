import dotenv from "dotenv";
dotenv.config();

import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Получаем путь к текущему файлу
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let rootPath = join(__dirname, "..");

const dbconfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_BASE,
};

const jwtsecret = process.env.JWT_SECRET;

export { dbconfig, jwtsecret, rootPath };
