import { Router } from 'express'
import { getSchool, getSchools } from '../controllers/school.controller'
import { authenticateBearerToken, requireAnyRole, requireSchoolContext, requireSchoolScope } from '../middleware/auth.middleware'
import { SCHOOL_LIST_ROLES } from '../security/access-policy'
import { validate } from '../middleware/validate.middleware'
import { schoolListQuery, schoolPublicParams } from '../validation/schemas'

const router=Router()
const managementAccess=[authenticateBearerToken,requireSchoolContext(),requireAnyRole(SCHOOL_LIST_ROLES)]as const
router.get('/schools',...managementAccess,validate({query:schoolListQuery}),getSchools)
router.get('/schools/:schoolId',...managementAccess,validate({params:schoolPublicParams}),requireSchoolScope(),getSchool)
export default router
