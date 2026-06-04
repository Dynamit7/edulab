import prisma from '../lib/prisma.js'
import { ROLES } from '../lib/roles.js'
import { formatTime } from '../lib/format.js'

// GET /api/groups — список групп с учётом роли
export async function getGroups(req, res) {
  const { id: userId, role } = req.user

  
  let where = {}
  if (role === ROLES.TEACHER) {
    where = { teacherId: userId }
  } else if (role === ROLES.STUDENT) {
    where = { studentGroups: { some: { studentId: userId, leftAt: null } } }
  }

  const groups = await prisma.group.findMany({
    where,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      status: true,
      discipline: { select: { title: true } },
      teacher: { select: { name: true } },
      _count: { select: { studentGroups: { where: { leftAt: null } } } },
    },
  })

  res.json(
    groups.map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      discipline: g.discipline.title,
      teacherName: g.teacher.name,
      studentCount: g._count.studentGroups,
    })),
  )
}

// GET /api/groups/:id — детали группы со студентами и расписанием
export async function getGroupDetail(req, res) {
  const groupId = Number(req.params.id)
  if (!Number.isInteger(groupId)) {
    return res.status(400).json({ error: 'Некорректный id' })
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      title: true,
      discipline: { select: { title: true } },
      teacher: { select: { name: true } },
      branch: { select: { title: true } },
      studentGroups: {
        where: { leftAt: null },
        orderBy: { student: { name: 'asc' } },
        select: {
          balance: true,
          frozenTill: true,
          student: { select: { id: true, name: true, phoneNumber: true } },
        },
      },
      schedules: {
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
        select: {
          weekday: true,
          startTime: true,
          endTime: true,
          room: { select: { title: true } },
        },
      },
    },
  })

  if (!group) {
    return res.status(404).json({ error: 'Группа не найдена' })
  }

  res.json({
    id: group.id,
    title: group.title,
    discipline: group.discipline.title,
    teacherName: group.teacher.name,
    branch: group.branch.title,
    students: group.studentGroups.map((sg) => ({
      id: sg.student.id,
      name: sg.student.name,
      phoneNumber: sg.student.phoneNumber,
      balance: sg.balance,
      frozenTill: sg.frozenTill,
    })),
    schedule: group.schedules.map((s) => ({
      weekday: s.weekday,
      startTime: formatTime(s.startTime),
      endTime: formatTime(s.endTime),
      room: s.room.title,
    })),
  })
}
