import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ANIMEDB_V2_CONNECTION } from "../anime/anime-v2.service";
import { MangaQueryDto, MangaSortField } from "./dto/manga-query.dto";
import { MangaEntity } from "./entities/manga.entity";
import {
    MangaAuthorDto,
    MangaCharacterDto,
    MangaDto,
    MangaExternalLinkDto,
    MangaImageSetDto,
    MangaImagesDto,
    MangaPublishedDto,
    MangaRecommendationDto,
    MangaScoreEntryDto,
    MangaStatisticsDto,
    PaginatedMangaDto,
    RelatedMangaDto
} from "./models/manga.model";

const ALLOWED_SORT_FIELDS: Record<MangaSortField, string> = {
    id: "manga.mal_id",
    title: "manga.title",
    score: "manga.score",
    rank: "manga.rank",
    popularity: "manga.popularity",
    chapters: "manga.chapters",
    volumes: "manga.volumes",
    members: "manga.members",
    favorites: "manga.favorites",
    createdAt: "manga.created_at"
};

function extractImages(raw: Record<string, unknown>): MangaImagesDto | undefined {
    const images = raw["images"] as Record<string, Record<string, string>> | undefined;
    if (!images) return undefined;

    const mapSet = (s: Record<string, string> | undefined): MangaImageSetDto | undefined =>
        s
            ? {
                  imageUrl: s["image_url"],
                  smallImageUrl: s["small_image_url"],
                  largeImageUrl: s["large_image_url"]
              }
            : undefined;

    return { jpg: mapSet(images["jpg"]), webp: mapSet(images["webp"]) };
}

function extractPublished(raw: Record<string, unknown>): MangaPublishedDto | undefined {
    const p = raw["published"] as Record<string, unknown> | undefined;
    if (!p) return undefined;
    return {
        from: p["from"] as string | undefined,
        to: p["to"] as string | undefined,
        string: p["string"] as string | undefined
    };
}

function extractStringArray(raw: Record<string, unknown>, key: string): string[] {
    const arr = raw[key] as Array<{ name?: string }> | undefined;
    if (!Array.isArray(arr)) return [];
    return arr.map((g) => g.name).filter((n): n is string => !!n);
}

function extractAuthors(raw: Record<string, unknown>): MangaAuthorDto[] {
    const authors = raw["authors"] as Array<{ mal_id?: number; name?: string; type?: string }> | undefined;
    if (!Array.isArray(authors)) return [];
    return authors
        .filter((a) => a.mal_id != null && a.name != null)
        .map((a) => ({
            malId: a.mal_id!,
            name: a.name!,
            role: a.type ?? undefined
        }));
}

function extractSerializations(raw: Record<string, unknown>): string[] {
    const serializations = raw["serializations"] as Array<{ name?: string }> | undefined;
    if (!Array.isArray(serializations)) return [];
    return serializations.map((s) => s.name).filter((n): n is string => !!n);
}

function toListDto(entity: MangaEntity, genres: string[] = [], authors?: MangaAuthorDto[]): MangaDto {
    const raw = entity.rawJson ?? {};

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
        chapters: entity.chapters ?? undefined,
        volumes: entity.volumes ?? undefined,
        status: entity.status,
        publishing: entity.publishing,
        score: entity.score != null ? Number(entity.score) : undefined,
        scoredBy: entity.scoredBy ?? undefined,
        rank: entity.rank ?? undefined,
        popularity: entity.popularity ?? undefined,
        members: entity.members ?? undefined,
        favorites: entity.favorites ?? undefined,
        published: extractPublished(raw),
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        genres,
        themes: extractStringArray(raw, "themes"),
        demographics: extractStringArray(raw, "demographics"),
        authors: authors ?? extractAuthors(raw),
        serializations: extractSerializations(raw)
    };
}

@Injectable()
export class MangaService {
    constructor(
        @InjectRepository(MangaEntity, ANIMEDB_V2_CONNECTION)
        private readonly mangaRepo: Repository<MangaEntity>
    ) {}

