export type AnimeV2SortField =
    | "id"
    | "title"
    | "score"
    | "rank"
    | "popularity"
    | "episodes"
    | "year"
    | "members"
    | "favorites"
    | "createdAt";

export type SortOrder = "ASC" | "DESC";

export class AnimeV2QueryDto {
    page?: number;
    limit?: number;

    search?: string;

    type?: string;
    status?: string;
    season?: string;
    source?: string;
    rating?: string;

    year?: number;
    minYear?: number;
    maxYear?: number;
    minEpisodes?: number;
    maxEpisodes?: number;
    minScore?: number;
    maxScore?: number;
    minRank?: number;
    maxRank?: number;

    genre?: string;

    newerThanDays?: number;

    sortBy?: AnimeV2SortField;
    sortOrder?: SortOrder;
}
