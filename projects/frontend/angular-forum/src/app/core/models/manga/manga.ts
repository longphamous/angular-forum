export interface MangaStudio {
    id: number;
    name: string;
}

export interface RelatedManga {
    mangaId: number;
    relation: string;
    title?: string;
    titleEnglish?: string;
    picture?: string;
}

export interface MangaAuthor {
    name: string;
    role?: string;
}

export interface Manga {
    id: number;
    genres?: string[];
    authors?: MangaAuthor[];
    relatedManga?: RelatedManga[];
    title?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleSynonym?: string;
    picture?: string;
    synopsis?: string;
    type?: string;
    status?: string;
    chapters?: number;
    volumes?: number;
    publishing?: boolean;
    score?: number;
    scoredBy?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    serializations?: string[];
    publishedFrom?: string;
    publishedTo?: string;
    publishedString?: string;
    createdAt?: string;
}

export interface PaginatedManga {
    data: Manga[];
    total: number;
    page: number;
    limit: number;
}

export type MangaListStatus = "reading" | "completed" | "plan_to_read" | "on_hold" | "dropped";

export interface MangaListEntry {
    mangaId: number;
    userId: string;
    status: MangaListStatus;
    score?: number;
    review?: string;
    chaptersRead?: number;
    volumesRead?: number;
    createdAt: string;
    updatedAt: string;
    manga?: Manga;
}

export interface MangaListEntryPayload {
    mangaId: number;
    status: MangaListStatus;
    score?: number;
    review?: string;
    chaptersRead?: number;
    volumesRead?: number;
}

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

export interface MangaFilter {
    genre?: string;
    search?: string;
    type?: string;
    status?: string;
    minChapters?: number;
    maxChapters?: number;
    minVolumes?: number;
    maxVolumes?: number;
    minScore?: number;
    maxScore?: number;
    newerThanDays?: number;
    sortBy?: MangaSortField;
    sortOrder?: "ASC" | "DESC";
}
