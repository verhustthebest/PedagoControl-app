import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { finalizeSchool, listSubscriptionCatalog, saveSchoolDraft } from '../services/school-onboarding.service'

export async function subscriptions(_request: AuthenticatedRequest, response: Response) {
  const items = await listSubscriptionCatalog()
  return response.json({ items: items.map((item) => ({ ...item, monthly_price: item.monthly_price.toString(), annual_price: item.annual_price?.toString() ?? null })) })
}
export async function saveDraft(request: AuthenticatedRequest, response: Response) {
  const draft = await saveSchoolDraft(request.user!.id, request.body)
  return draft ? response.status(request.body.draft_id ? 200 : 201).json({ draft }) : response.status(404).json({ message: 'Resource not found' })
}
export async function createSchoolOnboarding(request: AuthenticatedRequest, response: Response) {
  try {
    const result = await finalizeSchool(request.user!.id, request.body)
    if (result.kind === 'not_found') return response.status(404).json({ message: 'Resource not found' })
    if (result.kind === 'conflict') return response.status(409).json({ message: 'Operation already in progress' })
    return response.status(result.repeated ? 200 : 201).json({ school: { public_id: result.public_id }, repeated: result.repeated })
  } catch { return response.status(400).json({ message: 'Unable to create school with the supplied configuration' }) }
}
