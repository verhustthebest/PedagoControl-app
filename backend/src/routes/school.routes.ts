import { Router } from 'express'
import { getSchool, getSchools } from '../controllers/school.controller'
import { authenticateBearerToken, requireAnyRole, requireSchoolContext, requireSchoolScope } from '../middleware/auth.middleware'
import { SCHOOL_LIST_ROLES } from '../security/access-policy'
import { validate } from '../middleware/validate.middleware'
import { schoolDraftBody, schoolListQuery, schoolOnboardingBody, schoolPublicParams } from '../validation/schemas'
import { createSchoolOnboarding, saveDraft, subscriptions } from '../controllers/school-onboarding.controller'
import { createStaff } from '../controllers/school-staff.controller'
import { schoolStaffBody } from '../validation/schemas'

const router=Router()
const managementAccess=[authenticateBearerToken,requireSchoolContext(),requireAnyRole(SCHOOL_LIST_ROLES)]as const
router.get('/schools',...managementAccess,validate({query:schoolListQuery}),getSchools)
router.get('/schools/onboarding/subscriptions',...managementAccess,subscriptions)
router.post('/schools/onboarding/drafts',...managementAccess,validate({body:schoolDraftBody}),saveDraft)
router.post('/schools/onboarding',...managementAccess,validate({body:schoolOnboardingBody}),createSchoolOnboarding)
router.post('/schools/:schoolId/staff',authenticateBearerToken,requireSchoolContext(),requireAnyRole(['ADMIN_GESTIONNAIRE']),validate({params:schoolPublicParams,body:schoolStaffBody}),requireSchoolScope(),createStaff)
router.get('/schools/:schoolId',...managementAccess,validate({params:schoolPublicParams}),requireSchoolScope(),getSchool)
export default router
