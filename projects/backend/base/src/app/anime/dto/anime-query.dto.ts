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
    | "voter";

export type SortOrder = "ASC" | "DESC";

export class AnimeQueryDto {
    // Pagination
    page?: number;
    limit?: number;

    // Full-text / title search
    search?: string;

    // Exact matches
    type?: string;
    status?: string;
    season?: string;
    source?: string;
    rating?: string;
    nsfw?: string; // "true" | "false" – parsed as boolean in service

    // Range filters
    seasonYear?: number;
    startYear?: number;
    endYear?: number;
    minEpisodes?: number;
    maxEpisodes?: number;
    minScore?: number;
    maxScore?: number;
    minRank?: number;
    maxRank?: number;

    // Sorting
    sortBy?: AnimeSortField;
    sortOrder?: SortOrder;
}
