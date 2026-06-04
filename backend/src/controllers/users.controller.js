import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { hashPassword } from '../lib/hash.js'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '../lib/roles.js'

const PAGE_SIZE = 10

const listQuerySchema = z.object({
  cursor: z.coerce.number().int().min(0).optional(),
})

const createUserSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  login: z.string().min(1, 'Логин обязателен').max(50),
  phoneNumber: z.string().min(1, 'Телефон обязателен').max(13),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  role: z.coerce.number().int(),
  email: z.string().email().optional().nullable(),
  telegramUsername: z.string().optional().nullable(),
})

export async function getUsers(req, res) {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query' })
  }
  const cursor = parsed.data.cursor ?? 0

  const users = await prisma.user.findMany({
    where: { id: { gt: cursor }, role: { lte: req.user.role } },
    orderBy: { id: 'asc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      login: true,
      phoneNumber: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  const nextCursor = users.length === PAGE_SIZE ? users[users.length - 1].id : null

  res.json({
    users: users.map((u) => ({ ...u, roleLabel: ROLE_LABELS[u.role] ?? 'User' })),
    nextCursor,
  })
}

// POST /api/users  — создать пользователя (роль строго ниже своей)
export async function createUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
  }

  const { name, login, phoneNumber, password, role, email, telegramUsername } = parsed.data

  const allowed = ASSIGNABLE_ROLES[req.user.role]
  if (!allowed || !allowed.includes(role)) {
    return res.status(403).json({ error: 'Нельзя назначить эту роль' })
  }

  const existing = await prisma.user.findUnique({ where: { login } })
  if (existing) {
    return res.status(409).json({ error: 'Такой логин уже занят' })
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      login,
      phoneNumber,
      role,
      email: email || null,
      telegramUsername: telegramUsername || null,
      passwordHash,
      createdById: req.user.id,
    },
    select: { id: true, name: true, login: true, role: true },
  })

  res.status(201).json({ ...user, roleLabel: ROLE_LABELS[user.role] ?? 'User' })
}

// GET /api/users/assignable-roles  — какие роли текущий пользователь может выдавать
export function getAssignableRoles(req, res) {
  const values = ASSIGNABLE_ROLES[req.user.role] ?? []
  res.json(values.map((v) => ({ value: v, label: ROLE_LABELS[v] })))
}
