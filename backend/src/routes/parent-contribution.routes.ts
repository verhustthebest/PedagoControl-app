import { Router } from 'express'
import { auditView, createPayment, generateDues, indexDues, ownView, paymentHistory, runAutomation, saveSetting, showDue, showSetting } from '../controllers/parent-contribution.controller'
import { authenticateBearerToken, requirePermission, requireRole, requireSchoolScope } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { contributionAutomationBody, contributionDueParams, contributionGenerateBody, contributionListQuery, contributionPaymentBody, contributionSettingBody, paginationQuery, schoolParams } from '../validation/schemas'

const router = Router()
const view = [authenticateBearerToken, requireSchoolScope(), requirePermission('VIEW_PARENT_CONTRIBUTIONS')] as const

router.get('/parental/contributions/audit',authenticateBearerToken,requireRole('SUPER_ADMIN'),requirePermission('AUDIT_PARENT_CONTRIBUTIONS'),validate({query:paginationQuery}),auditView)
router.post('/parental/contributions/automation/run',authenticateBearerToken,requireRole('SUPER_ADMIN'),requirePermission('AUDIT_PARENT_CONTRIBUTIONS'),validate({body:contributionAutomationBody}),runAutomation)
router.get('/parental/me/contributions',authenticateBearerToken,requireRole('PARENT'),requirePermission('VIEW_OWN_PARENT_CONTRIBUTIONS'),ownView)
router.get('/parental/schools/:schoolId/contribution-settings',...view,validate({params:schoolParams}),showSetting)
router.put('/parental/schools/:schoolId/contribution-settings',authenticateBearerToken,requireSchoolScope(),requirePermission('CONFIGURE_PARENT_CONTRIBUTION'),validate({params:schoolParams,body:contributionSettingBody}),saveSetting)
router.post('/parental/schools/:schoolId/contribution-dues/generate',authenticateBearerToken,requireSchoolScope(),requirePermission('GENERATE_PARENT_CONTRIBUTION_DUES'),validate({params:schoolParams,body:contributionGenerateBody}),generateDues)
router.get('/parental/schools/:schoolId/contribution-dues',...view,validate({params:schoolParams,query:contributionListQuery}),indexDues)
router.get('/parental/schools/:schoolId/contribution-dues/:dueId',...view,validate({params:contributionDueParams}),showDue)
router.post('/parental/schools/:schoolId/contribution-dues/:dueId/payments',authenticateBearerToken,requireSchoolScope(),requirePermission('RECORD_PARENT_CONTRIBUTION_PAYMENT'),validate({params:contributionDueParams,body:contributionPaymentBody}),createPayment)
router.get('/parental/schools/:schoolId/contribution-dues/:dueId/payments',...view,validate({params:contributionDueParams}),paymentHistory)

export default router
