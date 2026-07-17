import { Router } from 'express'
import {
  createGuardianHandler,
  indexGuardians,
  linkGuardian,
  showGuardian,
  updateGuardianHandler,
  updateGuardianLink,
} from '../controllers/parental-guardian.controller'
import {
  authenticateBearerToken,
  requirePermission,
  requireSchoolScope,
} from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createGuardianBody, guardianLinkParams, guardianListQuery, guardianParams, linkGuardianBody, schoolParams, studentParams, trackingBody, updateGuardianBody } from '../validation/schemas'

const router = Router()
const guardianAccess = [
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('MANAGE_GUARDIANS'),
] as const
const linkAccess = [
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('MANAGE_STUDENT_LINKS'),
] as const

router.get('/parental/schools/:schoolId/guardians', ...guardianAccess, validate({ params: schoolParams, query: guardianListQuery }), indexGuardians)
router.post('/parental/schools/:schoolId/guardians', ...guardianAccess, validate({ params: schoolParams, body: createGuardianBody }), createGuardianHandler)
router.get('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, validate({ params: guardianParams }), showGuardian)
router.put('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, validate({ params: guardianParams, body: updateGuardianBody }), updateGuardianHandler)
router.post('/parental/schools/:schoolId/students/:studentId/guardians', ...linkAccess, validate({ params: studentParams, body: linkGuardianBody }), linkGuardian)
router.patch(
  '/parental/schools/:schoolId/students/:studentId/guardians/:guardianId',
  ...linkAccess,
  validate({ params: guardianLinkParams, body: trackingBody }),
  updateGuardianLink,
)

export default router
