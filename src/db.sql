CREATE DATABASE edulab;

CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR NOT NULL,
  phone_number      VARCHAR(13) UNIQUE NOT NULL,
  email             VARCHAR UNIQUE,
  telegram_username VARCHAR UNIQUE,
  role              INT NOT NULL DEFAULT 5
                    CONSTRAINT chk_user_role CHECK (role IN (5, 8, 10, 12, 15)),
  login             VARCHAR(50) UNIQUE NOT NULL,
  password_hash     VARCHAR NOT NULL,
  status            INT NOT NULL DEFAULT 1,
  created_by        INT REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE branches (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR NOT NULL,
  address      VARCHAR NOT NULL DEFAULT 'online',
  phone_number VARCHAR(13),
  email        VARCHAR UNIQUE,
  status       INT NOT NULL DEFAULT 1
);

CREATE TABLE rooms (
  id        SERIAL PRIMARY KEY,
  title     VARCHAR NOT NULL,
  branch_id INT NOT NULL REFERENCES branches(id),
  capacity  INT NOT NULL
);

CREATE TABLE disciplines (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR NOT NULL,
  status     INT NOT NULL DEFAULT 1,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE groups (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR NOT NULL,
  teacher_id    INT NOT NULL REFERENCES users(id),
  discipline_id INT NOT NULL REFERENCES disciplines(id),
  branch_id     INT NOT NULL REFERENCES branches(id),
  status        INT NOT NULL DEFAULT 1,
  created_by    INT REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_groups (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES users(id),
  group_id    INT NOT NULL REFERENCES groups(id),
  balance     INT NOT NULL DEFAULT 0,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  frozen_till TIMESTAMPTZ,
  left_at     TIMESTAMPTZ,
  UNIQUE (student_id, group_id)
);

CREATE TABLE schedule (
  id         SERIAL PRIMARY KEY,
  group_id   INT NOT NULL REFERENCES groups(id),
  room_id    INT NOT NULL REFERENCES rooms(id),
  weekday    INT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL
);

CREATE TABLE attendance (
  id         SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(id),
  group_id   INT NOT NULL REFERENCES groups(id),
  visit_date DATE NOT NULL,
  created_by INT REFERENCES users(id),
  UNIQUE (student_id, group_id, visit_date)
);

CREATE TABLE payments (
  id         SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(id),
  group_id   INT NOT NULL REFERENCES groups(id),
  amount     INT NOT NULL,
  status     VARCHAR NOT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation  TEXT NOT NULL,
  record_id  INT,
  old_data   JSONB,
  new_data   JSONB,
  changed_by INT REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Начальные данные
INSERT INTO users (name, phone_number, role, login, password_hash, created_by)
VALUES ('root', '0000000000000', 15, 'root',
  'a33a302adb5adde263079ea3022ddce7d968867306fe8392b04a249eb155ca7a7333c9f0ecffef3b0b250dee171711ca1266683e1f43c99f8fc529fcc3c5b424',
  NULL);

INSERT INTO users (name, phone_number, role, login, password_hash, created_by)
VALUES ('Abdulaziz', '0000000000000', 12, 'admin',
  'a33a302adb5adde263079ea3022ddce7d968867306fe8392b04a249eb155ca7a7333c9f0ecffef3b0b250dee171711ca1266683e1f43c99f8fc529fcc3c5b424',
  NULL);

INSERT INTO users (name, phone_number, role, login, password_hash, created_by)
VALUES ('Samad', '0000000000000', 10, 'superviser',
  'a33a302adb5adde263079ea3022ddce7d968867306fe8392b04a249eb155ca7a7333c9f0ecffef3b0b250dee171711ca1266683e1f43c99f8fc529fcc3c5b424',
NULL);

INSERT INTO users (name, phone_number, role, login, password_hash, created_by)
VALUES ('Ilxom', '0000000000000', 8, 'superviser',
  'a33a302adb5adde263079ea3022ddce7d968867306fe8392b04a249eb155ca7a7333c9f0ecffef3b0b250dee171711ca1266683e1f43c99f8fc529fcc3c5b424',
NULL);

INSERT INTO users (name, phone_number, role, login, password_hash, created_by)
VALUES ('Saodat', '0000000000000', 5, 'student',
  'a33a302adb5adde263079ea3022ddce7d968867306fe8392b04a249eb155ca7a7333c9f0ecffef3b0b250dee171711ca1266683e1f43c99f8fc529fcc3c5b424',
NULL);
-- Индексы
CREATE INDEX idx_users_login           ON users(login);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_groups_teacher_id     ON groups(teacher_id);
CREATE INDEX idx_groups_discipline_id  ON groups(discipline_id);
CREATE INDEX idx_groups_branch_id      ON groups(branch_id);
CREATE INDEX idx_sg_student_id         ON student_groups(student_id);
CREATE INDEX idx_sg_group_id           ON student_groups(group_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_group_id   ON attendance(group_id);
CREATE INDEX idx_attendance_visit_date ON attendance(visit_date);
CREATE INDEX idx_payments_student_id   ON payments(student_id);
CREATE INDEX idx_payments_created_at   ON payments(created_at);
CREATE INDEX idx_schedule_group_id     ON schedule(group_id);
CREATE INDEX idx_schedule_room_id      ON schedule(room_id);
CREATE INDEX idx_audit_table_name      ON audit_log(table_name);
CREATE INDEX idx_audit_changed_at      ON audit_log(changed_at);