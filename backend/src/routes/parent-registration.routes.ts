import { Router } from 'express'
import {
  registerParent,
  requestOtp,
  verifyOtp,
} from '../controllers/parent-registration.controller'
import { validate } from '../middleware/validate.middleware'
import { registerParentBody, requestOtpBody, verifyOtpBody } from '../validation/schemas'

const router = Router()

router.post('/parental/auth/request-otp', validate({ body: requestOtpBody }), requestOtp)
router.post('/parental/auth/verify-otp', validate({ body: verifyOtpBody }), verifyOtp)
router.post('/parental/auth/register', validate({ body: registerParentBody }), registerParent)

export default router
