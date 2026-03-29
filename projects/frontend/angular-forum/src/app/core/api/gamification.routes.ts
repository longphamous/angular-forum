export const GAMIFICATION_ROUTES = {
    userProgress: (userId: string) => `/gamification/users/${userId}/progress`,
    userHistory: (userId: string) => `/gamification/users/${userId}/history`,
    config: {
        list: () => "/gamification/config",
        update: (eventType: string) => `/gamification/config/${eventType}`
    },
    recalculate: () => "/gamification/recalculate",
    bounty: {
        leaderboard: () => "/bounty/leaderboard",
        me: () => "/bounty/me",
        user: (userId: string) => `/bounty/${userId}`,
        recalculate: () => "/bounty/recalculate"
    }
} as const;
