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

router.post('/parental/schools/:schoolId/invoices/generate', ...view, generateInvoice)
router.get('/parental/schools/:schoolId/invoices', ...view, indexInvoices)
router.get('/parental/schools/:schoolId/invoices/:invoiceId', ...view, showInvoice)
router.post('/parental/schools/:schoolId/invoices/:invoiceId/payments', ...payment, createPayment)

export default router
