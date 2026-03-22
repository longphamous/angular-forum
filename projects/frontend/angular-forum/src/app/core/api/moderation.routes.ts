export const MODERATION_ROUTES = {
    myStatus: () => "/moderation/my-status",
    submit: () => "/moderation/submit",
    pending: () => "/moderation/pending",
    history: () => "/moderation/history",
    stats: () => "/moderation/stats",
    approve: (id: string) => `/moderation/approve/${id}`,
    reject: (id: string) => `/moderation/reject/${id}`
} as const;
