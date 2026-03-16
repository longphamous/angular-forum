export const FEED_ROUTES = {
    featured: () => "/feed/featured",
    hot: () => "/feed/hot",
    admin: {
        featured: () => "/feed/admin/featured",
        featuredById: (id: string) => `/feed/admin/featured/${id}`,
        searchThreads: () => "/feed/admin/search-threads"
    }
} as const;
