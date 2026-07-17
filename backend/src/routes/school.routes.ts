import { Router } from 'express'
import { getSchools } from '../controllers/school.controller'
import {
  authenticateBearerToken,
  requireAnyRole,
  requireSchoolContext,
} from '../middleware/auth.middleware'
import { SCHOOL_LIST_ROLES } from '../security/access-policy'
import { validate } from '../middleware/validate.middleware'
import { paginationQuery } from '../validation/schemas'

const router = Router()

router.get(
  '/schools',
  authenticateBearerToken,
  requireSchoolContext(),
  requireAnyRole(SCHOOL_LIST_ROLES),
  validate({ query: paginationQuery }),
  getSchools,
)

export default router
