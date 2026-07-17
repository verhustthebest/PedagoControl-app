import { Router } from 'express'
import {
  createPayment,
  generateInvoice,
  indexInvoices,
  showInvoice,
} from '../controllers/parental-billing.controller'
import {
  authenticateBearerToken,
  requirePermission,
  requireSchoolScope,
} from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { invoiceGenerateBody, invoiceListQuery, invoiceParams, paymentBody, schoolParams } from '../validation/schemas'

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
router.get('/parental/schools/:schoolId/invoices/:invoiceId', ...view, validate({ params: invoiceParams }), showInvoice)
router.post('/parental/schools/:schoolId/invoices/:invoiceId/payments', ...payment, validate({ params: invoiceParams, body: paymentBody }), createPayment)

export default router
