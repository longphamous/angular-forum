export const ANIME_ROUTES = {
    detail: (id: number) => `/v2/anime/${id}`,
    genres: () => "/v2/anime/genres",
    list: () => "/v2/anime",
    myList: () => "/anime/list",
    publicList: (userId: string) => `/anime/list/user/${userId}`
} as const;
