import prisma from '../lib/prisma.js'
import { ROLES } from '../lib/roles.js'
import { formatTime } from '../lib/format.js'

// GET /api/schedule — расписание с учётом роли
export async function getSchedule(req, res) {
  const { id: userId, role } = req.user

  let where = {}
  if (role === ROLES.TEACHER) {
    where = { group: { teacherId: userId } }
  } else if (role === ROLES.STUDENT) {
    where = { group: { studentGroups: { some: { studentId: userId, leftAt: null } } } }
  }

  const rows = await prisma.schedule.findMany({
    where,
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    select: {
      weekday: true,
      startTime: true,
      endTime: true,
      room: { select: { title: true } },
      group: {
        select: {
          title: true,
          discipline: { select: { title: true } },
        },
      },
    },
  })

  res.json(
    rows.map((r) => ({
      weekday: r.weekday,
      startTime: formatTime(r.startTime),
      endTime: formatTime(r.endTime),
      room: r.room.title,
      groupTitle: r.group.title,
      discipline: r.group.discipline.title,
    })),
  )
}
