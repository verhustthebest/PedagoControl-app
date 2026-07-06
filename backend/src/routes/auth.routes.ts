import { Router } from 'express'
import { login, me } from '../controllers/auth.controller'
import { authenticateBearerToken } from '../middleware/auth.middleware'

const router = Router()

router.post('/auth/login', login)
router.get('/auth/me', authenticateBearerToken, me)

export default router
