import prisma from '../lib/prisma.js'
import { ROLES } from '../lib/roles.js'
import { formatTime } from '../lib/format.js'

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// GET /api/dashboard — сводка под роль текущего пользователя
export async function getDashboard(req, res) {
  const { id: userId, role } = req.user
  const stats = {}

  if (role >= ROLES.SUPERVISOR) {
    const [totalStudents, totalTeachers, activeGroups] = await Promise.all([
      prisma.user.count({ where: { role: ROLES.STUDENT, status: 1 } }),
      prisma.user.count({ where: { role: ROLES.TEACHER, status: 1 } }),
      prisma.group.count({ where: { status: 1 } }),
    ])
    Object.assign(stats, { totalStudents, totalTeachers, activeGroups })
  }

  if (role >= ROLES.ADMIN) {
    const agg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfMonth() } },
    })
    stats.monthRevenue = agg._sum.amount ?? 0
  }

  if (role === ROLES.TEACHER) {
    const [myGroups, myStudents] = await Promise.all([
      prisma.group.count({ where: { teacherId: userId, status: 1 } }),
      prisma.studentGroup.count({
        where: { leftAt: null, group: { teacherId: userId, status: 1 } },
      }),
    ])
    Object.assign(stats, { myGroups, myStudents })
  }

  if (role === ROLES.STUDENT) {
    const [myGroups, balanceAgg] = await Promise.all([
      prisma.studentGroup.count({ where: { studentId: userId, leftAt: null } }),
      prisma.studentGroup.aggregate({ _sum: { balance: true }, where: { studentId: userId } }),
    ])
    stats.myGroups = myGroups
    stats.balance = balanceAgg._sum.balance ?? 0
  }

  // Расписание на сегодня
  const weekday = new Date().getDay() || 7
  let schedWhere = { weekday }
  if (role === ROLES.TEACHER) {
    schedWhere.group = { teacherId: userId }
  } else if (role === ROLES.STUDENT) {
    schedWhere.group = { studentGroups: { some: { studentId: userId, leftAt: null } } }
  }

  const sched = await prisma.schedule.findMany({
    where: schedWhere,
    orderBy: { startTime: 'asc' },
    select: {
      startTime: true,
      endTime: true,
      room: { select: { title: true } },
      group: { select: { title: true, discipline: { select: { title: true } } } },
    },
  })

  const todaySchedule = sched.map((s) => ({
    startTime: formatTime(s.startTime),
    endTime: formatTime(s.endTime),
    room: s.room.title,
    groupTitle: s.group.title,
    discipline: s.group.discipline.title,
  }))

  // Дополнительные блоки под роль
  let recentActivity = []
  let myAttendance = []

  if (role >= ROLES.SUPERVISOR) {
    const rows = await prisma.auditLog.findMany({
      orderBy: { changedAt: 'desc' },
      take: 10,
      select: {
        operation: true,
        tableName: true,
        changedAt: true,
        changedBy: { select: { name: true } },
      },
    })
    recentActivity = rows.map((r) => ({
      operation: r.operation,
      tableName: r.tableName,
      changedAt: r.changedAt,
      changedByName: r.changedBy?.name ?? null,
    }))
  }

  if (role === ROLES.STUDENT) {
    const rows = await prisma.attendance.findMany({
      where: { studentId: userId },
      orderBy: { visitDate: 'desc' },
      take: 10,
      select: { visitDate: true, group: { select: { title: true } } },
    })
    myAttendance = rows.map((r) => ({ visitDate: r.visitDate, groupTitle: r.group.title }))
  }

  res.json({ stats, todaySchedule, recentActivity, myAttendance })
}
