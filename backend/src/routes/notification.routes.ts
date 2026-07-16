import { Router } from 'express'
import {
  broadcastMessages,
  messages,
  notifications,
  readAllNotifications,
  readMessage,
  readNotification,
  unreadNotificationCount,
} from '../controllers/notification.controller'
import { authenticateBearerToken } from '../middleware/auth.middleware'
import { requireSchoolContext } from '../middleware/auth.middleware'
import { canBroadcast } from '../security/access-policy'
import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()

function requireBroadcastAccess(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  if (!canBroadcast(request.user)) return response.status(403).json({ message: 'Access forbidden' })
  return next()
}

router.get('/notifications', authenticateBearerToken, notifications)
router.get('/notifications/unread-count', authenticateBearerToken, unreadNotificationCount)
router.patch('/notifications/read-all', authenticateBearerToken, readAllNotifications)
router.patch('/notifications/:id/read', authenticateBearerToken, readNotification)
router.get('/messages', authenticateBearerToken, messages)
router.post(
  '/messages/broadcast',
  authenticateBearerToken,
  requireSchoolContext(),
  requireBroadcastAccess,
  broadcastMessages,
)
router.patch('/messages/:id/read', authenticateBearerToken, readMessage)

export default router
