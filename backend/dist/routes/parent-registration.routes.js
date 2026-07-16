"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parent_registration_controller_1 = require("../controllers/parent-registration.controller");
const router = (0, express_1.Router)();
router.post('/parental/auth/request-otp', parent_registration_controller_1.requestOtp);
router.post('/parental/auth/verify-otp', parent_registration_controller_1.verifyOtp);
router.post('/parental/auth/register', parent_registration_controller_1.registerParent);
exports.default = router;
