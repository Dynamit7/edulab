
export function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role < minRole) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}
