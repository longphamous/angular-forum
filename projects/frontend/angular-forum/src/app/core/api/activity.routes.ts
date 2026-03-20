export const ACTIVITY_ROUTES = {
    globalFeed: () => "/activities",
    userFeed: (userId: string) => `/activities/user/${userId}`
} as const;
