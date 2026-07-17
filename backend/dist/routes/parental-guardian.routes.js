"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parental_guardian_controller_1 = require("../controllers/parental-guardian.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
const guardianAccess = [
    auth_middleware_1.authenticateBearerToken,
    (0, auth_middleware_1.requireSchoolScope)(),
    (0, auth_middleware_1.requirePermission)('MANAGE_GUARDIANS'),
];
const linkAccess = [
    auth_middleware_1.authenticateBearerToken,
    (0, auth_middleware_1.requireSchoolScope)(),
    (0, auth_middleware_1.requirePermission)('MANAGE_STUDENT_LINKS'),
];
router.get('/parental/schools/:schoolId/guardians', ...guardianAccess, (0, validate_middleware_1.validate)({ params: schemas_1.schoolParams, query: schemas_1.guardianListQuery }), parental_guardian_controller_1.indexGuardians);
router.post('/parental/schools/:schoolId/guardians', ...guardianAccess, (0, validate_middleware_1.validate)({ params: schemas_1.schoolParams, body: schemas_1.createGuardianBody }), parental_guardian_controller_1.createGuardianHandler);
router.get('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, (0, validate_middleware_1.validate)({ params: schemas_1.guardianParams }), parental_guardian_controller_1.showGuardian);
router.put('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, (0, validate_middleware_1.validate)({ params: schemas_1.guardianParams, body: schemas_1.updateGuardianBody }), parental_guardian_controller_1.updateGuardianHandler);
router.post('/parental/schools/:schoolId/students/:studentId/guardians', ...linkAccess, (0, validate_middleware_1.validate)({ params: schemas_1.studentParams, body: schemas_1.linkGuardianBody }), parental_guardian_controller_1.linkGuardian);
router.patch('/parental/schools/:schoolId/students/:studentId/guardians/:guardianId', ...linkAccess, (0, validate_middleware_1.validate)({ params: schemas_1.guardianLinkParams, body: schemas_1.trackingBody }), parental_guardian_controller_1.updateGuardianLink);
exports.default = router;
