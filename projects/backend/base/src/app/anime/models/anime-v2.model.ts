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
    picture?: string;
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

export interface AnimeCharacterListDto {
    malId: number;
    name?: string;
    nameKanji?: string;
    favorites?: number;
    picture?: string;
    animeAppearances: number;
}

export interface AnimeCharacterDetailDto {
    malId: number;
    url?: string;
    name?: string;
    nameKanji?: string;
    nicknames?: string[];
    favorites?: number;
    about?: string;
    picture?: string;
    animeography: AnimeCharacterAnimeDto[];
    mangaography: AnimeCharacterMangaDto[];
    voiceActors: CharacterVoiceActorDto[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AnimeCharacterAnimeDto {
    malId: number;
    title?: string;
    picture?: string;
    role?: string;
}

export interface AnimeCharacterMangaDto {
    malId: number;
    title?: string;
    picture?: string;
    role?: string;
}

export interface CharacterVoiceActorDto {
    malId: number;
    name?: string;
    language: string;
    animeMalId: number;
    animeTitle?: string;
}

export interface PaginatedAnimeCharacterListDto {
    data: AnimeCharacterListDto[];
    total: number;
    page: number;
    limit: number;
}

export interface PersonListDto {
    malId: number;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
    favorites?: number;
    birthday?: string;
}

export interface PersonDetailDto {
    malId: number;
    url?: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    alternateNames?: string[];
    picture?: string;
    favorites?: number;
    birthday?: string;
    about?: string;
    staffRoles: PersonStaffRoleDto[];
    voiceActingRoles: PersonVoiceActingRoleDto[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PersonStaffRoleDto {
    animeMalId: number;
    animeTitle?: string;
    animePicture?: string;
    positions: string[];
}

export interface PersonVoiceActingRoleDto {
    animeMalId: number;
    animeTitle?: string;
    animePicture?: string;
    characterMalId: number;
    characterName?: string;
    characterPicture?: string;
    language: string;
}

export interface PaginatedPersonListDto {
    data: PersonListDto[];
    total: number;
    page: number;
    limit: number;
}
