# EduLab — карта базы данных

Обозначения: `1 ──< много` (один-ко-многим), `★` = первичный ключ, `FK` = внешний ключ, `?` = необязательное (NULL).

## Общая карта связей

```
                          ┌──────────────────────────┐
                          │          USER            │  ← центральная таблица
                          │  (студенты/учителя/админы)│
                          └──────────────────────────┘
            ┌──────────────┬───────────┬──────────────┬───────────────┐
            │ teacher      │ student   │ created_by    │ changed_by    │
            ▼ (учит)       ▼ (учится)  ▼ (создал)      ▼ (изменил)
        ┌────────┐   ┌──────────────┐  (во всех)   ┌───────────┐
        │ GROUP  │   │ STUDENT_GROUP│              │ AUDIT_LOG │
        └────────┘   └──────────────┘              └───────────┘

   BRANCH ──< ROOM ──< SCHEDULE >── GROUP ──< STUDENT_GROUP >── USER
     │                                │
     └──< GROUP                       ├──< ATTENDANCE  >── USER (student)
   DISCIPLINE ──< GROUP               ├──< PAYMENT     >── USER (student)
                                      └──< SCHEDULE    >── ROOM
```

---

## Таблицы по отдельности

### USER (users)
```
★ id
  name
  phone_number  (unique)
  email?        (unique)
  telegram_username? (unique)
  role          5=Student 8=Teacher 10=Supervisor 12=Admin 15=Root
  login         (unique)
  password_hash
  status
  created_by? ──┐  (FK на саму себя: кто создал юзера)
  created_at    │
              ◄─┘  self-reference
```
**Связи USER:**
- `1 ──< many GROUP` (как **учитель**)
- `1 ──< many STUDENT_GROUP` (как **студент** в группах)
- `1 ──< many ATTENDANCE / PAYMENT` (как **студент**)
- `1 ──< many DISCIPLINE / GROUP / ATTENDANCE / PAYMENT` (как **создатель**)
- `1 ──< many AUDIT_LOG` (как **изменивший**)
- `1 ──< many USER` (как **создатель** других юзеров)

---

### BRANCH (branches) — филиал
```
★ id
  title
  address  (default "online")
  phone_number?
  email?   (unique)
  status
```
`BRANCH 1 ──< many ROOM`  ·  `BRANCH 1 ──< many GROUP`

---

### ROOM (rooms) — кабинет
```
★ id
  title
  capacity
  branch_id  FK ──> BRANCH
```
`ROOM 1 ──< many SCHEDULE`

---

### DISCIPLINE (disciplines) — предмет
```
★ id
  title
  status
  created_by?  FK ──> USER
```
`DISCIPLINE 1 ──< many GROUP`

---

### GROUP (groups) — учебная группа  ⭐ узловая таблица
```
★ id
  title
  status
  teacher_id     FK ──> USER (учитель)
  discipline_id  FK ──> DISCIPLINE
  branch_id      FK ──> BRANCH
  created_by?    FK ──> USER
```
**Связи GROUP:**
- `1 ──< many STUDENT_GROUP` (состав студентов)
- `1 ──< many SCHEDULE` (расписание)
- `1 ──< many ATTENDANCE` (посещения)
- `1 ──< many PAYMENT` (платежи)

---

### STUDENT_GROUP (student_groups) — связь «студент ↔ группа»
```
★ id
  student_id  FK ──> USER     ┐
  group_id    FK ──> GROUP    ┘  UNIQUE(student_id, group_id)
  balance
  joined_at
  frozen_till?   (заморозка)
  left_at?       (ушёл из группы; NULL = ещё учится)
```
> Это «таблица-мост»: реализует связь **много-ко-многим** между USER и GROUP
> плюс хранит баланс/заморозку конкретного студента в конкретной группе.

---

### SCHEDULE (schedule) — расписание
```
★ id
  group_id    FK ──> GROUP
  room_id     FK ──> ROOM
  weekday     1–7
  start_time
  end_time
```

---

### ATTENDANCE (attendance) — посещаемость
```
★ id
  student_id   FK ──> USER     ┐
  group_id     FK ──> GROUP    ┤ UNIQUE(student_id, group_id, visit_date)
  visit_date                   ┘  → нельзя отметить дважды за день
  created_by?  FK ──> USER
```

---

### PAYMENT (payments) — платежи
```
★ id
  student_id   FK ──> USER
  group_id     FK ──> GROUP
  amount
  status
  created_by?  FK ──> USER
  created_at
```

---

### AUDIT_LOG (audit_log) — журнал изменений
```
★ id (BigInt)
  table_name
  operation       (INSERT/UPDATE/DELETE)
  record_id?
  old_data?  (JSON)
  new_data?  (JSON)
  changed_by? FK ──> USER
  changed_at
```

---

## Кратко: кто на кого ссылается

| Таблица        | Ссылается на (FK)                          |
|----------------|--------------------------------------------|
| users          | users (created_by) — сама на себя          |
| rooms          | branches                                   |
| disciplines    | users                                      |
| groups         | users(teacher), disciplines, branches, users(created_by) |
| student_groups | users(student), groups                     |
| schedule       | groups, rooms                              |
| attendance     | users(student), groups, users(created_by)  |
| payments       | users(student), groups, users(created_by)  |
| audit_log      | users(changed_by)                          |
```
