export const FEATURED_ROUTES = {
    active: () => "/featured",
    admin: {
        list: () => "/featured/admin",
        detail: (id: string) => `/featured/admin/${id}`
    }
} as const;
