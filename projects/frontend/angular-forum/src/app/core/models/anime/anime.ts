export interface Anime {
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
}

export interface PaginatedAnime {
    data: Anime[];
    total: number;
    page: number;
    limit: number;
}
