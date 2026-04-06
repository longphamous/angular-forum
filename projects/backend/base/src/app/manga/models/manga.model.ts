export interface MangaImageSetDto {
    imageUrl?: string;
    smallImageUrl?: string;
    largeImageUrl?: string;
}

export interface MangaImagesDto {
    jpg?: MangaImageSetDto;
    webp?: MangaImageSetDto;
}

export interface MangaPublishedDto {
    from?: string;
    to?: string;
    string?: string;
}

export interface MangaAuthorDto {
    malId: number;
    name: string;
    role?: string;
}

export interface RelatedMangaDto {
    malId: number;
    relation: string;
    type: string;
    name?: string;
    picture?: string;
}

export interface MangaCharacterDto {
    malId: number;
    name?: string;
    nameKanji?: string;
    role?: string;
    favorites?: number;
}

export interface MangaExternalLinkDto {
    name?: string;
    url: string;
}

export interface MangaRecommendationDto {
    malId: number;
    title?: string;
    votes: number;
}

export interface MangaStatisticsDto {
    reading: number;
    completed: number;
    onHold: number;
    dropped: number;
    planTo: number;
    total: number;
    scores?: MangaScoreEntryDto[];
}

export interface MangaScoreEntryDto {
    score: number;
    votes: number;
    percentage: number;
}

export interface MangaDto {
    id: number;
    url?: string;
    title?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleSynonyms?: string[];
    images?: MangaImagesDto;
    synopsis?: string;
    background?: string;
    type?: string;
    chapters?: number;
    volumes?: number;
    status?: string;
    publishing?: boolean;
    score?: number;
    scoredBy?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    published?: MangaPublishedDto;
    createdAt?: Date;
    updatedAt?: Date;

    genres?: string[];
    themes?: string[];
    demographics?: string[];
    authors?: MangaAuthorDto[];
    serializations?: string[];
    relatedEntries?: RelatedMangaDto[];

    characters?: MangaCharacterDto[];
    externalLinks?: MangaExternalLinkDto[];
    recommendations?: MangaRecommendationDto[];
    statistics?: MangaStatisticsDto;
}

export interface PaginatedMangaDto {
    data: MangaDto[];
    total: number;
    page: number;
    limit: number;
}
