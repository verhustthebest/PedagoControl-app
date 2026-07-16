import { Router } from 'express'
import { getSchools } from '../controllers/school.controller'
import {
  authenticateBearerToken,
  requireAnyRole,
  requireSchoolContext,
} from '../middleware/auth.middleware'
import { SCHOOL_LIST_ROLES } from '../security/access-policy'

const router = Router()

router.get(
  '/schools',
  authenticateBearerToken,
  requireSchoolContext(),
  requireAnyRole(SCHOOL_LIST_ROLES),
  getSchools,
)

export default router
