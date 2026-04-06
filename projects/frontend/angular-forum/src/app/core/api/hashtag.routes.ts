export const HASHTAG_ROUTES = {
    autocomplete: () => "/hashtags/autocomplete",
    trending: () => "/hashtags/trending",
    search: (tag: string) => `/hashtags/${encodeURIComponent(tag)}`
} as const;
