export const GAMIFICATION_ROUTES = {
    userProgress: (userId: string) => `/gamification/users/${userId}/progress`,
    config: {
        list: () => "/gamification/config",
        update: (eventType: string) => `/gamification/config/${eventType}`
    },
    recalculate: () => "/gamification/recalculate"
} as const;
