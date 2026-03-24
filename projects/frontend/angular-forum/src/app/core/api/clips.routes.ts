export const CLIPS_ROUTES = {
    feed: () => "/clips/feed",
    clip: (id: string) => `/clips/${id}`,
    userClips: (userId: string) => `/clips/user/${userId}`,
    create: () => "/clips",
    update: (id: string) => `/clips/${id}`,
    delete: (id: string) => `/clips/${id}`,
    like: (id: string) => `/clips/${id}/like`,
    view: (id: string) => `/clips/${id}/view`,
    share: (id: string) => `/clips/${id}/share`,
    comments: (id: string) => `/clips/${id}/comments`,
    comment: (id: string) => `/clips/comments/${id}`,
    follow: (id: string) => `/clips/${id}/follow`,
    // Stats
    statsTrackView: (id: string) => `/clips/stats/${id}/view`,
    statsClip: (id: string) => `/clips/stats/${id}`,
    statsAuthor: (authorId: string) => `/clips/stats/author/${authorId}`,
    statsTrending: () => "/clips/stats/trending/list",
    statsRecommendation: (id: string) => `/clips/stats/${id}/recommendations`
} as const;
