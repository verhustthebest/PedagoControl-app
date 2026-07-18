export const PUBLIC_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isPublicId(value: string) {
  return PUBLIC_ID_PATTERN.test(value)
}

export function opaqueResourceWhere(value: string) {
  if (isPublicId(value)) return { public_id: value }
  if (/^[1-9]\d*$/.test(value)) return { id: BigInt(value) }
  throw new Error('Invalid resource identifier')
}

export function publicInvoiceView(invoice: {
  public_id: string; invoice_number: string; invoice_type: string; issue_date: Date; due_date: Date;
  total_amount: unknown; currency: string; status: string
}) {
  return {
    public_id: invoice.public_id,
    invoice_number: invoice.invoice_number,
    invoice_type: invoice.invoice_type,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    total_amount: invoice.total_amount,
    currency: invoice.currency,
    status: invoice.status,
  }
}
