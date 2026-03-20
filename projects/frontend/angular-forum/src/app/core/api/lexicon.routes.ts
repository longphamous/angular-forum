export const LEXICON_ROUTES = {
    categories: () => "/lexicon/categories",
    category: (id: string) => `/lexicon/categories/${id}`,
    articles: () => "/lexicon/articles",
    article: (slug: string) => `/lexicon/articles/${slug}`,
    articleById: (id: string) => `/lexicon/articles/${id}`,
    versions: (id: string) => `/lexicon/articles/${id}/versions`,
    version: (id: string, v: number) => `/lexicon/articles/${id}/versions/${v}`,
    restore: (id: string, v: number) => `/lexicon/articles/${id}/restore/${v}`,
    lock: (id: string) => `/lexicon/articles/${id}/lock`,
    protectVersion: (id: string, v: number) => `/lexicon/articles/${id}/versions/${v}/protect`,
    comments: (id: string) => `/lexicon/articles/${id}/comments`,
    comment: (id: string) => `/lexicon/comments/${id}`,
    report: (id: string) => `/lexicon/articles/${id}/report`,
    search: () => "/lexicon/search",
    detectTerms: () => "/lexicon/detect-terms",
    terms: (lang: string) => `/lexicon/terms/${lang}`,
    moderation: {
        pending: () => "/lexicon/moderation/pending",
        approve: (id: string) => `/lexicon/moderation/${id}/approve`,
        reject: (id: string) => `/lexicon/moderation/${id}/reject`,
        reports: () => "/lexicon/moderation/reports",
        resolveReport: (id: string) => `/lexicon/moderation/reports/${id}`
    }
} as const;
