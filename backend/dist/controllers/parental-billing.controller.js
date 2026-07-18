"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoice = generateInvoice;
exports.indexInvoices = indexInvoices;
exports.showInvoice = showInvoice;
exports.createPayment = createPayment;
exports.createDownloadToken = createDownloadToken;
exports.downloadInvoice = downloadInvoice;
const parental_billing_service_1 = require("../services/parental-billing.service");
const parental_service_1 = require("../services/parental.service");
function parameter(request, name) {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] : value;
}
function query(value) {
    return typeof value === 'string' ? value : undefined;
}
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function handleError(response, error, fallback) {
    if (error instanceof parental_service_1.ParentalApiError)
        return response.status(error.statusCode).json({ message: error.message });
    return response.status(500).json({ message: fallback });
}
async function generateInvoice(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const invoice = await (0, parental_billing_service_1.generateParentalInvoice)(parameter(request, 'schoolId'), request.user.id, request.body?.billing_month);
        return response.status(201).json({ invoice: serialize(invoice) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to generate parental invoice');
    }
}
async function indexInvoices(request, response) {
    try {
        return response.json(serialize(await (0, parental_billing_service_1.listParentalInvoices)(parameter(request, 'schoolId'), {
            page: query(request.query.page),
            limit: query(request.query.limit),
            status: query(request.query.status),
        })));
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch parental invoices');
    }
}
async function showInvoice(request, response) {
    try {
        return response.json({
            invoice: serialize(await (0, parental_billing_service_1.getParentalInvoice)(parameter(request, 'schoolId'), parameter(request, 'invoiceId'))),
        });
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch parental invoice');
    }
}
async function createPayment(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const payment = await (0, parental_billing_service_1.recordManualPayment)(parameter(request, 'schoolId'), parameter(request, 'invoiceId'), request.user.id, request.body);
        return response.status(201).json({ payment: serialize(payment) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to record school payment');
    }
}
async function createDownloadToken(request, response) {
    try {
        const result = await (0, parental_billing_service_1.createInvoiceDownloadToken)(parameter(request, 'schoolId'), parameter(request, 'invoiceId'));
        response.setHeader('Cache-Control', 'no-store');
        return response.status(201).json(result);
    }
    catch (error) {
        return handleError(response, error, 'Unable to create temporary invoice link');
    }
}
async function downloadInvoice(request, response) {
    if (process.env.NODE_ENV === 'production' && !request.secure)
        return response.status(400).json({ message: 'Invalid request' });
    try {
        const token = typeof request.query.token === 'string' ? request.query.token : '';
        const invoice = await (0, parental_billing_service_1.consumeInvoiceDownloadToken)(token);
        response.setHeader('Cache-Control', 'no-store');
        return response.json({ invoice: serialize(invoice) });
    }
    catch {
        return response.status(401).json({ message: 'Temporary link is invalid or expired' });
    }
}
