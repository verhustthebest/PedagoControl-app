import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { getSchoolDashboard } from '../services/school-dashboard.service'

/** Retourne le tableau de bord de l'école après résolution sécurisée du public_id. */
export async function schoolDashboard(request: AuthenticatedRequest, response: Response) {
  try {
    const dashboard = await getSchoolDashboard(BigInt(request.params.schoolId as string))
    if (!dashboard) return response.status(404).json({ message: 'Resource not found' })
    return response.json({ dashboard })
  } catch {
    return response.status(500).json({ message: 'Unable to fetch school dashboard' })
  }
}
