import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AnimeV2QueryDto, AnimeV2SortField, CharacterQueryDto, CharacterSortField, PersonQueryDto, PersonSortField } from "./dto/anime-v2-query.dto";
import { AnimeV2Entity } from "./entities/anime-v2.entity";
import {
    AnimeAiredDto,
    AnimeBroadcastDto,
    AnimeCharacterAnimeDto,
    AnimeCharacterDetailDto,
    AnimeCharacterDto,
    AnimeCharacterListDto,
    AnimeCharacterMangaDto,
    AnimeEpisodeDto,
    AnimeExternalLinkDto,
    AnimeImageSetDto,
    AnimeImagesDto,
    AnimeProducerDto,
    AnimeRecommendationDto,
    CharacterVoiceActorDto,
    AnimeScoreEntryDto,
    AnimeStaffMemberDto,
    AnimeStatisticsDto,
    AnimeThemeDto,
    AnimeTrailerDto,
    AnimeV2Dto,
    AnimeVoiceActorDto,
    PaginatedAnimeCharacterListDto,
    PaginatedAnimeV2Dto,
    PaginatedPersonListDto,
    PersonDetailDto,
    PersonListDto,
    PersonStaffRoleDto,
    PersonVoiceActingRoleDto,
    RelatedAnimeV2Dto
} from "./models/anime-v2.model";

export const ANIMEDB_V2_CONNECTION = "animedb-v2";

const ALLOWED_PERSON_SORT_FIELDS: Record<PersonSortField, string> = {
    name: "p.name",
    favorites: "p.favorites",
    birthday: "p.birthday"
};

const ALLOWED_CHARACTER_SORT_FIELDS: Record<CharacterSortField, string> = {
    name: "c.name",
    favorites: "c.favorites"
};

const ALLOWED_SORT_FIELDS: Record<AnimeV2SortField, string> = {
    id: "anime.mal_id",
    title: "anime.title",
    score: "anime.score",
    rank: "anime.rank",
    popularity: "anime.popularity",
    episodes: "anime.episodes",
    year: "anime.year",
    members: "anime.members",
    favorites: "anime.favorites",
    createdAt: "anime.created_at"
};

function extractImages(raw: Record<string, unknown>): AnimeImagesDto | undefined {
    const images = raw["images"] as Record<string, Record<string, string>> | undefined;
    if (!images) return undefined;

    const mapSet = (s: Record<string, string> | undefined): AnimeImageSetDto | undefined =>
        s
            ? {
                  imageUrl: s["image_url"],
                  smallImageUrl: s["small_image_url"],
                  largeImageUrl: s["large_image_url"]
              }
            : undefined;

    return { jpg: mapSet(images["jpg"]), webp: mapSet(images["webp"]) };
}

function extractBroadcast(raw: Record<string, unknown>): AnimeBroadcastDto | undefined {
    const b = raw["broadcast"] as Record<string, string> | undefined;
    if (!b) return undefined;
    return { day: b["day"], time: b["time"], timezone: b["timezone"], string: b["string"] };
}

function extractAired(raw: Record<string, unknown>): AnimeAiredDto | undefined {
    const a = raw["aired"] as Record<string, unknown> | undefined;
    if (!a) return undefined;
    return {
        from: a["from"] as string | undefined,
        to: a["to"] as string | undefined,
        string: a["string"] as string | undefined
    };
}

function extractTrailer(raw: Record<string, unknown>): AnimeTrailerDto | undefined {
    const t = raw["trailer"] as Record<string, unknown> | undefined;
    if (!t) return undefined;
    return {
        youtubeId: (t["youtube_id"] as string) ?? undefined,
        url: (t["url"] as string) ?? undefined,
        embedUrl: (t["embed_url"] as string) ?? undefined
    };
}

function extractStringArray(raw: Record<string, unknown>, key: string): string[] {
    const arr = raw[key] as Array<{ name?: string }> | undefined;
    if (!Array.isArray(arr)) return [];
    return arr.map((g) => g.name).filter((n): n is string => !!n);
}

