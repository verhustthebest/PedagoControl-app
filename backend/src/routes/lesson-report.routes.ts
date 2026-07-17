import { Router } from 'express'
import {
  decidePrefetReport,
  prefetReportsPending,
  submitTeacherReport,
  supervisionReports,
  teacherReports,
  teacherReportsToday,
} from '../controllers/lesson-report.controller'
import {
  authenticateBearerToken,
  requireAnyRole,
  requireSchoolContext,
} from '../middleware/auth.middleware'
import {
  PREFECT_ROLES,
  SUPERVISION_ROLES,
  TEACHER_ROLES,
} from '../security/access-policy'
import { validate } from '../middleware/validate.middleware'
import { reportBody, reportDecisionBody, reportParams } from '../validation/schemas'

const router = Router()

const teachers = [authenticateBearerToken, requireSchoolContext(), requireAnyRole(TEACHER_ROLES)] as const
const prefects = [authenticateBearerToken, requireSchoolContext(), requireAnyRole(PREFECT_ROLES)] as const
const supervisors = [authenticateBearerToken, requireSchoolContext(), requireAnyRole(SUPERVISION_ROLES)] as const

router.get('/teacher/reports', ...teachers, teacherReports)
router.get('/teacher/reports/today', ...teachers, teacherReportsToday)
router.post('/teacher/reports', ...teachers, validate({ body: reportBody }), submitTeacherReport)
router.get('/prefet/reports/pending', ...prefects, prefetReportsPending)
router.patch('/prefet/reports/:id/decision', ...prefects, validate({ params: reportParams, body: reportDecisionBody }), decidePrefetReport)
router.get('/supervision/reports', ...supervisors, supervisionReports)

export default router
