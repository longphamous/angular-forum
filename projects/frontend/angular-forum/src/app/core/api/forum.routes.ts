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
        update: (id: string) => `/forum/threads/${id}`,
        delete: (id: string) => `/forum/threads/${id}`,
        posts: (threadId: string) => `/forum/threads/${threadId}/posts`,
        myReactions: (threadId: string) => `/forum/threads/${threadId}/my-reactions`,
        poll: (threadId: string) => `/forum/threads/${threadId}/poll`,
        pollVote: (threadId: string) => `/forum/threads/${threadId}/poll/vote`
    },
    posts: {
        react: (postId: string) => `/forum/posts/${postId}/react`,
        bestAnswer: (threadId: string, postId: string) => `/forum/threads/${threadId}/best-answer/${postId}`
    }
} as const;
