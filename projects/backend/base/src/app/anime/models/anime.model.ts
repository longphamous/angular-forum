export interface AnimeStudioDto {
    id: number;
    name: string;
}

export interface RelatedAnimeDto {
    animeId: number;
    relation: string;
    title?: string;
    titleEnglish?: string;
    picture?: string;
}

export interface AnimeDto {
    id: number;
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
    createdAt?: Date;
    genres?: string[];
    studios?: AnimeStudioDto[];
    relatedAnime?: RelatedAnimeDto[];
}

export interface PaginatedAnimeDto {
    data: AnimeDto[];
    total: number;
    page: number;
    limit: number;
}
