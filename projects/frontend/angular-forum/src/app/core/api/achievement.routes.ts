export const ACHIEVEMENT_ROUTES = {
    all: () => "/gamification/achievements",
    user: (userId: string) => `/gamification/achievements/user/${userId}`,
    progress: (userId: string) => `/gamification/achievements/progress/${userId}`,
    categories: () => "/gamification/achievements/categories",
    admin: {
        list: () => "/gamification/achievements/admin",
        detail: (id: string) => `/gamification/achievements/admin/${id}/detail`,
        create: () => "/gamification/achievements/admin",
        update: (id: string) => `/gamification/achievements/admin/${id}`,
        delete: (id: string) => `/gamification/achievements/admin/${id}`,
        grant: () => "/gamification/achievements/admin/grant",
        revoke: (userId: string, achievementId: string) => `/gamification/achievements/admin/revoke/${userId}/${achievementId}`,
        history: () => "/gamification/achievements/admin/history",
        createCategory: () => "/gamification/achievements/categories",
        updateCategory: (id: string) => `/gamification/achievements/categories/${id}`,
        deleteCategory: (id: string) => `/gamification/achievements/categories/${id}`
    }
} as const;
