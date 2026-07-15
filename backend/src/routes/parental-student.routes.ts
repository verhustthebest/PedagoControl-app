import { Router } from 'express'
import {
  createStudentHandler,
  indexStudents,
  showStudent,
  updateStudentHandler,
  updateStudentTracking,
} from '../controllers/parental-student.controller'
import {
  authenticateBearerToken,
  requirePermission,
  requireSchoolScope,
} from '../middleware/auth.middleware'

const router = Router()
const access = [authenticateBearerToken, requireSchoolScope(), requirePermission('MANAGE_STUDENTS')] as const

router.get('/parental/schools/:schoolId/students', ...access, indexStudents)
router.post('/parental/schools/:schoolId/students', ...access, createStudentHandler)
router.get('/parental/schools/:schoolId/students/:studentId', ...access, showStudent)
router.put('/parental/schools/:schoolId/students/:studentId', ...access, updateStudentHandler)
router.patch('/parental/schools/:schoolId/students/:studentId/tracking', ...access, updateStudentTracking)

export default router
