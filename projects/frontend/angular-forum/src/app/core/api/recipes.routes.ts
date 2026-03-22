export const RECIPES_ROUTES = {
    list: () => "/recipes",
    detail: (slug: string) => `/recipes/${slug}`,
    create: () => "/recipes",
    update: (id: string) => `/recipes/${id}`,
    delete: (id: string) => `/recipes/${id}`,
    favorite: (id: string) => `/recipes/${id}/favorite`,
    rate: (id: string) => `/recipes/${id}/rate`,
    comments: (id: string) => `/recipes/${id}/comments`,
    updateComment: (id: string) => `/recipes/comments/${id}`,
    deleteComment: (id: string) => `/recipes/comments/${id}`,
    myRecipes: () => "/recipes/my/recipes",
    myFavorites: () => "/recipes/my/favorites",
    categories: () => "/recipes/categories",
    adminCreateCategory: () => "/recipes/categories",
    adminUpdateCategory: (id: string) => `/recipes/categories/${id}`,
    adminDeleteCategory: (id: string) => `/recipes/categories/${id}`
} as const;
