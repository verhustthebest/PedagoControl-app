import{Router}from'express';import{indexTechnicalJournals,showTechnicalJournal}from'../controllers/technical-journal.controller';import{authenticateBearerToken,requirePermission,requireRole,requireSchoolScope}from'../middleware/auth.middleware';import{validate}from'../middleware/validate.middleware';import{schoolParams,technicalJournalParams,technicalJournalQuery}from'../validation/schemas';const router=Router();
// Lecture exclusivement technique : aucun verbe d'écriture n'est enregistré sur ce routeur.
const access=[authenticateBearerToken,requireRole('INFORMATICIEN'),requireSchoolScope(),requirePermission('VIEW_PARENTAL_JOURNALS'),requirePermission('VIEW_PARENTAL_ACKNOWLEDGEMENTS')]as const;
router.get('/parental/schools/:schoolId/technical-journals',...access,validate({params:schoolParams,query:technicalJournalQuery}),indexTechnicalJournals);
router.get('/parental/schools/:schoolId/technical-journals/:journalId',...access,validate({params:technicalJournalParams}),showTechnicalJournal);
export default router;
