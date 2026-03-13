export const ANIME_ROUTES = {
    detail: (id: number) => `/anime/${id}`,
    genres: () => "/anime/genres",
    list: () => "/anime",
    myList: () => "/anime/list",
    publicList: (userId: string) => `/users/${userId}/anime-list`
} as const;
