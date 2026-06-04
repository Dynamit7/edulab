import { verifyToken } from '../lib/jwt.js'

export function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      login: decoded.login,
      name: decoded.name,
    }

    next()
  } catch {
    return res.status(401).json({ error: 'Невалидный или истёкший токен' })
  }
}
