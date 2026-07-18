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
import { validate } from '../middleware/validate.middleware'
import { createStudentBody, schoolParams, studentListQuery, studentParams, trackingBody, updateStudentBody } from '../validation/schemas'
import { resolvePublicResource } from '../middleware/public-resource.middleware'

const router = Router()
const access = [authenticateBearerToken, requireSchoolScope(), requirePermission('MANAGE_STUDENTS')] as const

router.get('/parental/schools/:schoolId/students', ...access, validate({ params: schoolParams, query: studentListQuery }), indexStudents)
router.post('/parental/schools/:schoolId/students', ...access, validate({ params: schoolParams, body: createStudentBody }), createStudentHandler)
router.get('/parental/schools/:schoolId/students/:studentId', ...access, resolvePublicResource('student', 'studentId'), validate({ params: studentParams }), showStudent)
router.put('/parental/schools/:schoolId/students/:studentId', ...access, resolvePublicResource('student', 'studentId'), validate({ params: studentParams, body: updateStudentBody }), updateStudentHandler)
router.patch('/parental/schools/:schoolId/students/:studentId/tracking', ...access, resolvePublicResource('student', 'studentId'), validate({ params: studentParams, body: trackingBody }), updateStudentTracking)

export default router
