export const MANGA_ROUTES = {
    detail: (id: number) => `/v2/manga/${id}`,
    genres: () => "/v2/manga/genres",
    list: () => "/v2/manga",
    myList: () => "/manga/list",
    publicList: (userId: string) => `/manga/list/user/${userId}`
} as const;
