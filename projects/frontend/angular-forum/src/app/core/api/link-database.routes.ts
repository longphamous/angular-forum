export const LINK_ROUTES = {
    categories: () => "/links/categories",
    category: (id: string) => `/links/categories/${id}`,
    links: () => "/links",
    link: (id: string) => `/links/${id}`,
    rate: (id: string) => `/links/${id}/rate`,
    comments: (id: string) => `/links/${id}/comments`,
    comment: (id: string) => `/links/comments/${id}`,
    approve: (id: string) => `/links/${id}/approve`,
    reject: (id: string) => `/links/${id}/reject`,
    assign: (id: string) => `/links/${id}/assign`,
    pending: () => "/links/admin/pending",
    adminCategories: () => "/links/admin/categories",
    adminCategory: (id: string) => `/links/admin/categories/${id}`
} as const;
