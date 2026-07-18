import { Router } from 'express'
import { csrf, login, logout, logoutAll, me, refresh } from '../controllers/auth.controller'
import { authenticateBearerToken } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { loginBody } from '../validation/schemas'

const router = Router()

router.post('/auth/login', validate({ body: loginBody }), login)
router.get('/auth/csrf', csrf)
router.post('/auth/refresh', refresh)
router.post('/auth/logout', logout)
router.post('/auth/logout-all', authenticateBearerToken, logoutAll)
router.get('/auth/me', authenticateBearerToken, me)

export default router
