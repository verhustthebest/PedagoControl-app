import { Router } from 'express'
import {
  saveParentalSettings,
  saveParentalSubscription,
  showParentalSettings,
  showParentalSubscription,
} from '../controllers/parental.controller'
import {
  authenticateBearerToken,
  requirePermission,
  requireSchoolScope,
} from '../middleware/auth.middleware'

const router = Router()

router.get(
  '/parental/settings/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('CONFIGURE_PARENTAL_MODULE'),
  showParentalSettings,
)
router.put(
  '/parental/settings/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('CONFIGURE_PARENTAL_MODULE'),
  saveParentalSettings,
)
router.get(
  '/parental/subscription/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('MANAGE_PARENTAL_PRICING'),
  showParentalSubscription,
)
router.put(
  '/parental/subscription/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('MANAGE_PARENTAL_PRICING'),
  saveParentalSubscription,
)

export default router
