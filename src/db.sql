CREATE DATABASE edulab;

CREATE TABLE "roles" (
  "id" serial PRIMARY KEY,
  "title" varchar(255) NOT NULL,
  "privilege" int NOT NULL DEFAULT 1,
  "active" int NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "username" varchar(32) not null unique,
  "password" varchar(50) not null
);

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "name" varchar NOT NULL,
  "phone_number" varchar(13) UNIQUE NOT NULL,
  "telegram_username" varchar UNIQUE,
  "email" varchar UNIQUE,
  "role" int NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "status" int NOT NULL DEFAULT 1,
  "created_by" integer NOT NULL,
  "login" varchar(50) not null,
  "password" varchar not null
);


CREATE TABLE "branches" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "address" varchar NOT NULL DEFAULT 'online',
  "phone_number" varchar(13) NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "telegram_username" varchar NOT NULL,
  "deleted" int NOT NULL DEFAULT 1,
  "status" int NOT NULL DEFAULT 1
);

CREATE TABLE "rooms" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "branch" int NOT NULL,
  "places" int NOT NULL
);

CREATE TABLE "discipline" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "created_by" int NOT NULL,
  "status" int NOT NULL DEFAULT 1
);

CREATE TABLE "groups" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "teacher" int NOT NULL,
  "discipline" int NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "created_by" int NOT NULL,
  "branch" int NOT NULL,
  "status" int NOT NULL DEFAULT 1
);

CREATE TABLE "payments" (
  "id" serial PRIMARY KEY,
  "student" int NOT NULL,
  "group" int NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "created_by" int NOT NULL,
  "sum" int NOT NULL,
  "status" varchar NOT NULL
);

CREATE TABLE "student_to_groups" (
  "id" serial PRIMARY KEY,
  "student" int NOT NULL,
  "group" int NOT NULL,
  "balance" int NOT NULL DEFAULT 0,
  "invited_at" timestamptz NOT NULL DEFAULT (now()),
  "freezed_till" timestamptz DEFAULT null,
  "left_at" timestamptz DEFAULT null
);

CREATE TABLE "schedule" (
  "id" serial PRIMARY KEY,
  "group" int NOT NULL,
  "weekday" int NOT NULL DEFAULT 1,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "room" int NOT NULL
);

CREATE TABLE "attendance" (
  "id" serial PRIMARY KEY,
  "student" int NOT NULL,
  "group" int NOT NULL,
  "visit" date NOT NULL,
  "creatred_by" int NOT NULL
);

CREATE TABLE "audit_log" (
  "id" bigserial PRIMARY KEY,
  "table_name" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "record_id" TEXT,
  "old_data" JSONB,
  "new_data" JSONB,
  "changed_by" TEXT,
  "changed_at" "TIMESTAMPTZ" NOT NULL DEFAULT (now())
);

INSERT INTO roles (
	title,
	privilege
) Values (
	'Administrator',
	15
);

INSERT INTO users (
	name,
	phone_number,
	role,
	created_by,
	username,
	password
)Values(
	'root',
	'0000000000000',
	1,
	0,
	'root',
	'123456789'
);

