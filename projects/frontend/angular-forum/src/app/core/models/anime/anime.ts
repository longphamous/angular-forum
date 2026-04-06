export interface AnimeStudio {
    id: number;
    name: string;
}

export interface RelatedAnime {
    animeId: number;
    relation: string;
    title?: string;
    titleEnglish?: string;
    picture?: string;
}

export interface AnimeVoiceActor {
    malId: number;
    name?: string;
    language: string;
}

export interface AnimeCharacter {
    malId: number;
    name?: string;
    nameKanji?: string;
    role?: string;
    favorites?: number;
    picture?: string;
    voiceActors?: AnimeVoiceActor[];
}

export interface Anime {
    id: number;
    genres?: string[];
    studios?: AnimeStudio[];
    relatedAnime?: RelatedAnime[];
    characters?: AnimeCharacter[];
    title?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleSynonym?: string;
    picture?: string;
    synopsis?: string;
    type?: string;
    status?: string;
    nsfw?: boolean;
    episode?: number;
    episodeDuration?: number;
    season?: string;
    seasonYear?: number;
    broadcastDay?: string;
    broadcastTime?: string;
    source?: string;
    rating?: string;
    mean?: number;
    rank?: number;
    popularity?: number;
    member?: number;
    voter?: number;
    startYear?: number;
    startMonth?: number;
    startDay?: number;
    endYear?: number;
    endMonth?: number;
    endDay?: number;
    userWatching?: number;
    userCompleted?: number;
    userOnHold?: number;
    userDropped?: number;
    userPlanned?: number;
    createdAt?: string;
}

export interface PaginatedAnime {
    data: Anime[];
    total: number;
    page: number;
    limit: number;
}

export type AnimeListStatus = "watching" | "completed" | "plan_to_watch" | "on_hold" | "dropped";

export interface AnimeListEntry {
    animeId: number;
    userId: string;
    status: AnimeListStatus;
    score?: number;
    review?: string;
    episodesWatched?: number;
    createdAt: string;
    updatedAt: string;
    anime?: Anime;
}

export interface AnimeListEntryPayload {
    animeId: number;
    status: AnimeListStatus;
    score?: number;
    review?: string;
    episodesWatched?: number;
}

export type AnimeSortField =
    | "id"
    | "title"
    | "mean"
    | "rank"
    | "popularity"
    | "episode"
    | "seasonYear"
    | "startYear"
    | "member"
    | "voter"
    | "createdAt";

export interface AnimeFilter {
    genre?: string;
    search?: string;
    type?: string;
    status?: string;
    season?: string;
    seasonYear?: number;
    startYear?: number;
    endYear?: number;
    source?: string;
    rating?: string;
    nsfw?: boolean;
    minEpisodes?: number;
    maxEpisodes?: number;
    minScore?: number;
    maxScore?: number;
    newerThanDays?: number;
    sortBy?: AnimeSortField;
    sortOrder?: "ASC" | "DESC";
}
