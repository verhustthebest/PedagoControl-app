"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const technical_journal_controller_1 = require("../controllers/technical-journal.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
// Lecture exclusivement technique : aucun verbe d'écriture n'est enregistré sur ce routeur.
const access = [auth_middleware_1.authenticateBearerToken, (0, auth_middleware_1.requireRole)('INFORMATICIEN'), (0, auth_middleware_1.requireSchoolScope)(), (0, auth_middleware_1.requirePermission)('VIEW_PARENTAL_JOURNALS'), (0, auth_middleware_1.requirePermission)('VIEW_PARENTAL_ACKNOWLEDGEMENTS')];
router.get('/parental/schools/:schoolId/technical-journals', ...access, (0, validate_middleware_1.validate)({ params: schemas_1.schoolParams, query: schemas_1.technicalJournalQuery }), technical_journal_controller_1.indexTechnicalJournals);
router.get('/parental/schools/:schoolId/technical-journals/:journalId', ...access, (0, validate_middleware_1.validate)({ params: schemas_1.technicalJournalParams }), technical_journal_controller_1.showTechnicalJournal);
exports.default = router;
