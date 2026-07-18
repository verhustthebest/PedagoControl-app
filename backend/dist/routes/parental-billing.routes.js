"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parental_billing_controller_1 = require("../controllers/parental-billing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
const view = [
    auth_middleware_1.authenticateBearerToken,
    (0, auth_middleware_1.requireSchoolScope)(),
    (0, auth_middleware_1.requirePermission)('VIEW_PARENTAL_INVOICES'),
];
const generate = [auth_middleware_1.authenticateBearerToken, (0, auth_middleware_1.requireSchoolScope)(), (0, auth_middleware_1.requirePermission)('GENERATE_PARENTAL_INVOICE')];
const payment = [
    auth_middleware_1.authenticateBearerToken,
    (0, auth_middleware_1.requireSchoolScope)(),
    (0, auth_middleware_1.requirePermission)('RECORD_PARENTAL_PAYMENT'),
];
const print = [auth_middleware_1.authenticateBearerToken, (0, auth_middleware_1.requireSchoolScope)(), (0, auth_middleware_1.requirePermission)('PRINT_PARENTAL_INVOICE')];
router.post('/parental/schools/:schoolId/invoices/generate', ...generate, (0, validate_middleware_1.validate)({ params: schemas_1.schoolParams, body: schemas_1.invoiceGenerateBody }), parental_billing_controller_1.generateInvoice);
router.get('/parental/schools/:schoolId/invoices', ...view, (0, validate_middleware_1.validate)({ params: schemas_1.schoolParams, query: schemas_1.invoiceListQuery }), parental_billing_controller_1.indexInvoices);
router.get('/parental/schools/:schoolId/invoices/:invoiceId', ...view, (0, validate_middleware_1.validate)({ params: schemas_1.invoiceParams }), parental_billing_controller_1.showInvoice);
router.post('/parental/schools/:schoolId/invoices/:invoiceId/payments', ...payment, (0, validate_middleware_1.validate)({ params: schemas_1.invoiceParams, body: schemas_1.paymentBody }), parental_billing_controller_1.createPayment);
router.post('/parental/schools/:schoolId/invoices/:invoiceId/download-token', ...print, (0, validate_middleware_1.validate)({ params: schemas_1.invoiceParams }), parental_billing_controller_1.createDownloadToken);
router.get('/parental/invoices/download', (0, validate_middleware_1.validate)({ query: schemas_1.actionTokenQuery }), parental_billing_controller_1.downloadInvoice);
exports.default = router;
