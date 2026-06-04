import prisma from '../lib/prisma.js'
import { ROLES } from '../lib/roles.js'

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

// GET /api/attendance
//  - student: личная история посещений
//  - teacher/supervisor/admin: сводка по группам за 30 дней
export async function getAttendance(req, res) {
  const { id: userId, role } = req.user

  if (role === ROLES.STUDENT) {
    const rows = await prisma.attendance.findMany({
      where: { studentId: userId },
      orderBy: { visitDate: 'desc' },
      select: { visitDate: true, group: { select: { title: true } } },
    })
    
    return res.json({
      type: 'student',
      attendance: rows.map((r) => ({ visitDate: r.visitDate, groupTitle: r.group.title })),
    })
  }

  // Группы: учителю — только свои
  const groupWhere = { status: 1 }
  if (role === ROLES.TEACHER) groupWhere.teacherId = userId

  const groups = await prisma.group.findMany({
    where: groupWhere,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          studentGroups: { where: { leftAt: null } },
          attendances: { where: { visitDate: { gte: THIRTY_DAYS_AGO() } } },
        },
      },
      attendances: {
        orderBy: { visitDate: 'desc' },
        take: 5,
        select: { visitDate: true, student: { select: { name: true } } },
      },
    },
  })

  const result = groups.map((g) => {
    const total = g._count.studentGroups
    const visited = g._count.attendances
    const percent = total > 0 ? Math.min(Math.round((visited * 100) / total), 100) : 0
    return {
      id: g.id,
      title: g.title,
      total,
      visited,
      percent,
      recent: g.attendances.map((a) => ({ visitDate: a.visitDate, studentName: a.student.name })),
    }
  })

  res.json({ type: 'summary', groups: result })
}
