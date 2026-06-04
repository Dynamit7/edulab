// Числовые роли учебного центра
export const ROLES = {
  STUDENT: 5,
  TEACHER: 8,
  SUPERVISOR: 10,
  ADMIN: 12,
  ROOT: 15,
}

export const ROLE_LABELS = {
  5: 'Student',
  8: 'Teacher',
  10: 'Supervisor',
  12: 'Admin',
  15: 'Root',
}

// Какие роли пользователь может назначать (строго ниже своей)
export const ASSIGNABLE_ROLES = {
  15: [12, 10, 8, 5],
  12: [10, 8, 5],
  10: [8, 5],
  8: [5],
}
