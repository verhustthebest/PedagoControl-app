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
import { resolvePublicResource } from '../middleware/public-resource.middleware'

const router = Router()
const view = [
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('VIEW_SCHOOL_INVOICES'),
] as const
const payment = [
  authenticateBearerToken,
  requireSchoolScope(),
  requirePermission('RECORD_SCHOOL_PAYMENT'),
] as const

router.post('/parental/schools/:schoolId/invoices/generate', ...view, validate({ params: schoolParams, body: invoiceGenerateBody }), generateInvoice)
router.get('/parental/schools/:schoolId/invoices', ...view, validate({ params: schoolParams, query: invoiceListQuery }), indexInvoices)
router.get('/parental/schools/:schoolId/invoices/:invoiceId', ...view, resolvePublicResource('invoice', 'invoiceId'), validate({ params: invoiceParams }), showInvoice)
router.post('/parental/schools/:schoolId/invoices/:invoiceId/payments', ...payment, resolvePublicResource('invoice', 'invoiceId'), validate({ params: invoiceParams, body: paymentBody }), createPayment)
router.post('/parental/schools/:schoolId/invoices/:invoiceId/download-token', ...view, resolvePublicResource('invoice', 'invoiceId'), validate({ params: invoiceParams }), createDownloadToken)
router.get('/parental/invoices/download', validate({ query: actionTokenQuery }), downloadInvoice)

export default router
