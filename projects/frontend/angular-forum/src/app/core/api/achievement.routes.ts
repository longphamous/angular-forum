export const ACHIEVEMENT_ROUTES = {
    all: () => "/gamification/achievements",
    user: (userId: string) => `/gamification/achievements/user/${userId}`,
    admin: {
        list: () => "/gamification/achievements/admin",
        create: () => "/gamification/achievements/admin",
        update: (id: string) => `/gamification/achievements/admin/${id}`,
        delete: (id: string) => `/gamification/achievements/admin/${id}`
    }
} as const;
