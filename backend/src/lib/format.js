// Prisma возвращает поля @db.Time как Date — форматируем в "HH:MM"
export function formatTime(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return d.toISOString().slice(11, 16)
}
