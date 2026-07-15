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

router.get('/parental/schools/:schoolId/guardians', ...guardianAccess, indexGuardians)
router.post('/parental/schools/:schoolId/guardians', ...guardianAccess, createGuardianHandler)
router.get('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, showGuardian)
router.put('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, updateGuardianHandler)
router.post('/parental/schools/:schoolId/students/:studentId/guardians', ...linkAccess, linkGuardian)
router.patch(
  '/parental/schools/:schoolId/students/:studentId/guardians/:guardianId',
  ...linkAccess,
  updateGuardianLink,
)

export default router