function toListDto(entity: AnimeV2Entity, genres: string[] = [], producers: AnimeProducerDto[] = []): AnimeV2Dto {
    const raw = entity.rawJson ?? {};
    const studios = producers.filter((p) => p.role === "studio");
    const licensors = producers.filter((p) => p.role === "licensor");
    const producersOnly = producers.filter((p) => p.role === "producer");

    return {
        id: entity.malId,
        url: entity.url,
        title: entity.title,
        titleEnglish: entity.titleEnglish,
        titleJapanese: entity.titleJapanese,
        titleSynonyms: (raw["title_synonyms"] as string[]) ?? [],
        images: extractImages(raw),
        synopsis: entity.synopsis,
        background: (raw["background"] as string) ?? undefined,
        type: entity.type,
        source: entity.source,
        episodes: entity.episodes ?? undefined,
        status: entity.status,
        airing: entity.airing,
        score: entity.score != null ? Number(entity.score) : undefined,
        scoredBy: entity.scoredBy ?? undefined,
        rank: entity.rank ?? undefined,
        popularity: entity.popularity ?? undefined,
        members: entity.members ?? undefined,
        favorites: entity.favorites ?? undefined,
        season: entity.season,
        year: entity.year ?? undefined,
        rating: entity.rating,
        duration: entity.duration,
        broadcast: extractBroadcast(raw),
        aired: extractAired(raw),
        trailer: extractTrailer(raw),
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        genres,
        themes: extractStringArray(raw, "themes"),
        demographics: extractStringArray(raw, "demographics"),
        studios: studios.map(({ malId, name }) => ({ malId, name })),
        producers: producersOnly.map(({ malId, name }) => ({ malId, name })),
        licensors: licensors.map(({ malId, name }) => ({ malId, name }))
    };
}

@Injectable()
export class AnimeV2Service {
    constructor(
        @InjectRepository(AnimeV2Entity, ANIMEDB_V2_CONNECTION)
        private readonly animeRepo: Repository<AnimeV2Entity>
    ) {}

    async findAll(page: number, limit: number, query: AnimeV2QueryDto): Promise<PaginatedAnimeV2Dto> {
        const qb = this.animeRepo.createQueryBuilder("anime");

        if (query.search) {
            const search = `%${query.search.toLowerCase()}%`;
            qb.andWhere(
                "(LOWER(anime.title) LIKE :search OR LOWER(anime.title_english) LIKE :search OR LOWER(anime.title_japanese) LIKE :search)",
                { search }
            );
        }

        if (query.type) {
            qb.andWhere("LOWER(anime.type) = LOWER(:type)", { type: query.type });
        }
        if (query.status) {
            qb.andWhere("LOWER(anime.status) = LOWER(:status)", { status: query.status });
        }
        if (query.season) {
            qb.andWhere("LOWER(anime.season) = LOWER(:season)", { season: query.season });
        }
        if (query.source) {
            qb.andWhere("LOWER(anime.source) = LOWER(:source)", { source: query.source });
        }
        if (query.rating) {
            qb.andWhere("LOWER(anime.rating) = LOWER(:rating)", { rating: query.rating });
        }

        if (query.year !== undefined) {
            qb.andWhere("anime.year = :year", { year: query.year });
        }
        if (query.minYear !== undefined) {
            qb.andWhere("anime.year >= :minYear", { minYear: query.minYear });
        }
        if (query.maxYear !== undefined) {
            qb.andWhere("anime.year <= :maxYear", { maxYear: query.maxYear });
        }

        if (query.minEpisodes !== undefined) {
            qb.andWhere("anime.episodes >= :minEpisodes", { minEpisodes: query.minEpisodes });
        }
        if (query.maxEpisodes !== undefined) {
            qb.andWhere("anime.episodes <= :maxEpisodes", { maxEpisodes: query.maxEpisodes });
        }

        if (query.minScore !== undefined) {
            qb.andWhere("anime.score >= :minScore", { minScore: query.minScore });
        }
        if (query.maxScore !== undefined) {
            qb.andWhere("anime.score <= :maxScore", { maxScore: query.maxScore });
        }

        if (query.minRank !== undefined) {
            qb.andWhere("anime.rank >= :minRank", { minRank: query.minRank });
        }
        if (query.maxRank !== undefined) {
            qb.andWhere("anime.rank <= :maxRank", { maxRank: query.maxRank });
        }

        if (query.newerThanDays !== undefined) {
            qb.andWhere("anime.created_at >= NOW() - (:days::integer * INTERVAL '1 day')", {
                days: query.newerThanDays
            });
        }

        if (query.genre) {
            qb.andWhere(
                `anime.mal_id IN (
                    SELECT ag.anime_mal_id FROM anime_genres ag
                    INNER JOIN genres g ON ag.genre_mal_id = g.mal_id
                    WHERE LOWER(g.name) = LOWER(:genre) AND g.entity_type = 'anime'
                )`,
                { genre: query.genre }
            );
        }

        const sortColumn = query.sortBy ? (ALLOWED_SORT_FIELDS[query.sortBy] ?? "anime.mal_id") : "anime.mal_id";
        const sortOrder = query.sortOrder === "DESC" ? "DESC" : "ASC";
        qb.orderBy(sortColumn, sortOrder, "NULLS LAST");

        qb.skip((page - 1) * limit).take(limit);

        const [entities, total] = await qb.getManyAndCount();

        const ids = entities.map((e) => e.malId);
        const [genreMap, producerMap] = await Promise.all([this.loadGenreMap(ids), this.loadProducerMap(ids)]);

        return {
            data: entities.map((e) => toListDto(e, genreMap.get(e.malId) ?? [], producerMap.get(e.malId) ?? [])),
            total,
            page,
            limit
        };
    }

