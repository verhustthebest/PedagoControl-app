import { Router } from 'express'
import {
  createPayment,
  generateInvoice,
  indexInvoices,
  showInvoice,
  createDownloadToken,
  downloadInvoice,
} from '../controllers/parental-billing.controller'
import {
  authenticateBearerToken,
  requirePermission,
  requireSchoolScope,
} from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { actionTokenQuery, invoiceGenerateBody, invoiceListQuery, invoiceParams, paymentBody, schoolParams } from '../validation/schemas'

const router = Router()
const view = [
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('VIEW_PARENTAL_INVOICES'),
] as const
const generate = [authenticateBearerToken, requireSchoolScope(), requirePermission('GENERATE_PARENTAL_INVOICE')] as const
const payment = [
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('RECORD_PARENTAL_PAYMENT'),
] as const
const print = [authenticateBearerToken, requireSchoolScope(), requirePermission('PRINT_PARENTAL_INVOICE')] as const

router.post('/parental/schools/:schoolId/invoices/generate', ...generate, validate({ params: schoolParams, body: invoiceGenerateBody }), generateInvoice)
router.get('/parental/schools/:schoolId/invoices', ...view, validate({ params: schoolParams, query: invoiceListQuery }), indexInvoices)
router.get('/parental/schools/:schoolId/invoices/:invoiceId', ...view, validate({ params: invoiceParams }), showInvoice)
router.post('/parental/schools/:schoolId/invoices/:invoiceId/payments', ...payment, validate({ params: invoiceParams, body: paymentBody }), createPayment)
router.post('/parental/schools/:schoolId/invoices/:invoiceId/download-token', ...print, validate({ params: invoiceParams }), createDownloadToken)
router.get('/parental/invoices/download', validate({ query: actionTokenQuery }), downloadInvoice)

export default router
