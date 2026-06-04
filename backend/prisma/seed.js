import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Пароль по умолчанию для всех тестовых учёток
const DEFAULT_PASSWORD = 'password123'

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const seedUsers = [
    { name: 'root', phoneNumber: '0000000000001', role: 15, login: 'root' },
    { name: 'Abdulaziz', phoneNumber: '0000000000002', role: 12, login: 'admin' },
    { name: 'Samad', phoneNumber: '0000000000003', role: 10, login: 'supervisor' },
    { name: 'Ilxom', phoneNumber: '0000000000004', role: 8, login: 'teacher' },
    { name: 'Saodat', phoneNumber: '0000000000005', role: 5, login: 'student' },
  ]

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { login: u.login },
      update: {},
      create: { ...u, passwordHash },
    })
  }

  console.log(`Seeded ${seedUsers.length} users. Default password: "${DEFAULT_PASSWORD}"`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
