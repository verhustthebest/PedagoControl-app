import { Router } from 'express'
import { login, me } from '../controllers/auth.controller'
import { authenticateBearerToken } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { loginBody } from '../validation/schemas'

const router = Router()

router.post('/auth/login', validate({ body: loginBody }), login)
router.get('/auth/me', authenticateBearerToken, me)

export default router
