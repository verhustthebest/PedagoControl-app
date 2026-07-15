import { Router } from 'express'
import {
  registerParent,
  requestOtp,
  verifyOtp,
} from '../controllers/parent-registration.controller'

const router = Router()

router.post('/parental/auth/request-otp', requestOtp)
router.post('/parental/auth/verify-otp', verifyOtp)
router.post('/parental/auth/register', registerParent)

export default router
