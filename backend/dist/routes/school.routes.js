"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = require("../controllers/school.controller");
const router = (0, express_1.Router)();
router.get('/schools', school_controller_1.getSchools);
exports.default = router;
