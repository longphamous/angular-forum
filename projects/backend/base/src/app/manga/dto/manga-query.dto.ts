export type MangaSortField =
    | "id"
    | "title"
    | "score"
    | "rank"
    | "popularity"
    | "chapters"
    | "volumes"
    | "members"
    | "favorites"
    | "createdAt";

export type SortOrder = "ASC" | "DESC";

export class MangaQueryDto {
    page?: number;
    limit?: number;

    search?: string;

    type?: string;
    status?: string;

    minChapters?: number;
    maxChapters?: number;
    minVolumes?: number;
    maxVolumes?: number;
    minScore?: number;
    maxScore?: number;
    minRank?: number;
    maxRank?: number;

    genre?: string;

    newerThanDays?: number;

    sortBy?: MangaSortField;
    sortOrder?: SortOrder;
}
