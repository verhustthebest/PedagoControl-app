"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateParentalInvoice = generateParentalInvoice;
exports.listParentalInvoices = listParentalInvoices;
exports.getParentalInvoice = getParentalInvoice;
exports.recordManualPayment = recordManualPayment;
exports.createInvoiceDownloadToken = createInvoiceDownloadToken;
exports.consumeInvoiceDownloadToken = consumeInvoiceDownloadToken;
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const parental_service_1 = require("./parental.service");
const parental_student_service_1 = require("./parental-student.service");
const public_id_1 = require("../security/public-id");
const action_token_service_1 = require("./action-token.service");
const INVOICE_TYPE = 'parental_tracking';
function parseId(value, field) {
    try {
        const id = BigInt(value);
        if (id <= 0n)
            throw new Error();
        return id;
    }
    catch {
        throw new parental_service_1.ParentalApiError(`${field} must be a valid positive id`, 400);
    }
}
function utcToday() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function parseBillingMonth(value) {
    if (typeof value !== 'string')
        throw new parental_service_1.ParentalApiError('billing_month must use YYYY-MM', 400);
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match)
        throw new parental_service_1.ParentalApiError('billing_month must use YYYY-MM', 400);
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (month < 0 || month > 11)
        throw new parental_service_1.ParentalApiError('billing_month is invalid', 400);
    if (month === 6 || month === 7) {
        throw new parental_service_1.ParentalApiError('No parental tracking invoice is generated in July or August', 400);
    }
    const start = new Date(Date.UTC(year, month, 1));
    const end = month === 5 ? new Date(Date.UTC(year, 5, 15)) : new Date(Date.UTC(year, month + 1, 0));
    if (end.getTime() > utcToday().getTime()) {
        throw new parental_service_1.ParentalApiError('The parental billing period is not closed yet', 400);
    }
    return { year, month, start, end, key: `${match[1]}-${match[2]}` };
}
function parsePage(value, fallback, maximum) {
    if (value === undefined)
        return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0 || (maximum && parsed > maximum)) {
        throw new parental_service_1.ParentalApiError(maximum ? `limit must be between 1 and ${maximum}` : 'page must be positive', 400);
    }
    return parsed;
}
function parseAmount(value) {
    try {
        if (typeof value !== 'string' && typeof value !== 'number')
            throw new Error();
        const amount = new client_1.Prisma.Decimal(value);
        if (!amount.isPositive())
            throw new Error();
        return amount;
    }
    catch {
        throw new parental_service_1.ParentalApiError('amount must be a positive number', 400);
    }
}
function optionalText(value, field) {
    if (value === undefined || value === null || value === '')
        return null;
    if (typeof value !== 'string')
        throw new parental_service_1.ParentalApiError(`${field} must be a string`, 400);
    return value.trim() || null;
}
async function schoolOrThrow(schoolId) {
    const school = await client_2.default.schools.findUnique({ where: { id: schoolId } });
    if (!school)
        throw new parental_service_1.ParentalApiError('School not found', 404);
    return school;
}
function invoiceInclude() {
    return {
        school_invoice_items: true,
        school_invoice_payments: {
            orderBy: { paid_at: 'desc' },
        },
    };
}
function audit(params) {
    return {
        school_id: params.schoolId,
        user_id: params.userId,
        activity_type: params.type,
        module_name: 'parental_tracking',
        reference_table: params.table,
        reference_id: params.referenceId,
        title: params.title,
        description: params.description,
    };
}
async function generateParentalInvoice(schoolIdValue, actorUserId, billingMonth) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const actorId = parseId(actorUserId, 'actorUserId');
    const period = parseBillingMonth(billingMonth);
    const school = await schoolOrThrow(schoolId);
    const existing = await client_2.default.school_invoices.findFirst({
        where: {
            school_id: schoolId,
            invoice_type: INVOICE_TYPE,
            billing_period_start: period.start,
            billing_period_end: period.end,
        },
    });
    if (existing)
        throw new parental_service_1.ParentalApiError('A parental tracking invoice already exists for this period', 409);
    const subscription = await client_2.default.school_parental_subscriptions.findFirst({
        where: {
            school_id: schoolId,
            status: 'active',
            start_date: { lte: period.end },
            end_date: { gte: period.end },
            school_subscriptions: {
                start_date: { lte: period.end },
                end_date: { gte: period.end },
            },
        },
        orderBy: { created_at: 'desc' },
    });
    if (!subscription) {
        throw new parental_service_1.ParentalApiError('No parental subscription covers this billing cutoff date', 409);
    }
    const studentCount = await (0, parental_student_service_1.countBillableParentalStudents)(schoolId.toString(), period.end, subscription.id);
    const quantity = new client_1.Prisma.Decimal(studentCount);
    const amount = subscription.unit_price_per_student.mul(quantity);
    const issueDate = utcToday();
    const dueDate = new Date(issueDate);
    dueDate.setUTCDate(dueDate.getUTCDate() + 15);
    const invoiceNumber = `PAR-${school.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}-${period.key.replace('-', '')}`;
    try {
        return await client_2.default.$transaction(async (transaction) => {
            const invoice = await transaction.school_invoices.create({
                data: {
                    school_id: schoolId,
                    school_subscription_id: subscription.school_subscription_id,
                    invoice_number: invoiceNumber,
                    invoice_type: INVOICE_TYPE,
                    billing_period_start: period.start,
                    billing_period_end: period.end,
                    student_count_snapshot: studentCount,
                    billing_email: school.promoter_email,
                    issue_date: issueDate,
                    due_date: dueDate,
                    subtotal: amount,
                    discount_amount: new client_1.Prisma.Decimal(0),
                    total_amount: amount,
                    currency: 'USD',
                    status: 'issued',
                    school_invoice_items: {
                        create: {
                            item_type: INVOICE_TYPE,
                            description: `Suivi parental - ${period.key} - ${studentCount} eleve(s)`,
                            quantity,
                            unit_price: subscription.unit_price_per_student,
                            amount,
                            school_parental_subscription_id: subscription.id,
                        },
                    },
                },
            });
            await transaction.activity_logs.create({
                data: audit({
                    schoolId,
                    userId: actorId,
                    table: 'school_invoices',
                    referenceId: invoice.id,
                    type: 'parental_invoice_generated',
                    title: 'Generation facture Suivi parental',
                    description: `Facture ${invoiceNumber} generee pour ${studentCount} eleve(s), montant ${amount.toFixed(2)} USD.`,
                }),
            });
            return transaction.school_invoices.findUniqueOrThrow({
                where: { id: invoice.id },
                include: invoiceInclude(),
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2002' || error.code === 'P2034')) {
            throw new parental_service_1.ParentalApiError('A parental tracking invoice already exists for this period', 409);
        }
        throw error;
    }
}
async function listParentalInvoices(schoolIdValue, input) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    await schoolOrThrow(schoolId);
    const page = parsePage(input.page, 1);
    const limit = parsePage(input.limit, 20, 100);
    const where = {
        school_id: schoolId,
        invoice_type: INVOICE_TYPE,
        ...(input.status ? { status: input.status } : {}),
    };
    const [invoices, total] = await client_2.default.$transaction([
        client_2.default.school_invoices.findMany({
            where,
            include: invoiceInclude(),
            orderBy: { billing_period_end: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        client_2.default.school_invoices.count({ where }),
    ]);
    return { invoices, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
}
async function getParentalInvoice(schoolIdValue, invoiceIdValue) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    await schoolOrThrow(schoolId);
    const invoice = await client_2.default.school_invoices.findFirst({
        where: { ...(0, public_id_1.opaqueResourceWhere)(invoiceIdValue), school_id: schoolId, invoice_type: INVOICE_TYPE },
        include: invoiceInclude(),
    });
    if (!invoice)
        throw new parental_service_1.ParentalApiError('Parental tracking invoice not found in this school', 404);
    return invoice;
}
async function recordManualPayment(schoolIdValue, invoiceIdValue, actorUserId, input) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const actorId = parseId(actorUserId, 'actorUserId');
    const amount = parseAmount(input.amount);
    const paymentMethod = optionalText(input.payment_method, 'payment_method');
    if (!paymentMethod || !['cash', 'bank_transfer', 'mobile_money'].includes(paymentMethod)) {
        throw new parental_service_1.ParentalApiError('payment_method must be cash, bank_transfer or mobile_money', 400);
    }
    const transactionReference = optionalText(input.transaction_reference, 'transaction_reference');
    const notes = optionalText(input.notes, 'notes');
    const invoice = await getParentalInvoice(schoolId.toString(), invoiceIdValue);
    if (invoice.status === 'cancelled')
        throw new parental_service_1.ParentalApiError('A cancelled invoice cannot be paid', 409);
    const alreadyPaid = invoice.school_invoice_payments
        .filter((payment) => payment.status === 'completed')
        .reduce((total, payment) => total.add(payment.amount), new client_1.Prisma.Decimal(0));
    const newPaidTotal = alreadyPaid.add(amount);
    if (newPaidTotal.greaterThan(invoice.total_amount)) {
        throw new parental_service_1.ParentalApiError('Payment exceeds the outstanding invoice amount', 409);
    }
    const invoiceStatus = newPaidTotal.equals(invoice.total_amount) ? 'paid' : 'partially_paid';
    const receiptNumber = `REC-${Date.now()}-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
    return client_2.default.$transaction(async (transaction) => {
        const payment = await transaction.school_invoice_payments.create({
            data: {
                school_invoice_id: invoice.id,
                amount,
                currency: invoice.currency,
                payment_method: paymentMethod,
                transaction_reference: transactionReference,
                receipt_number: receiptNumber,
                status: 'completed',
                paid_at: new Date(),
                recorded_by_user_id: actorId,
                notes,
            },
        });
        await transaction.school_invoices.update({
            where: { id: invoice.id },
            data: { status: invoiceStatus, updated_at: new Date() },
        });
        await transaction.activity_logs.create({
            data: audit({
                schoolId,
                userId: actorId,
                table: 'school_invoice_payments',
                referenceId: payment.id,
                type: 'parental_payment_recorded',
                title: 'Enregistrement paiement Suivi parental',
                description: `Paiement ${receiptNumber} de ${amount.toFixed(2)} USD enregistre manuellement.`,
            }),
        });
        return transaction.school_invoice_payments.findUniqueOrThrow({ where: { id: payment.id } });
    });
}
async function createInvoiceDownloadToken(schoolIdValue, invoiceIdentifier) {
    const invoice = await getParentalInvoice(schoolIdValue, invoiceIdentifier);
    const issued = await (0, action_token_service_1.issueActionToken)('invoice_download', {
        invoiceId: invoice.id.toString(),
        resourcePublicId: invoice.public_id,
    });
    return {
        token: issued.token,
        expires_at: issued.expiresAt,
        path: `/api/parental/invoices/download?token=${encodeURIComponent(issued.token)}`,
        invoice: (0, public_id_1.publicInvoiceView)(invoice),
    };
}
async function consumeInvoiceDownloadToken(token) {
    const action = await (0, action_token_service_1.consumeActionToken)(token, 'invoice_download');
    if (!action.school_invoice_id || !action.resource_public_id)
        throw new parental_service_1.ParentalApiError('Temporary link is invalid or expired', 401);
    const invoice = await client_2.default.school_invoices.findFirst({
        where: { id: action.school_invoice_id, public_id: action.resource_public_id, invoice_type: INVOICE_TYPE },
    });
    if (!invoice)
        throw new parental_service_1.ParentalApiError('Temporary link is invalid or expired', 401);
    return (0, public_id_1.publicInvoiceView)(invoice);
}