    async findAll(page: number, limit: number, query: MangaQueryDto): Promise<PaginatedMangaDto> {
        const qb = this.mangaRepo.createQueryBuilder("manga");

        if (query.search) {
            const search = `%${query.search.toLowerCase()}%`;
            qb.andWhere(
                "(LOWER(manga.title) LIKE :search OR LOWER(manga.title_english) LIKE :search OR LOWER(manga.title_japanese) LIKE :search)",
                { search }
            );
        }

        if (query.type) {
            qb.andWhere("LOWER(manga.type) = LOWER(:type)", { type: query.type });
        }
        if (query.status) {
            qb.andWhere("LOWER(manga.status) = LOWER(:status)", { status: query.status });
        }

        if (query.minChapters !== undefined) {
            qb.andWhere("manga.chapters >= :minChapters", { minChapters: query.minChapters });
        }
        if (query.maxChapters !== undefined) {
            qb.andWhere("manga.chapters <= :maxChapters", { maxChapters: query.maxChapters });
        }

        if (query.minVolumes !== undefined) {
            qb.andWhere("manga.volumes >= :minVolumes", { minVolumes: query.minVolumes });
        }
        if (query.maxVolumes !== undefined) {
            qb.andWhere("manga.volumes <= :maxVolumes", { maxVolumes: query.maxVolumes });
        }

        if (query.minScore !== undefined) {
            qb.andWhere("manga.score >= :minScore", { minScore: query.minScore });
        }
        if (query.maxScore !== undefined) {
            qb.andWhere("manga.score <= :maxScore", { maxScore: query.maxScore });
        }

        if (query.minRank !== undefined) {
            qb.andWhere("manga.rank >= :minRank", { minRank: query.minRank });
        }
        if (query.maxRank !== undefined) {
            qb.andWhere("manga.rank <= :maxRank", { maxRank: query.maxRank });
        }

        if (query.newerThanDays !== undefined) {
            qb.andWhere("manga.created_at >= NOW() - (:days::integer * INTERVAL '1 day')", {
                days: query.newerThanDays
            });
        }

        if (query.genre) {
            qb.andWhere(
                `manga.mal_id IN (
                    SELECT mg.manga_mal_id FROM manga_genres mg
                    INNER JOIN genres g ON mg.genre_mal_id = g.mal_id
                    WHERE LOWER(g.name) = LOWER(:genre) AND g.entity_type = 'manga'
                )`,
                { genre: query.genre }
            );
        }

        const sortColumn = query.sortBy ? (ALLOWED_SORT_FIELDS[query.sortBy] ?? "manga.mal_id") : "manga.mal_id";
        const sortOrder = query.sortOrder === "DESC" ? "DESC" : "ASC";
        qb.orderBy(sortColumn, sortOrder, "NULLS LAST");

        qb.skip((page - 1) * limit).take(limit);

        const [entities, total] = await qb.getManyAndCount();

        const ids = entities.map((e) => e.malId);
        const genreMap = await this.loadGenreMap(ids);

        return {
            data: entities.map((e) => toListDto(e, genreMap.get(e.malId) ?? [])),
            total,
            page,
            limit
        };
    }

    async findById(id: number): Promise<MangaDto> {
        const entity = await this.mangaRepo.findOne({ where: { malId: id } });
        if (!entity) {
            throw new NotFoundException(`Manga with id ${id} not found`);
        }

        const [genreMap, relatedMap, characters, statistics, externalLinks, recommendations] = await Promise.all([
            this.loadGenreMap([id]),
            this.loadRelatedMap([id]),
            this.loadCharacters(id),
            this.loadStatistics(id),
            this.loadExternalLinks(id),
            this.loadRecommendations(id)
        ]);

        const dto = toListDto(entity, genreMap.get(id) ?? []);
        dto.relatedEntries = relatedMap.get(id) ?? [];
        dto.characters = characters;
        dto.statistics = statistics ?? undefined;
        dto.externalLinks = externalLinks;
        dto.recommendations = recommendations;
        return dto;
    }

    async findByIds(ids: number[]): Promise<MangaDto[]> {
        if (!ids.length) return [];
        const entities = await this.mangaRepo.createQueryBuilder("manga").where("manga.mal_id IN (:...ids)", { ids }).getMany();
        const genreMap = await this.loadGenreMap(ids);
        return entities.map((e) => toListDto(e, genreMap.get(e.malId) ?? []));
    }

    async getAllGenres(): Promise<string[]> {
        const rows: { name: string }[] = await this.mangaRepo.query(
            "SELECT DISTINCT g.name FROM genres g INNER JOIN manga_genres mg ON mg.genre_mal_id = g.mal_id WHERE g.entity_type = 'manga' AND g.name IS NOT NULL ORDER BY g.name"
        );
        return rows.map((r) => r.name);
    }

