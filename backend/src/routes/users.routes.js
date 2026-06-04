import { Router } from 'express'
import { getUsers, createUser, getAssignableRoles } from '../controllers/users.controller.js'
import { protect } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { ROLES } from '../lib/roles.js'

const router = Router()

router.use(protect)

router.get('/assignable-roles', getAssignableRoles)
router.get('/', requireRole(ROLES.SUPERVISOR), getUsers)
router.post('/', requireRole(ROLES.TEACHER), createUser)

export default router
