import { Router } from 'express'
import { getSchools } from '../controllers/school.controller'

const router = Router()

router.get('/schools', getSchools)

export default router
