
export function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err)

  // Нарушение уникальности Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Запись с такими данными уже существует' })
  }

  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
}
