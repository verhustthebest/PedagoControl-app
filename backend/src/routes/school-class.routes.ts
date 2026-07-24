import{Router}from'express'
import{listSchoolClasses}from'../controllers/school-class.controller'
import{addClass,addSubject,catalog,deleteClass,deleteSubject,editClass,editSubject,subjects}from'../controllers/school-academic.controller'
import{authenticateBearerToken,requireAnyRole,requireSchoolScope}from'../middleware/auth.middleware'
import{validate}from'../middleware/validate.middleware'
import{classBody,classListQuery,classParams,schoolParams,subjectBody,subjectParams}from'../validation/schemas'
const router=Router(),access=[authenticateBearerToken,requireAnyRole(['ADMIN_GESTIONNAIRE']),requireSchoolScope()]as const
router.get('/schools/:schoolId/classes',...access,validate({params:schoolParams,query:classListQuery}),listSchoolClasses)
router.post('/schools/:schoolId/classes',...access,validate({params:schoolParams,body:classBody}),addClass)
router.put('/schools/:schoolId/classes/:classId',...access,validate({params:classParams,body:classBody}),editClass)
router.delete('/schools/:schoolId/classes/:classId',...access,validate({params:classParams}),deleteClass)
router.get('/schools/:schoolId/academic-catalog',...access,validate({params:schoolParams}),catalog)
router.get('/schools/:schoolId/subjects',...access,validate({params:schoolParams}),subjects)
router.post('/schools/:schoolId/subjects',...access,validate({params:schoolParams,body:subjectBody}),addSubject)
router.put('/schools/:schoolId/subjects/:subjectId',...access,validate({params:subjectParams,body:subjectBody}),editSubject)
router.delete('/schools/:schoolId/subjects/:subjectId',...access,validate({params:subjectParams}),deleteSubject)
export default router
