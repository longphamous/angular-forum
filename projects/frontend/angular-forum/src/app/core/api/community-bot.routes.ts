export const COMMUNITY_BOT_ROUTES = {
    bots: () => "/community-bot",
    bot: (id: string) => `/community-bot/${id}`,
    toggle: (id: string) => `/community-bot/${id}/toggle`,
    test: (id: string) => `/community-bot/${id}/test`,
    stats: () => "/community-bot/stats",
    logs: () => "/community-bot/logs",
    queue: () => "/community-bot/queue"
} as const;
