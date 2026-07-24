import { Router } from 'express'
import { csrf, login, logout, logoutAll, me, refresh } from '../controllers/auth.controller'
import { authenticateBearerToken } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { loginBody } from '../validation/schemas'
import { acceptStaffInvitationBody, changePasswordBody, profilePhotoBody } from '../validation/schemas'
import { changePassword, profilePhoto } from '../controllers/profile-security.controller'
import { acceptInvitation } from '../controllers/school-staff.controller'

const router = Router()

router.post('/auth/login', validate({ body: loginBody }), login)
router.get('/auth/csrf', csrf)
router.post('/auth/refresh', refresh)
router.post('/auth/logout', logout)
router.post('/auth/logout-all', authenticateBearerToken, logoutAll)
router.get('/auth/me', authenticateBearerToken, me)
router.put('/auth/password',authenticateBearerToken,validate({body:changePasswordBody}),changePassword)
router.put('/auth/profile-photo',authenticateBearerToken,validate({body:profilePhotoBody}),profilePhoto)
router.post('/auth/invitations/accept',validate({body:acceptStaffInvitationBody}),acceptInvitation)

export default router
