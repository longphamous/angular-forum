export const ADMIN_LOGS_ROUTES = {
    list: () => "/admin/logs",
    stats: () => "/admin/logs/stats",
    cleanup: () => "/admin/logs/cleanup"
} as const;