    private async loadGenreMap(mangaIds: number[]): Promise<Map<number, string[]>> {
        if (!mangaIds.length) return new Map();
        const rows: { manga_mal_id: number; name: string }[] = await this.mangaRepo.query(
            `SELECT mg.manga_mal_id, g.name
             FROM manga_genres mg
             INNER JOIN genres g ON mg.genre_mal_id = g.mal_id
             WHERE mg.manga_mal_id = ANY($1) AND g.entity_type = 'manga' AND g.name IS NOT NULL
             ORDER BY g.name`,
            [mangaIds]
        );
        const map = new Map<number, string[]>();
        for (const row of rows) {
            const id = row.manga_mal_id;
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push(row.name);
        }
        return map;
    }

    private async loadRelatedMap(mangaIds: number[]): Promise<Map<number, RelatedMangaDto[]>> {
        if (!mangaIds.length) return new Map();
        const rows: {
            source_mal_id: number;
            target_mal_id: number;
            relation: string;
            target_type: string;
            target_name: string;
            picture: string | null;
        }[] = await this.mangaRepo.query(
            `SELECT er.source_mal_id, er.target_mal_id, er.relation, er.target_type, er.target_name,
                    CASE WHEN er.target_type = 'manga'
                         THEN m.raw_json->'images'->'jpg'->>'image_url'
                         ELSE NULL
                    END AS picture
             FROM entity_relations er
             LEFT JOIN manga m ON er.target_type = 'manga' AND m.mal_id = er.target_mal_id
             WHERE er.source_type = 'manga' AND er.source_mal_id = ANY($1)
             ORDER BY er.relation, er.target_name`,
            [mangaIds]
        );
        const map = new Map<number, RelatedMangaDto[]>();
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

    private async loadCharacters(mangaId: number): Promise<MangaCharacterDto[]> {
        const rows: { character_mal_id: number; name: string; name_kanji: string; role: string; favorites: number }[] =
            await this.mangaRepo.query(
                `SELECT mc.character_mal_id, c.name, c.name_kanji, mc.role, c.favorites
                 FROM manga_characters mc
                 INNER JOIN characters c ON mc.character_mal_id = c.mal_id
                 WHERE mc.manga_mal_id = $1
                 ORDER BY CASE WHEN mc.role = 'Main' THEN 0 ELSE 1 END, c.favorites DESC NULLS LAST`,
                [mangaId]
            );

        return rows.map((c) => ({
            malId: c.character_mal_id,
            name: c.name,
            nameKanji: c.name_kanji ?? undefined,
            role: c.role ?? undefined,
            favorites: c.favorites ?? undefined
        }));
    }

    private async loadStatistics(mangaId: number): Promise<MangaStatisticsDto | null> {
        const rows: {
            reading: number;
            completed: number;
            on_hold: number;
            dropped: number;
            plan_to: number;
            total: number;
            scores_json: MangaScoreEntryDto[] | null;
        }[] = await this.mangaRepo.query(
            `SELECT watching AS reading, completed, on_hold, dropped, plan_to, total, scores_json
             FROM entity_statistics
             WHERE entity_type = 'manga' AND entity_mal_id = $1`,
            [mangaId]
        );
        if (!rows.length) return null;
        const r = rows[0];
        return {
            reading: r.reading ?? 0,
            completed: r.completed ?? 0,
            onHold: r.on_hold ?? 0,
            dropped: r.dropped ?? 0,
            planTo: r.plan_to ?? 0,
            total: r.total ?? 0,
            scores: Array.isArray(r.scores_json) ? r.scores_json : undefined
        };
    }

    private async loadExternalLinks(mangaId: number): Promise<MangaExternalLinkDto[]> {
        const rows: { name: string; url: string }[] = await this.mangaRepo.query(
            `SELECT name, url FROM entity_external_links
             WHERE entity_type = 'manga' AND entity_mal_id = $1
             ORDER BY name`,
            [mangaId]
        );
        return rows.map((r) => ({ name: r.name ?? undefined, url: r.url }));
    }

    private async loadRecommendations(mangaId: number): Promise<MangaRecommendationDto[]> {
        const rows: { recommended_mal_id: number; recommended_title: string; votes: number }[] = await this.mangaRepo.query(
            `SELECT recommended_mal_id, recommended_title, votes
             FROM entity_recommendations
             WHERE source_type = 'manga' AND source_mal_id = $1
             ORDER BY votes DESC NULLS LAST`,
            [mangaId]
        );
        return rows.map((r) => ({ malId: r.recommended_mal_id, title: r.recommended_title ?? undefined, votes: r.votes ?? 0 }));
    }
}
