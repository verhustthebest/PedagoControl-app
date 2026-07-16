"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parental_billing_controller_1 = require("../controllers/parental-billing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const view = [
    auth_middleware_1.authenticateBearerToken,
    (0, auth_middleware_1.requireSchoolScope)(),
    (0, auth_middleware_1.requirePermission)('VIEW_SCHOOL_INVOICES'),
];
const payment = [
    auth_middleware_1.authenticateBearerToken,
    (0, auth_middleware_1.requireSchoolScope)(),
    (0, auth_middleware_1.requirePermission)('RECORD_SCHOOL_PAYMENT'),
];
router.post('/parental/schools/:schoolId/invoices/generate', ...view, parental_billing_controller_1.generateInvoice);
router.get('/parental/schools/:schoolId/invoices', ...view, parental_billing_controller_1.indexInvoices);
router.get('/parental/schools/:schoolId/invoices/:invoiceId', ...view, parental_billing_controller_1.showInvoice);
router.post('/parental/schools/:schoolId/invoices/:invoiceId/payments', ...payment, parental_billing_controller_1.createPayment);
exports.default = router;
