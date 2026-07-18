"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentalInvoiceListDto = parentalInvoiceListDto;
exports.parentalInvoiceDetailDto = parentalInvoiceDetailDto;
exports.parentalPaymentDto = parentalPaymentDto;
const money = (value) => String(value);
/** DTO public minimal utilisé par les listes de factures du Suivi parental. */
function parentalInvoiceListDto(invoice) { return { public_id: invoice.public_id, invoice_number: invoice.invoice_number, invoice_type: invoice.invoice_type, billing_period_start: invoice.billing_period_start, billing_period_end: invoice.billing_period_end, student_count_snapshot: invoice.student_count_snapshot, issue_date: invoice.issue_date, due_date: invoice.due_date, total_amount: money(invoice.total_amount), currency: invoice.currency, status: invoice.status, emailed_at: invoice.emailed_at }; }
/** DTO détaillé : les lignes et paiements restent des snapshots, sans clé interne ni chemin de stockage. */
function parentalInvoiceDetailDto(invoice) { return { ...parentalInvoiceListDto(invoice), billing_email: invoice.billing_email, subtotal: money(invoice.subtotal), discount_amount: money(invoice.discount_amount), items: (invoice.school_invoice_items ?? []).map(item => ({ type: item.item_type, description: item.description, quantity: money(item.quantity), unit_price: money(item.unit_price), amount: money(item.amount) })), payments: (invoice.school_invoice_payments ?? []).map(payment => parentalPaymentDto(payment)) }; }
function parentalPaymentDto(payment) { return { amount: money(payment.amount), currency: payment.currency, payment_method: payment.payment_method, transaction_reference: payment.transaction_reference, receipt_number: payment.receipt_number, status: payment.status, paid_at: payment.paid_at, notes: payment.notes }; }
