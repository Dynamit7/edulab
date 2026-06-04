-- CHECK-ограничения на уровне БД (Prisma не выражает их в schema.prisma)

-- Роль может быть только одной из разрешённых
ALTER TABLE "users"
  ADD CONSTRAINT "chk_user_role" CHECK ("role" IN (5, 8, 10, 12, 15));

-- День недели расписания: 1..7
ALTER TABLE "schedule"
  ADD CONSTRAINT "chk_schedule_weekday" CHECK ("weekday" BETWEEN 1 AND 7);