    async findById(id: number): Promise<AnimeV2Dto> {
        const entity = await this.animeRepo.findOne({ where: { malId: id } });
        if (!entity) {
            throw new NotFoundException(`Anime with id ${id} not found`);
        }

        const [genreMap, producerMap, relatedMap, characters, staff, themes, statistics, externalLinks, recommendations, episodeList] =
            await Promise.all([
                this.loadGenreMap([id]),
                this.loadProducerMap([id]),
                this.loadRelatedMap([id]),
                this.loadCharacters(id),
                this.loadStaff(id),
                this.loadThemes(id),
                this.loadStatistics(id),
                this.loadExternalLinks(id),
                this.loadRecommendations(id),
                this.loadEpisodes(id)
            ]);

        const dto = toListDto(entity, genreMap.get(id) ?? [], producerMap.get(id) ?? []);
        dto.relatedEntries = relatedMap.get(id) ?? [];
        dto.characters = characters;
        dto.staff = staff;
        dto.openingThemes = themes.filter((t) => t.type === "opening").map((t) => t.text);
        dto.endingThemes = themes.filter((t) => t.type === "ending").map((t) => t.text);
        dto.statistics = statistics ?? undefined;
        dto.externalLinks = externalLinks;
        dto.recommendations = recommendations;
        dto.episodeList = episodeList;
        return dto;
    }

    async findByIds(ids: number[]): Promise<AnimeV2Dto[]> {
        if (!ids.length) return [];
        const entities = await this.animeRepo.createQueryBuilder("anime").where("anime.mal_id IN (:...ids)", { ids }).getMany();
        const genreMap = await this.loadGenreMap(ids);
        const producerMap = await this.loadProducerMap(ids);
        return entities.map((e) => toListDto(e, genreMap.get(e.malId) ?? [], producerMap.get(e.malId) ?? []));
    }

    async getAllGenres(): Promise<string[]> {
        const rows: { name: string }[] = await this.animeRepo.query(
            "SELECT DISTINCT g.name FROM genres g INNER JOIN anime_genres ag ON ag.genre_mal_id = g.mal_id WHERE g.entity_type = 'anime' AND g.name IS NOT NULL ORDER BY g.name"
        );
        return rows.map((r) => r.name);
    }

