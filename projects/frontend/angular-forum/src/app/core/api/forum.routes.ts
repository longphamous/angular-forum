export const FORUM_ROUTES = {
    categories: {
        list: () => "/forum/categories",
        admin: () => "/forum/categories/admin",
        detail: (id: string) => `/forum/categories/${id}`,
        forums: (categoryId: string) => `/forum/categories/${categoryId}/forums`
    },
    forums: {
        detail: (id: string) => `/forum/forums/${id}`,
        threads: (forumId: string) => `/forum/forums/${forumId}/threads`
    },
    threads: {
        detail: (id: string) => `/forum/threads/${id}`,
        posts: (threadId: string) => `/forum/threads/${threadId}/posts`
    }
} as const;
