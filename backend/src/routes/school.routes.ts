import { Router } from 'express'
import { getSchool, getSchools } from '../controllers/school.controller'
import { authenticateBearerToken, requireAnyRole, requireSchoolContext, requireSchoolScope } from '../middleware/auth.middleware'
import { SCHOOL_LIST_ROLES } from '../security/access-policy'
import { validate } from '../middleware/validate.middleware'
import { phoneIdentityBody, schoolDraftBody, schoolListQuery, schoolOnboardingBody, schoolPublicParams, schoolSubscriptionListQuery } from '../validation/schemas'
import { createSchoolOnboarding, saveDraft, subscriptions } from '../controllers/school-onboarding.controller'
import { createStaff } from '../controllers/school-staff.controller'
import { schoolStaffBody } from '../validation/schemas'
import { managementSubscriptions } from '../controllers/management-subscription.controller'
import { checkPhone } from '../controllers/phone-identity.controller'

const router=Router()
const managementAccess=[authenticateBearerToken,requireSchoolContext(),requireAnyRole(SCHOOL_LIST_ROLES)]as const
router.get('/schools',...managementAccess,validate({query:schoolListQuery}),getSchools)
router.get('/schools/onboarding/subscriptions',...managementAccess,subscriptions)
router.get('/management/subscriptions',authenticateBearerToken,requireSchoolContext(),requireAnyRole(['SUPER_ADMIN']),validate({query:schoolSubscriptionListQuery}),managementSubscriptions)
router.post('/contacts/phone-check',authenticateBearerToken,requireSchoolContext(),requireAnyRole(['SUPER_ADMIN','ADMIN_GESTIONNAIRE']),validate({body:phoneIdentityBody}),checkPhone)
router.post('/schools/onboarding/drafts',...managementAccess,validate({body:schoolDraftBody}),saveDraft)
router.post('/schools/onboarding',...managementAccess,validate({body:schoolOnboardingBody}),createSchoolOnboarding)
router.post('/schools/:schoolId/staff',authenticateBearerToken,requireSchoolContext(),requireAnyRole(['ADMIN_GESTIONNAIRE']),validate({params:schoolPublicParams,body:schoolStaffBody}),requireSchoolScope(),createStaff)
router.get('/schools/:schoolId',...managementAccess,validate({params:schoolPublicParams}),requireSchoolScope(),getSchool)
export default router