    async getAllProducers(): Promise<AnimeProducerDto[]> {
        const rows: { mal_id: number; title: string }[] = await this.animeRepo.query(
            "SELECT DISTINCT p.mal_id, p.title FROM producers p INNER JOIN anime_producers ap ON ap.producer_mal_id = p.mal_id WHERE ap.role = 'studio' AND p.title IS NOT NULL ORDER BY p.title"
        );
        return rows.map((r) => ({ malId: r.mal_id, name: r.title }));
    }

    private async loadGenreMap(animeIds: number[]): Promise<Map<number, string[]>> {
        if (!animeIds.length) return new Map();
        const rows: { anime_mal_id: number; name: string }[] = await this.animeRepo.query(
            `SELECT ag.anime_mal_id, g.name
             FROM anime_genres ag
             INNER JOIN genres g ON ag.genre_mal_id = g.mal_id
             WHERE ag.anime_mal_id = ANY($1) AND g.entity_type = 'anime' AND g.name IS NOT NULL
             ORDER BY g.name`,
            [animeIds]
        );
        const map = new Map<number, string[]>();
        for (const row of rows) {
            const id = row.anime_mal_id;
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push(row.name);
        }
        return map;
    }

    private async loadProducerMap(animeIds: number[]): Promise<Map<number, AnimeProducerDto[]>> {
        if (!animeIds.length) return new Map();
        const rows: { anime_mal_id: number; mal_id: number; title: string; role: string }[] = await this.animeRepo.query(
            `SELECT ap.anime_mal_id, p.mal_id, p.title, ap.role
             FROM anime_producers ap
             INNER JOIN producers p ON ap.producer_mal_id = p.mal_id
             WHERE ap.anime_mal_id = ANY($1) AND p.title IS NOT NULL
             ORDER BY ap.role, p.title`,
            [animeIds]
        );
        const map = new Map<number, AnimeProducerDto[]>();
        for (const row of rows) {
            const id = row.anime_mal_id;
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push({ malId: row.mal_id, name: row.title, role: row.role });
        }
        return map;
    }

    private async loadRelatedMap(animeIds: number[]): Promise<Map<number, RelatedAnimeV2Dto[]>> {
        if (!animeIds.length) return new Map();
        const rows: {
            source_mal_id: number;
            target_mal_id: number;
            relation: string;
            target_type: string;
            target_name: string;
            picture: string | null;
        }[] = await this.animeRepo.query(
            `SELECT er.source_mal_id, er.target_mal_id, er.relation, er.target_type, er.target_name,
                    CASE WHEN er.target_type = 'anime'
                         THEN a.raw_json->'images'->'jpg'->>'image_url'
                         ELSE NULL
                    END AS picture
             FROM entity_relations er
             LEFT JOIN anime a ON er.target_type = 'anime' AND a.mal_id = er.target_mal_id
             WHERE er.source_type = 'anime' AND er.source_mal_id = ANY($1)
             ORDER BY er.relation, er.target_name`,
            [animeIds]
        );
        const map = new Map<number, RelatedAnimeV2Dto[]>();
        for (const row of rows) {
            const id = row.source_mal_id;
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push({
                malId: row.target_mal_id,
                relation: row.relation,
                type: row.target_type,
                name: row.target_name,
                picture: row.picture ?? undefined
            });
        }
        return map;
    }

    private async loadCharacters(animeId: number): Promise<AnimeCharacterDto[]> {
        const charRows: { character_mal_id: number; name: string; name_kanji: string; role: string; favorites: number; picture: string }[] =
            await this.animeRepo.query(
                `SELECT ac.character_mal_id, c.name, c.name_kanji, ac.role, c.favorites,
                        c.raw_json->'images'->'jpg'->>'image_url' AS picture
                 FROM anime_characters ac
                 INNER JOIN characters c ON ac.character_mal_id = c.mal_id
                 WHERE ac.anime_mal_id = $1
                 ORDER BY CASE WHEN ac.role = 'Main' THEN 0 ELSE 1 END, c.favorites DESC NULLS LAST`,
                [animeId]
            );

        const vaRows: { character_mal_id: number; person_mal_id: number; name: string; language: string }[] = await this.animeRepo.query(
            `SELECT va.character_mal_id, va.person_mal_id, p.name, va.language
             FROM anime_voice_actors va
             INNER JOIN people p ON va.person_mal_id = p.mal_id
             WHERE va.anime_mal_id = $1
             ORDER BY va.character_mal_id, va.language`,
            [animeId]
        );

        const vaMap = new Map<number, AnimeVoiceActorDto[]>();
        for (const va of vaRows) {
            if (!vaMap.has(va.character_mal_id)) vaMap.set(va.character_mal_id, []);
            vaMap.get(va.character_mal_id)!.push({ malId: va.person_mal_id, name: va.name, language: va.language });
        }

        return charRows.map((c) => ({
            malId: c.character_mal_id,
            name: c.name,
            nameKanji: c.name_kanji ?? undefined,
            role: c.role ?? undefined,
            favorites: c.favorites ?? undefined,
            picture: c.picture ?? undefined,
            voiceActors: vaMap.get(c.character_mal_id) ?? []
        }));
    }

