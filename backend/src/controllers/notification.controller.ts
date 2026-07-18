import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  broadcastMessage,
  getUnreadNotificationCount,
  getUserMessages,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service'

function requireUser(request: AuthenticatedRequest, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: 'Authentication required' })
    return null
  }

  return request.user
}

export async function notifications(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const items = await getUserNotifications(user)
    return response.json({ notifications: items })
  } catch (error) {
    return response.status(500).json({ message: 'Unable to fetch notifications' })
  }
}

export async function unreadNotificationCount(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const count = await getUnreadNotificationCount(user)
    return response.json({ count })
  } catch (error) {
    return response.status(500).json({ message: 'Unable to fetch unread notification count' })
  }
}

export async function readNotification(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const item = await markNotificationRead(user, String(request.params.id))
    return response.json({ notification: item })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to mark notification read'
    return response.status(message.includes('not found') ? 404 : 500).json({ message })
  }
}

export async function readAllNotifications(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const count = await markAllNotificationsRead(user)
    return response.json({ count })
  } catch (error) {
    return response.status(500).json({ message: 'Unable to mark all notifications read' })
  }
}

export async function messages(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const items = await getUserMessages(user)
    return response.json({ messages: items })
  } catch (error) {
    return response.status(500).json({ message: 'Unable to fetch messages' })
  }
}

export async function broadcastMessages(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const items = await broadcastMessage(user, request.body as { title?: string; message?: string; recipient?: string })
    return response.status(201).json({ messages: items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to broadcast message'
    return response.status(message.includes('required') ? 400 : 500).json({ message })
  }
}

export async function readMessage(request: AuthenticatedRequest, response: Response) {
  return readNotification(request, response)
}
