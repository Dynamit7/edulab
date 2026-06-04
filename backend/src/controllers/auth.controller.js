import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { comparePassword } from '../lib/hash.js'
import { signToken } from '../lib/jwt.js'
import { ROLE_LABELS } from '../lib/roles.js'

const loginSchema = z.object({
  login: z.string().min(1, 'Логин обязателен'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
  }

  const { login, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { login } })
  if (!user) {
    return res.status(401).json({ error: 'Неверный логин или пароль' })
  }

  const isValid = await comparePassword(password, user.passwordHash)
  if (!isValid) {
    return res.status(401).json({ error: 'Неверный логин или пароль' })
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    login: user.login,
    name: user.name,
  })

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role] ?? 'User',
    },
  })
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      login: true,
      email: true,
      phoneNumber: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  return res.json({ ...user, roleLabel: ROLE_LABELS[user.role] ?? 'User' })
}
