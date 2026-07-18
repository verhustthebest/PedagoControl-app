import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  generateParentalInvoice,
  getParentalInvoice,
  listParentalInvoices,
  recordManualPayment,
} from '../services/parental-billing.service'
import { ParentalApiError } from '../services/parental.service'

function parameter(request: AuthenticatedRequest, name: string) {
  const value = request.params[name]
  return Array.isArray(value) ? value[0] : value
}
function query(value: unknown) {
  return typeof value === 'string' ? value : undefined
}
function serialize(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)))
}
function handleError(response: Response, error: unknown, fallback: string) {
  if (error instanceof ParentalApiError) return response.status(error.statusCode).json({ message: error.message })
  return response.status(500).json({ message: fallback })
}

export async function generateInvoice(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const invoice = await generateParentalInvoice(
      parameter(request, 'schoolId'),
      request.user.id,
      request.body?.billing_month,
    )
    return response.status(201).json({ invoice: serialize(invoice) })
  } catch (error) {
    return handleError(response, error, 'Unable to generate parental invoice')
  }
}
export async function indexInvoices(request: AuthenticatedRequest, response: Response) {
  try {
    return response.json(
      serialize(
        await listParentalInvoices(parameter(request, 'schoolId'), {
          page: query(request.query.page),
          limit: query(request.query.limit),
          status: query(request.query.status),
        }),
      ),
    )
  } catch (error) {
    return handleError(response, error, 'Unable to fetch parental invoices')
  }
}
export async function showInvoice(request: AuthenticatedRequest, response: Response) {
  try {
    return response.json({
      invoice: serialize(
        await getParentalInvoice(parameter(request, 'schoolId'), parameter(request, 'invoiceId')),
      ),
    })
  } catch (error) {
    return handleError(response, error, 'Unable to fetch parental invoice')
  }
}
export async function createPayment(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const payment = await recordManualPayment(
      parameter(request, 'schoolId'),
      parameter(request, 'invoiceId'),
      request.user.id,
      request.body,
    )
    return response.status(201).json({ payment: serialize(payment) })
  } catch (error) {
    return handleError(response, error, 'Unable to record school payment')
  }
}