    private async loadStaff(animeId: number): Promise<AnimeStaffMemberDto[]> {
        const rows: { person_mal_id: number; name: string; positions: string[] }[] = await this.animeRepo.query(
            `SELECT s.person_mal_id, p.name, s.positions
             FROM anime_staff s
             INNER JOIN people p ON s.person_mal_id = p.mal_id
             WHERE s.anime_mal_id = $1
             ORDER BY p.name`,
            [animeId]
        );
        return rows.map((r) => ({ malId: r.person_mal_id, name: r.name, positions: r.positions ?? [] }));
    }

    private async loadThemes(animeId: number): Promise<AnimeThemeDto[]> {
        const rows: { theme_type: "opening" | "ending"; position: number; text: string }[] = await this.animeRepo.query(
            `SELECT theme_type, position, text
             FROM anime_themes
             WHERE anime_mal_id = $1
             ORDER BY theme_type, position`,
            [animeId]
        );
        return rows.map((r) => ({ type: r.theme_type, position: r.position, text: r.text }));
    }

    private async loadStatistics(animeId: number): Promise<AnimeStatisticsDto | null> {
        const rows: {
            watching: number;
            completed: number;
            on_hold: number;
            dropped: number;
            plan_to: number;
            total: number;
            scores_json: AnimeScoreEntryDto[] | null;
        }[] = await this.animeRepo.query(
            `SELECT watching, completed, on_hold, dropped, plan_to, total, scores_json
             FROM entity_statistics
             WHERE entity_type = 'anime' AND entity_mal_id = $1`,
            [animeId]
        );
        if (!rows.length) return null;
        const r = rows[0];
        return {
            watching: r.watching ?? 0,
            completed: r.completed ?? 0,
            onHold: r.on_hold ?? 0,
            dropped: r.dropped ?? 0,
            planTo: r.plan_to ?? 0,
            total: r.total ?? 0,
            scores: Array.isArray(r.scores_json) ? r.scores_json : undefined
        };
    }

    private async loadExternalLinks(animeId: number): Promise<AnimeExternalLinkDto[]> {
        const rows: { name: string; url: string }[] = await this.animeRepo.query(
            `SELECT name, url FROM entity_external_links
             WHERE entity_type = 'anime' AND entity_mal_id = $1
             ORDER BY name`,
            [animeId]
        );
        return rows.map((r) => ({ name: r.name ?? undefined, url: r.url }));
    }

    private async loadRecommendations(animeId: number): Promise<AnimeRecommendationDto[]> {
        const rows: { recommended_mal_id: number; recommended_title: string; votes: number }[] = await this.animeRepo.query(
            `SELECT recommended_mal_id, recommended_title, votes
             FROM entity_recommendations
             WHERE source_type = 'anime' AND source_mal_id = $1
             ORDER BY votes DESC NULLS LAST`,
            [animeId]
        );
        return rows.map((r) => ({ malId: r.recommended_mal_id, title: r.recommended_title ?? undefined, votes: r.votes ?? 0 }));
    }

