import { Router } from 'express'
import { getAttendance } from '../controllers/attendance.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)
router.get('/', getAttendance)

export default router
