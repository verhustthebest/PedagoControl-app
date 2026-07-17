import { Router } from 'express'
import {
  acknowledgeJournal,
  ownChildJournals,
  ownChildren,
  ownNotifications,
} from '../controllers/parent-portal.controller'
import {
  authenticateBearerToken,
  requirePermission,
  requireRole,
} from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { acknowledgementBody, journalQuery, notificationQuery } from '../validation/schemas'
import { z } from 'zod'

const childParams = z.object({ studentId: z.string().regex(/^[1-9]\d*$/) }).strict()

const router = Router()
const parent = [authenticateBearerToken, requireRole('PARENT')] as const

router.get('/parental/me/children', ...parent, requirePermission('VIEW_OWN_CHILDREN'), ownChildren)
router.get(
  '/parental/me/children/:studentId/journals',
  ...parent,
  requirePermission('VIEW_OWN_DAILY_JOURNALS'),
  validate({ params: childParams, query: journalQuery }),
  ownChildJournals,
)
router.post(
  '/parental/me/children/:studentId/acknowledgements',
  ...parent,
  requirePermission('ACKNOWLEDGE_DAILY_JOURNAL'),
  validate({ params: childParams, body: acknowledgementBody }),
  acknowledgeJournal,
)
router.get(
  '/parental/me/notifications',
  ...parent,
  requirePermission('VIEW_OWN_NOTIFICATIONS'),
  validate({ query: notificationQuery }),
  ownNotifications,
)

export default router
