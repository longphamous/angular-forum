export const ANIME_ROUTES = {
    detail: (id: number) => `/v2/anime/${id}`,
    genres: () => "/v2/anime/genres",
    list: () => "/v2/anime",
    characters: () => "/v2/anime/characters",
    characterDetail: (id: number) => `/v2/anime/characters/${id}`,
    people: () => "/v2/anime/people",
    personDetail: (id: number) => `/v2/anime/people/${id}`,
    myList: () => "/anime/list",
    publicList: (userId: string) => `/anime/list/user/${userId}`
} as const;
