export const USER_ROUTES = {
    admin: {
        create: () => "/user/admin",
        detail: (id: string) => `/user/${id}`,
        list: () => "/user"
    },
    changePassword: () => "/user/change-password",
    profile: () => "/user/profile"
} as const;
