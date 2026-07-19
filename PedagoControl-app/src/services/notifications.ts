import { apiRequest } from './api'
import type { NotificationDeliveryStatus } from '../components/common/NotificationDeliveryBadge'

export type AppNotification = {
  id: string
  title: string
  message: string
  notification_type: string
  reference_table?: string | null
  reference_id?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  delivery_status?: NotificationDeliveryStatus | null
}

export const notificationsApi = {
  list: async () => {
    const data = await apiRequest<{ notifications: AppNotification[] }>('/notifications')
    return data.notifications
  },
  unreadCount: async () => {
    const data = await apiRequest<{ count: number }>('/notifications/unread-count')
    return data.count
  },
  markRead: (id: string) =>
    apiRequest<{ notification: AppNotification }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllRead: () =>
    apiRequest<{ count: number }>('/notifications/read-all', {
      method: 'PATCH',
    }),
}

export const messagesApi = {
  list: async () => {
    const data = await apiRequest<{ messages: AppNotification[] }>('/messages')
    return data.messages
  },
  broadcast: (input: { message: string; title?: string; recipient?: string }) =>
    apiRequest<{ messages: AppNotification[] }>('/messages/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title || 'Nouveau message',
        message: input.message,
        recipient: input.recipient || 'all_teachers',
      }),
    }),
  markRead: (id: string) =>
    apiRequest<{ notification: AppNotification }>(`/messages/${id}/read`, {
      method: 'PATCH',
    }),
}
