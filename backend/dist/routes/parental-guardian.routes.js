"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parental_guardian_controller_1 = require("../controllers/parental-guardian.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
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
router.get('/parental/schools/:schoolId/guardians', ...guardianAccess, parental_guardian_controller_1.indexGuardians);
router.post('/parental/schools/:schoolId/guardians', ...guardianAccess, parental_guardian_controller_1.createGuardianHandler);
router.get('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, parental_guardian_controller_1.showGuardian);
router.put('/parental/schools/:schoolId/guardians/:guardianId', ...guardianAccess, parental_guardian_controller_1.updateGuardianHandler);
router.post('/parental/schools/:schoolId/students/:studentId/guardians', ...linkAccess, parental_guardian_controller_1.linkGuardian);
router.patch('/parental/schools/:schoolId/students/:studentId/guardians/:guardianId', ...linkAccess, parental_guardian_controller_1.updateGuardianLink);
exports.default = router;