    async findAllCharacters(page: number, limit: number, query: CharacterQueryDto): Promise<PaginatedAnimeCharacterListDto> {
        let countSql = `SELECT COUNT(*) AS total FROM characters c WHERE c.name IS NOT NULL`;
        let dataSql = `SELECT c.mal_id, c.name, c.name_kanji, c.favorites,
                              c.raw_json->'images'->'jpg'->>'image_url' AS picture,
                              (SELECT COUNT(*) FROM anime_characters ac WHERE ac.character_mal_id = c.mal_id) AS anime_appearances
                       FROM characters c
                       WHERE c.name IS NOT NULL`;
        const params: unknown[] = [];
        let paramIndex = 1;

        if (query.search) {
            const clause = ` AND (LOWER(c.name) LIKE $${paramIndex} OR LOWER(c.name_kanji) LIKE $${paramIndex})`;
            countSql += clause;
            dataSql += clause;
            params.push(`%${query.search.toLowerCase()}%`);
            paramIndex++;
        }

        const sortColumn = query.sortBy
            ? (ALLOWED_CHARACTER_SORT_FIELDS[query.sortBy] ?? "c.favorites")
            : "c.favorites";
        const sortOrder = query.sortOrder === "ASC" ? "ASC" : "DESC";
        dataSql += ` ORDER BY ${sortColumn} ${sortOrder} NULLS LAST`;
        dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, (page - 1) * limit);

        const [countResult, rows] = await Promise.all([
            this.animeRepo.query(countSql, params.slice(0, paramIndex - 1)),
            this.animeRepo.query(dataSql, params)
        ]);

        const total = parseInt(countResult[0]?.total ?? "0", 10);
        const data: AnimeCharacterListDto[] = rows.map(
            (r: { mal_id: number; name: string; name_kanji: string; favorites: number; picture: string; anime_appearances: string }) => ({
                malId: r.mal_id,
                name: r.name ?? undefined,
                nameKanji: r.name_kanji ?? undefined,
                favorites: r.favorites ?? undefined,
                picture: r.picture ?? undefined,
                animeAppearances: parseInt(r.anime_appearances, 10)
            })
        );

