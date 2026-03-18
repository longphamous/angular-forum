export const CHRONIK_ROUTES = {
    entries: "/api/chronik",
    entry: (id: string) => `/api/chronik/${id}`,
    like: (id: string) => `/api/chronik/${id}/like`,
    hide: (id: string) => `/api/chronik/${id}/hide`,
    comments: (id: string) => `/api/chronik/${id}/comments`,
    commentLike: (commentId: string) => `/api/chronik/comments/${commentId}/like`,
    deleteComment: (commentId: string) => `/api/chronik/comments/${commentId}`,
    follow: (userId: string) => `/api/chronik/follow/${userId}`,
    following: "/api/chronik/following",
    followers: "/api/chronik/followers",
    stats: (userId: string) => `/api/chronik/stats/${userId}`
} as const;
