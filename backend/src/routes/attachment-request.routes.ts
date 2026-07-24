import{Router}from'express';import{addDocument,create,decide,disable,index,removeDocument,show}from'../controllers/attachment-request.controller';import{authenticateBearerToken,requirePermission,requireSchoolScope}from'../middleware/auth.middleware';import{validate}from'../middleware/validate.middleware';import{attachmentCreateBody,attachmentDecisionBody,attachmentDisableBody,attachmentDocumentBody,attachmentDocumentParams,attachmentRequestParams,attachmentRequestQuery,schoolParams}from'../validation/schemas';
const router=Router(),read=[authenticateBearerToken,requireSchoolScope(),requirePermission('VIEW_ATTACHMENT_REQUESTS')]as const,decision=[authenticateBearerToken,requireSchoolScope(),requirePermission('REVIEW_ATTACHMENT_REQUESTS')]as const;
router.get('/parental/schools/:schoolId/attachment-requests',...read,validate({params:schoolParams,query:attachmentRequestQuery}),index)
router.post('/parental/schools/:schoolId/attachment-requests',...decision,validate({params:schoolParams,body:attachmentCreateBody}),create)
router.get('/parental/schools/:schoolId/attachment-requests/:requestId',...read,validate({params:attachmentRequestParams}),show)
router.post('/parental/schools/:schoolId/attachment-requests/:requestId/decision',...decision,validate({params:attachmentRequestParams,body:attachmentDecisionBody}),decide)
router.post('/parental/schools/:schoolId/attachment-requests/:requestId/disable',...decision,validate({params:attachmentRequestParams,body:attachmentDisableBody}),disable)
router.post('/parental/schools/:schoolId/attachment-requests/:requestId/documents',...read,validate({params:attachmentRequestParams,body:attachmentDocumentBody}),addDocument)
router.delete('/parental/schools/:schoolId/attachment-requests/:requestId/documents/:documentId',...read,validate({params:attachmentDocumentParams}),removeDocument)
export default router
