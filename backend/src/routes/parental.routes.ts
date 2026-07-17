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
import { validate } from '../middleware/validate.middleware'
import { schoolParams, settingsBody, subscriptionBody } from '../validation/schemas'

const router = Router()

router.get(
  '/parental/settings/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('CONFIGURE_PARENTAL_MODULE'),
  validate({ params: schoolParams }),
  showParentalSettings,
)
router.put(
  '/parental/settings/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('CONFIGURE_PARENTAL_MODULE'),
  validate({ params: schoolParams, body: settingsBody }),
  saveParentalSettings,
)
router.get(
  '/parental/subscription/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('MANAGE_PARENTAL_PRICING'),
  validate({ params: schoolParams }),
  showParentalSubscription,
)
router.put(
  '/parental/subscription/:schoolId',
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('MANAGE_PARENTAL_PRICING'),
  validate({ params: schoolParams, body: subscriptionBody }),
  saveParentalSubscription,
)

export default router
