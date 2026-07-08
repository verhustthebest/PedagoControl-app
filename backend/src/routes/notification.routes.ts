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

const router = Router()

router.get('/notifications', authenticateBearerToken, notifications)
router.get('/notifications/unread-count', authenticateBearerToken, unreadNotificationCount)
router.patch('/notifications/read-all', authenticateBearerToken, readAllNotifications)
router.patch('/notifications/:id/read', authenticateBearerToken, readNotification)
router.get('/messages', authenticateBearerToken, messages)
router.post('/messages/broadcast', authenticateBearerToken, broadcastMessages)
router.patch('/messages/:id/read', authenticateBearerToken, readMessage)

export default router
