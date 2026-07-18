"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_ID_PATTERN = void 0;
exports.isPublicId = isPublicId;
exports.opaqueResourceWhere = opaqueResourceWhere;
exports.publicInvoiceView = publicInvoiceView;
exports.PUBLIC_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isPublicId(value) {
    return exports.PUBLIC_ID_PATTERN.test(value);
}
function opaqueResourceWhere(value) {
    if (isPublicId(value))
        return { public_id: value };
    if (/^[1-9]\d*$/.test(value))
        return { id: BigInt(value) };
    throw new Error('Invalid resource identifier');
}
function publicInvoiceView(invoice) {
    return {
        public_id: invoice.public_id,
        invoice_number: invoice.invoice_number,
        invoice_type: invoice.invoice_type,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        status: invoice.status,
    };
}