        return { data, total, page, limit };
    }

    async findCharacterById(id: number): Promise<AnimeCharacterDetailDto> {
        const rows: {
            mal_id: number;
            url: string;
            name: string;
            name_kanji: string;
            nicknames: string[];
            favorites: number;
            about: string;
            picture: string;
            created_at: Date;
            updated_at: Date;
        }[] = await this.animeRepo.query(
            `SELECT mal_id, url, name, name_kanji, nicknames, favorites, about,
                    raw_json->'images'->'jpg'->>'image_url' AS picture,
                    created_at, updated_at
             FROM characters WHERE mal_id = $1`,
            [id]
        );
        if (!rows.length) {
            throw new NotFoundException(`Character with id ${id} not found`);
        }
        const c = rows[0];

        const [animeRows, mangaRows, vaRows]: [
            { anime_mal_id: number; title: string; role: string; picture: string }[],
            { manga_mal_id: number; title: string; role: string; picture: string }[],
            { person_mal_id: number; name: string; language: string; anime_mal_id: number; anime_title: string }[]
        ] = await Promise.all([
            this.animeRepo.query(
                `SELECT ac.anime_mal_id, a.title, ac.role,
                        a.raw_json->'images'->'jpg'->>'image_url' AS picture
                 FROM anime_characters ac
                 INNER JOIN anime a ON ac.anime_mal_id = a.mal_id
                 WHERE ac.character_mal_id = $1
                 ORDER BY a.popularity ASC NULLS LAST`,
                [id]
            ),
            this.animeRepo.query(
                `SELECT mc.manga_mal_id, m.title, mc.role,
                        m.raw_json->'images'->'jpg'->>'image_url' AS picture
                 FROM manga_characters mc
                 INNER JOIN manga m ON mc.manga_mal_id = m.mal_id
                 WHERE mc.character_mal_id = $1
                 ORDER BY m.popularity ASC NULLS LAST`,
                [id]
            ),
            this.animeRepo.query(
                `SELECT DISTINCT va.person_mal_id, p.name, va.language, va.anime_mal_id, a.title AS anime_title
                 FROM anime_voice_actors va
                 INNER JOIN people p ON va.person_mal_id = p.mal_id
                 INNER JOIN anime a ON va.anime_mal_id = a.mal_id
                 WHERE va.character_mal_id = $1
                 ORDER BY va.language, p.name`,
                [id]
            )
        ]);

        const animeography: AnimeCharacterAnimeDto[] = animeRows.map((r) => ({
            malId: r.anime_mal_id,
            title: r.title ?? undefined,
            picture: r.picture ?? undefined,
            role: r.role ?? undefined
        }));

        const mangaography: AnimeCharacterMangaDto[] = mangaRows.map((r) => ({
            malId: r.manga_mal_id,
            title: r.title ?? undefined,
            picture: r.picture ?? undefined,
            role: r.role ?? undefined
        }));

        const voiceActors: CharacterVoiceActorDto[] = vaRows.map((r) => ({
            malId: r.person_mal_id,
            name: r.name ?? undefined,
            language: r.language,
            animeMalId: r.anime_mal_id,
            animeTitle: r.anime_title ?? undefined
        }));

        return {
            malId: c.mal_id,
            url: c.url ?? undefined,
            name: c.name ?? undefined,
            nameKanji: c.name_kanji ?? undefined,
            nicknames: Array.isArray(c.nicknames) && c.nicknames.length > 0 ? c.nicknames : undefined,
            favorites: c.favorites ?? undefined,
            about: c.about ?? undefined,
            picture: c.picture ?? undefined,
            animeography,
            mangaography,
            voiceActors,
            createdAt: c.created_at ?? undefined,
            updatedAt: c.updated_at ?? undefined
        };
    }

    async findAllPeople(page: number, limit: number, query: PersonQueryDto): Promise<PaginatedPersonListDto> {
        let countSql = `SELECT COUNT(*) AS total FROM people p WHERE p.name IS NOT NULL`;
        let dataSql = `SELECT p.mal_id, p.name, p.given_name, p.family_name, p.favorites, p.birthday,
                              p.raw_json->'images'->'jpg'->>'image_url' AS picture
                       FROM people p
                       WHERE p.name IS NOT NULL`;
        const params: unknown[] = [];
        let paramIndex = 1;

        if (query.search) {
            const clause = ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.given_name) LIKE $${paramIndex} OR LOWER(p.family_name) LIKE $${paramIndex})`;
            countSql += clause;
            dataSql += clause;
            params.push(`%${query.search.toLowerCase()}%`);
            paramIndex++;
        }

        const sortColumn = query.sortBy
            ? (ALLOWED_PERSON_SORT_FIELDS[query.sortBy] ?? "p.favorites")
            : "p.favorites";
        const sortOrder = query.sortOrder === "ASC" ? "ASC" : "DESC";
        dataSql += ` ORDER BY ${sortColumn} ${sortOrder} NULLS LAST`;
        dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, (page - 1) * limit);

        const [countResult, rows] = await Promise.all([
            this.animeRepo.query(countSql, params.slice(0, paramIndex - 1)),
            this.animeRepo.query(dataSql, params)
        ]);

        const total = parseInt(countResult[0]?.total ?? "0", 10);
        const data: PersonListDto[] = rows.map(
            (r: { mal_id: number; name: string; given_name: string; family_name: string; favorites: number; birthday: string; picture: string }) => ({
                malId: r.mal_id,
                name: r.name ?? undefined,
                givenName: r.given_name ?? undefined,
                familyName: r.family_name ?? undefined,
                favorites: r.favorites ?? undefined,
                birthday: r.birthday ?? undefined,
                picture: r.picture ?? undefined
            })
        );

        return { data, total, page, limit };
    }

    async findPersonById(id: number): Promise<PersonDetailDto> {
        const rows: {
            mal_id: number;
            url: string;
            name: string;
            given_name: string;
            family_name: string;
            favorites: number;
            birthday: string;
            about: string;
            picture: string;
            alternate_names: string[];
            created_at: Date;
            updated_at: Date;
        }[] = await this.animeRepo.query(
            `SELECT mal_id, url, name, given_name, family_name, favorites, birthday, about,
                    raw_json->'images'->'jpg'->>'image_url' AS picture,
                    COALESCE(raw_json->'alternate_names', '[]'::jsonb) AS alternate_names,
                    created_at, updated_at
             FROM people WHERE mal_id = $1`,
            [id]
        );
        if (!rows.length) {
            throw new NotFoundException(`Person with id ${id} not found`);
        }
        const p = rows[0];

        const [staffRows, vaRows]: [
            { anime_mal_id: number; title: string; picture: string; positions: string[] }[],
            { anime_mal_id: number; anime_title: string; anime_picture: string; character_mal_id: number; character_name: string; character_picture: string; language: string }[]
        ] = await Promise.all([
            this.animeRepo.query(
                `SELECT s.anime_mal_id, a.title,
                        a.raw_json->'images'->'jpg'->>'image_url' AS picture,
                        s.positions
                 FROM anime_staff s
                 INNER JOIN anime a ON s.anime_mal_id = a.mal_id
                 WHERE s.person_mal_id = $1
                 ORDER BY a.popularity ASC NULLS LAST`,
                [id]
            ),
            this.animeRepo.query(
                `SELECT va.anime_mal_id, a.title AS anime_title,
                        a.raw_json->'images'->'jpg'->>'image_url' AS anime_picture,
                        va.character_mal_id, c.name AS character_name,
                        c.raw_json->'images'->'jpg'->>'image_url' AS character_picture,
                        va.language
                 FROM anime_voice_actors va
                 INNER JOIN anime a ON va.anime_mal_id = a.mal_id
                 INNER JOIN characters c ON va.character_mal_id = c.mal_id
                 WHERE va.person_mal_id = $1
                 ORDER BY a.popularity ASC NULLS LAST`,
                [id]
            )
        ]);

        const staffRoles: PersonStaffRoleDto[] = staffRows.map((r) => ({
            animeMalId: r.anime_mal_id,
            animeTitle: r.title ?? undefined,
            animePicture: r.picture ?? undefined,
            positions: r.positions ?? []
        }));

        const voiceActingRoles: PersonVoiceActingRoleDto[] = vaRows.map((r) => ({
            animeMalId: r.anime_mal_id,
            animeTitle: r.anime_title ?? undefined,
            animePicture: r.anime_picture ?? undefined,
            characterMalId: r.character_mal_id,
            characterName: r.character_name ?? undefined,
            characterPicture: r.character_picture ?? undefined,
            language: r.language
        }));

        const altNames = Array.isArray(p.alternate_names) ? p.alternate_names.filter((n: string) => !!n) : [];

        return {
            malId: p.mal_id,
            url: p.url ?? undefined,
            name: p.name ?? undefined,
            givenName: p.given_name ?? undefined,
            familyName: p.family_name ?? undefined,
            alternateNames: altNames.length > 0 ? altNames : undefined,
            picture: p.picture ?? undefined,
            favorites: p.favorites ?? undefined,
            birthday: p.birthday ?? undefined,
            about: p.about ?? undefined,
            staffRoles,
            voiceActingRoles,
            createdAt: p.created_at ?? undefined,
            updatedAt: p.updated_at ?? undefined
        };
    }

    private async loadEpisodes(animeId: number): Promise<AnimeEpisodeDto[]> {
        const rows: {
            episode_mal_id: number;
            title: string;
            title_japanese: string;
            title_romanji: string;
            aired: string;
            filler: boolean;
            recap: boolean;
        }[] = await this.animeRepo.query(
            `SELECT episode_mal_id, title, title_japanese, title_romanji, aired, filler, recap
             FROM anime_episodes
             WHERE anime_mal_id = $1
             ORDER BY episode_mal_id`,
            [animeId]
        );
        return rows.map((r) => ({
            episodeId: r.episode_mal_id,
            title: r.title ?? undefined,
            titleJapanese: r.title_japanese ?? undefined,
            titleRomanji: r.title_romanji ?? undefined,
            aired: r.aired ?? undefined,
            filler: r.filler ?? undefined,
            recap: r.recap ?? undefined
        }));
    }
}
