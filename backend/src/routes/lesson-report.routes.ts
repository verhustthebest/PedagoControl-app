import { Router } from 'express'
import {
  decidePrefetReport,
  prefetReportsPending,
  submitTeacherReport,
  supervisionReports,
  teacherReportsToday,
} from '../controllers/lesson-report.controller'
import { authenticateBearerToken } from '../middleware/auth.middleware'

const router = Router()

router.get('/teacher/reports/today', authenticateBearerToken, teacherReportsToday)
router.post('/teacher/reports', authenticateBearerToken, submitTeacherReport)
router.get('/prefet/reports/pending', authenticateBearerToken, prefetReportsPending)
router.patch('/prefet/reports/:id/decision', authenticateBearerToken, decidePrefetReport)
router.get('/supervision/reports', authenticateBearerToken, supervisionReports)

export default router
