export const NOTIFICATIONS_ROUTES = {
    list: () => "/notifications",
    unreadCount: () => "/notifications/unread-count",
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: () => "/notifications/read-all",
    delete: (id: string) => `/notifications/${id}`,
    deleteAll: () => "/notifications"
} as const;
