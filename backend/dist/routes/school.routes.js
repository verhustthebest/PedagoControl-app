"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = require("../controllers/school.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const access_policy_1 = require("../security/access-policy");
const router = (0, express_1.Router)();
router.get('/schools', auth_middleware_1.authenticateBearerToken, (0, auth_middleware_1.requireSchoolContext)(), (0, auth_middleware_1.requireAnyRole)(access_policy_1.SCHOOL_LIST_ROLES), school_controller_1.getSchools);
exports.default = router;
