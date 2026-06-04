# EduLab — Backend API

REST API для управления учебным центром. Express 5 (ESM) + Prisma + PostgreSQL + JWT.

## Структура

```
backend/
├── prisma/
│   ├── schema.prisma        # модели БД (users, groups, schedule, ...)
│   └── seed.js              # тестовые пользователи
└── src/
    ├── server.js            # точка входа (dotenv + listen)
    ├── app.js               # express, монтирование роутов, errorHandler
    ├── lib/
    │   ├── prisma.js        # singleton PrismaClient
    │   ├── jwt.js           # sign / verify
    │   ├── hash.js          # bcrypt
    │   ├── roles.js         # роли и матрица назначения
    │   └── format.js        # форматирование времени
    ├── middleware/
    │   ├── auth.js          # protect (Bearer)
    │   ├── requireRole.js   # гард по минимальной роли
    │   └── errorHandler.js  # единый обработчик ошибок
    ├── controllers/         # *.controller.js — логика + zod-валидация
    └── routes/              # *.routes.js — маршруты
```

## Роли

| Значение | Роль       |
|----------|------------|
| 5        | Student    |
| 8        | Teacher    |
| 10       | Supervisor |
| 12       | Admin      |
| 15       | Root       |

Пользователь может назначать только роли строго ниже своей.

## Запуск

```bash
npm install
cp .env.example .env          # заполнить DATABASE_URL и JWT_SECRET
npm run prisma:migrate        # создать схему в БД
npm run seed                  # тестовые пользователи (пароль: password123)
npm run dev
```

## Эндпоинты

| Метод | Путь                          | Доступ            | Описание                      |
|-------|-------------------------------|-------------------|-------------------------------|
| POST  | `/api/auth/login`             | публично          | вход, выдаёт JWT              |
| GET   | `/api/auth/me`                | авторизованные    | текущий пользователь         |
| GET   | `/api/users`                  | role ≥ 10         | список (keyset-пагинация)    |
| POST  | `/api/users`                  | role ≥ 8          | создать пользователя         |
| GET   | `/api/users/assignable-roles` | авторизованные    | какие роли можно назначить   |
| GET   | `/api/groups`                 | авторизованные    | список групп (под роль)      |
| GET   | `/api/groups/:id`             | авторизованные    | детали группы                |
| GET   | `/api/schedule`               | авторизованные    | расписание (под роль)        |
| GET   | `/api/attendance`             | авторизованные    | посещаемость (под роль)      |
| GET   | `/api/dashboard`              | авторизованные    | сводка под роль              |

Авторизация: заголовок `Authorization: Bearer <token>`.
