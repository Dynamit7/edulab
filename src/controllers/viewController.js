import { join } from "path";
import { rootPath } from "../config.js";
import { query, getAllUsers } from "../lib/dbquery.js";

const ROLE_LABELS = { 15: "Root", 12: "Admin", 10: "Supervisor", 8: "Teacher", 5: "Student" };

function partial(name) {
  return join(rootPath, "src", "views", "partials", `${name}.ejs`);
}

function baseCtx(req) {
  return { user: req.user, roleLabel: ROLE_LABELS[req.user.role] ?? "User" };
}

// ── Dashboard ────────────────────────────────────────────────
export async function viewDashboard(req, res) {
  try {
    const user = req.user;
    const role = user.role;
    const stats = {};

    if (role >= 10) {
      const [s, t, g] = await Promise.all([
        query("SELECT COUNT(*) FROM users WHERE role=5 AND status=1"),
        query("SELECT COUNT(*) FROM users WHERE role=8 AND status=1"),
        query("SELECT COUNT(*) FROM groups WHERE status=1"),
      ]);
      stats.totalStudents = +s.rows[0].count;
      stats.totalTeachers = +t.rows[0].count;
      stats.activeGroups  = +g.rows[0].count;
    }
    if (role >= 12) {
      const r = await query("SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE created_at>=date_trunc('month',now())");
      stats.monthRevenue = +r.rows[0].t;
    }
    if (role === 8) {
      const [g, s] = await Promise.all([
        query("SELECT COUNT(*) FROM groups WHERE teacher_id=$1 AND status=1", [user.id]),
        query("SELECT COUNT(DISTINCT sg.student_id) FROM student_groups sg JOIN groups g ON g.id=sg.group_id WHERE g.teacher_id=$1 AND g.status=1 AND sg.left_at IS NULL", [user.id]),
      ]);
      stats.myGroups = +g.rows[0].count;
      stats.myStudents = +s.rows[0].count;
    }
    if (role === 5) {
      const [g, b] = await Promise.all([
        query("SELECT COUNT(*) FROM student_groups WHERE student_id=$1 AND left_at IS NULL", [user.id]),
        query("SELECT COALESCE(SUM(balance),0) AS b FROM student_groups WHERE student_id=$1", [user.id]),
      ]);
      stats.myGroups = +g.rows[0].count;
      stats.balance  = +b.rows[0].b;
    }

    const weekday = new Date().getDay() || 7;
    let sql, params;
    if (role === 5) {
      sql = `SELECT s.start_time,s.end_time,g.title AS group_title,d.title AS discipline,r.title AS room
             FROM schedule s JOIN groups g ON g.id=s.group_id JOIN disciplines d ON d.id=g.discipline_id
             JOIN rooms r ON r.id=s.room_id JOIN student_groups sg ON sg.group_id=g.id
             WHERE sg.student_id=$1 AND s.weekday=$2 AND sg.left_at IS NULL ORDER BY s.start_time`;
      params = [user.id, weekday];
    } else if (role === 8) {
      sql = `SELECT s.start_time,s.end_time,g.title AS group_title,d.title AS discipline,r.title AS room
             FROM schedule s JOIN groups g ON g.id=s.group_id JOIN disciplines d ON d.id=g.discipline_id
             JOIN rooms r ON r.id=s.room_id WHERE g.teacher_id=$1 AND s.weekday=$2 ORDER BY s.start_time`;
      params = [user.id, weekday];
    } else {
      sql = `SELECT s.start_time,s.end_time,g.title AS group_title,d.title AS discipline,r.title AS room
             FROM schedule s JOIN groups g ON g.id=s.group_id JOIN disciplines d ON d.id=g.discipline_id
             JOIN rooms r ON r.id=s.room_id WHERE s.weekday=$1 ORDER BY s.start_time`;
      params = [weekday];
    }
    const schedRows = await query(sql, params);
    const todaySchedule = schedRows.rows.map(r => ({
      ...r,
      start_time: r.start_time.slice(0,5),
      end_time:   r.end_time.slice(0,5),
    }));

    let recentActivity = [], myAttendance = [], groupAttendance = [];

    if (role >= 10) {
      const r = await query(`SELECT al.operation,al.table_name,al.changed_at,u.name AS changed_by_name
        FROM audit_log al LEFT JOIN users u ON u.id=al.changed_by ORDER BY al.changed_at DESC LIMIT 10`);
      recentActivity = r.rows.map(x => ({
        ...x,
        changed_at: new Date(x.changed_at).toLocaleString("ru-RU", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),
      }));
    }
    if (role === 5) {
      const r = await query(`SELECT a.visit_date,g.title AS group_title FROM attendance a
        JOIN groups g ON g.id=a.group_id WHERE a.student_id=$1 ORDER BY a.visit_date DESC LIMIT 10`, [user.id]);
      myAttendance = r.rows.map(x => ({ ...x, visit_date: new Date(x.visit_date).toLocaleDateString("ru-RU") }));
    }
    if (role === 8) {
      const r = await query(`SELECT g.title,
        COALESCE(COUNT(a.id),0) AS visited,
        COALESCE((SELECT COUNT(DISTINCT sg2.student_id) FROM student_groups sg2 WHERE sg2.group_id=g.id AND sg2.left_at IS NULL),0) AS total_students
        FROM groups g LEFT JOIN attendance a ON a.group_id=g.id AND a.visit_date>=now()-interval '30 days'
        WHERE g.teacher_id=$1 AND g.status=1 GROUP BY g.id,g.title ORDER BY g.title`, [user.id]);
      groupAttendance = r.rows.map(x => ({ ...x, percent: x.total_students > 0 ? Math.min(Math.round(+x.visited * 100 / +x.total_students), 100) : 0 }));
    }

    res.render(partial("dashboard"), { ...baseCtx(req), stats, todaySchedule, recentActivity, myAttendance, groupAttendance });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
}

// ── Groups list ───────────────────────────────────────────────
export async function viewGroups(req, res) {
  try {
    const user = req.user;
    const role = user.role;
    let sql, params = [];

    if (role === 5) {
      sql = `SELECT g.id,g.title,g.status,d.title AS discipline,u.name AS teacher_name,
               COUNT(sg2.student_id) AS student_count
             FROM groups g
             JOIN disciplines d ON d.id=g.discipline_id
             JOIN users u ON u.id=g.teacher_id
             JOIN student_groups sg ON sg.group_id=g.id
             LEFT JOIN student_groups sg2 ON sg2.group_id=g.id AND sg2.left_at IS NULL
             WHERE sg.student_id=$1 AND sg.left_at IS NULL
             GROUP BY g.id,g.title,g.status,d.title,u.name ORDER BY g.title`;
      params = [user.id];
    } else if (role === 8) {
      sql = `SELECT g.id,g.title,g.status,d.title AS discipline,u.name AS teacher_name,
               COUNT(sg.student_id) AS student_count
             FROM groups g JOIN disciplines d ON d.id=g.discipline_id
             JOIN users u ON u.id=g.teacher_id
             LEFT JOIN student_groups sg ON sg.group_id=g.id AND sg.left_at IS NULL
             WHERE g.teacher_id=$1 GROUP BY g.id,g.title,g.status,d.title,u.name ORDER BY g.title`;
      params = [user.id];
    } else {
      sql = `SELECT g.id,g.title,g.status,d.title AS discipline,u.name AS teacher_name,
               COUNT(sg.student_id) AS student_count
             FROM groups g JOIN disciplines d ON d.id=g.discipline_id
             JOIN users u ON u.id=g.teacher_id
             LEFT JOIN student_groups sg ON sg.group_id=g.id AND sg.left_at IS NULL
             GROUP BY g.id,g.title,g.status,d.title,u.name ORDER BY g.title`;
    }

    const result = await query(sql, params);
    res.render(partial("groups"), { ...baseCtx(req), groups: result.rows, selectedGroup: null, students: [], schedule: [] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
}

// ── Group detail ──────────────────────────────────────────────
export async function viewGroupDetail(req, res) {
  try {
    const user = req.user;
    const groupId = parseInt(req.params.id);

    const [gRes, studRes, schedRes] = await Promise.all([
      query(`SELECT g.id,g.title,d.title AS discipline,u.name AS teacher_name,b.title AS branch
             FROM groups g JOIN disciplines d ON d.id=g.discipline_id
             JOIN users u ON u.id=g.teacher_id JOIN branches b ON b.id=g.branch_id
             WHERE g.id=$1`, [groupId]),
      query(`SELECT u.id,u.name,u.phone_number,sg.balance,sg.frozen_till
             FROM student_groups sg JOIN users u ON u.id=sg.student_id
             WHERE sg.group_id=$1 AND sg.left_at IS NULL ORDER BY u.name`, [groupId]),
      query(`SELECT s.weekday,s.start_time,s.end_time,r.title AS room
             FROM schedule s JOIN rooms r ON r.id=s.room_id
             WHERE s.group_id=$1 ORDER BY s.weekday,s.start_time`, [groupId]),
    ]);

    if (gRes.rows.length === 0) return res.status(404).send("Группа не найдена");

    const scheduleRows = schedRes.rows.map(r => ({
      ...r,
      start_time: r.start_time.slice(0,5),
      end_time:   r.end_time.slice(0,5),
    }));

    res.render(partial("groups"), {
      ...baseCtx(req),
      groups: [],
      selectedGroup: gRes.rows[0],
      students: studRes.rows,
      schedule: scheduleRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
}

// ── Schedule ──────────────────────────────────────────────────
export async function viewSchedule(req, res) {
  try {
    const user = req.user;
    const role = user.role;
    let sql, params = [];

    if (role === 5) {
      sql = `SELECT s.weekday,s.start_time,s.end_time,g.title AS group_title,d.title AS discipline,r.title AS room
             FROM schedule s JOIN groups g ON g.id=s.group_id JOIN disciplines d ON d.id=g.discipline_id
             JOIN rooms r ON r.id=s.room_id JOIN student_groups sg ON sg.group_id=g.id
             WHERE sg.student_id=$1 AND sg.left_at IS NULL ORDER BY s.weekday,s.start_time`;
      params = [user.id];
    } else if (role === 8) {
      sql = `SELECT s.weekday,s.start_time,s.end_time,g.title AS group_title,d.title AS discipline,r.title AS room
             FROM schedule s JOIN groups g ON g.id=s.group_id JOIN disciplines d ON d.id=g.discipline_id
             JOIN rooms r ON r.id=s.room_id WHERE g.teacher_id=$1 ORDER BY s.weekday,s.start_time`;
      params = [user.id];
    } else {
      sql = `SELECT s.weekday,s.start_time,s.end_time,g.title AS group_title,d.title AS discipline,r.title AS room
             FROM schedule s JOIN groups g ON g.id=s.group_id JOIN disciplines d ON d.id=g.discipline_id
             JOIN rooms r ON r.id=s.room_id ORDER BY s.weekday,s.start_time`;
    }

    const result = await query(sql, params);
    const rows = result.rows.map(r => ({
      ...r,
      start_time: r.start_time.slice(0,5),
      end_time:   r.end_time.slice(0,5),
    }));
    res.render(partial("schedule"), { ...baseCtx(req), schedule: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
}

// ── Attendance ────────────────────────────────────────────────
export async function viewAttendance(req, res) {
  try {
    const user = req.user;
    const role = user.role;

    if (role === 5) {
      const r = await query(`SELECT a.visit_date,g.title AS group_title FROM attendance a
        JOIN groups g ON g.id=a.group_id WHERE a.student_id=$1 ORDER BY a.visit_date DESC`, [user.id]);
      const attendance = r.rows.map(x => ({ ...x, visit_date: new Date(x.visit_date).toLocaleDateString("ru-RU") }));
      return res.render(partial("attendance"), { ...baseCtx(req), attendance, groups: [] });
    }

    let groupsSql, params = [];
    if (role === 8) {
      groupsSql = "SELECT id,title FROM groups WHERE teacher_id=$1 AND status=1 ORDER BY title";
      params = [user.id];
    } else {
      groupsSql = "SELECT id,title FROM groups WHERE status=1 ORDER BY title";
    }

    const gRes = await query(groupsSql, params);
    const groups = await Promise.all(gRes.rows.map(async g => {
      const [cnt, recent] = await Promise.all([
        query(`SELECT COUNT(*) AS visited,
                 (SELECT COUNT(DISTINCT sg.student_id) FROM student_groups sg WHERE sg.group_id=$1 AND sg.left_at IS NULL) AS total_students
               FROM attendance WHERE group_id=$1 AND visit_date>=now()-interval '30 days'`, [g.id]),
        query(`SELECT a.visit_date,u.name AS student_name FROM attendance a
               JOIN users u ON u.id=a.student_id WHERE a.group_id=$1
               ORDER BY a.visit_date DESC LIMIT 5`, [g.id]),
      ]);
      const { visited, total_students } = cnt.rows[0];
      const total = +total_students;
      const percent = total > 0 ? Math.min(Math.round(+visited * 100 / total), 100) : 0;
      const recentRows = recent.rows.map(x => ({ ...x, visit_date: new Date(x.visit_date).toLocaleDateString("ru-RU") }));
      return { ...g, visited: +visited, total, percent, recent: recentRows };
    }));

    res.render(partial("attendance"), { ...baseCtx(req), attendance: [], groups });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
}

// ── Users ─────────────────────────────────────────────────────
export function viewUsers(req, res) {
  if (req.user.role < 10) return res.status(403).send("Нет доступа");
  res.render(partial("users"), baseCtx(req));
}
