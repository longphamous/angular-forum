export const BLOG_ROUTES = {
    posts: () => "/blog/posts",
    post: (slug: string) => `/blog/posts/${slug}`,
    updatePost: (id: string) => `/blog/posts/${id}`,
    deletePost: (id: string) => `/blog/posts/${id}`,
    categories: () => "/blog/categories",
    category: (id: string) => `/blog/categories/${id}`,
    postComments: (postId: string) => `/blog/posts/${postId}/comments`,
    deleteComment: (id: string) => `/blog/comments/${id}`
} as const;
