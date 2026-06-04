import { Router } from 'express'
import { getGroups, getGroupDetail } from '../controllers/groups.controller.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)

router.get('/', getGroups)
router.get('/:id', getGroupDetail)

export default router
