export interface AnimeImageSetDto {
    imageUrl?: string;
    smallImageUrl?: string;
    largeImageUrl?: string;
}

export interface AnimeImagesDto {
    jpg?: AnimeImageSetDto;
    webp?: AnimeImageSetDto;
}

export interface AnimeBroadcastDto {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
}

export interface AnimeAiredDto {
    from?: string;
    to?: string;
    string?: string;
}

export interface AnimeTrailerDto {
    youtubeId?: string;
    url?: string;
    embedUrl?: string;
}

export interface AnimeProducerDto {
    malId: number;
    name: string;
    role?: string;
}

export interface RelatedAnimeV2Dto {
    malId: number;
    relation: string;
    type: string;
    name?: string;
    picture?: string;
}

export interface AnimeCharacterDto {
    malId: number;
    name?: string;
    nameKanji?: string;
    role?: string;
    favorites?: number;
    voiceActors?: AnimeVoiceActorDto[];
}

export interface AnimeVoiceActorDto {
    malId: number;
    name?: string;
    language: string;
}

export interface AnimeStaffMemberDto {
    malId: number;
    name?: string;
    positions: string[];
}

export interface AnimeThemeDto {
    type: "opening" | "ending";
    position: number;
    text: string;
}

export interface AnimeExternalLinkDto {
    name?: string;
    url: string;
}

export interface AnimeRecommendationDto {
    malId: number;
    title?: string;
    votes: number;
}

export interface AnimeStatisticsDto {
    watching: number;
    completed: number;
    onHold: number;
    dropped: number;
    planTo: number;
    total: number;
    scores?: AnimeScoreEntryDto[];
}

export interface AnimeScoreEntryDto {
    score: number;
    votes: number;
    percentage: number;
}

export interface AnimeEpisodeDto {
    episodeId: number;
    title?: string;
    titleJapanese?: string;
    titleRomanji?: string;
    aired?: string;
    filler?: boolean;
    recap?: boolean;
}

export interface AnimeV2Dto {
    id: number;
    url?: string;
    title?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleSynonyms?: string[];
    images?: AnimeImagesDto;
    synopsis?: string;
    background?: string;
    type?: string;
    source?: string;
    episodes?: number;
    status?: string;
    airing?: boolean;
    score?: number;
    scoredBy?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    season?: string;
    year?: number;
    rating?: string;
    duration?: string;
    broadcast?: AnimeBroadcastDto;
    aired?: AnimeAiredDto;
    trailer?: AnimeTrailerDto;
    createdAt?: Date;
    updatedAt?: Date;

    genres?: string[];
    themes?: string[];
    demographics?: string[];
    studios?: AnimeProducerDto[];
    producers?: AnimeProducerDto[];
    licensors?: AnimeProducerDto[];
    relatedEntries?: RelatedAnimeV2Dto[];

    characters?: AnimeCharacterDto[];
    staff?: AnimeStaffMemberDto[];
    openingThemes?: string[];
    endingThemes?: string[];
    episodeList?: AnimeEpisodeDto[];
    externalLinks?: AnimeExternalLinkDto[];
    recommendations?: AnimeRecommendationDto[];
    statistics?: AnimeStatisticsDto;
}

export interface PaginatedAnimeV2Dto {
    data: AnimeV2Dto[];
    total: number;
    page: number;
    limit: number;
}
