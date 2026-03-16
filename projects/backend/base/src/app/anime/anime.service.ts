import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { AnimeQueryDto, AnimeSortField } from "./dto/anime-query.dto";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { UpdateAnimeDto } from "./dto/update-anime.dto";
import { AnimeEntity } from "./entities/anime.entity";
import { AnimeDto, AnimeStudioDto, PaginatedAnimeDto, RelatedAnimeDto } from "./models/anime.model";

const ANIME_DB_CONNECTION = "anime-db";

const ALLOWED_SORT_FIELDS: Record<AnimeSortField, string> = {
    id: "anime.id",
    title: "anime.title",
    mean: "anime.mean",
    rank: "anime.rank",
    popularity: "anime.popularity",
    episode: "anime.episode",
    seasonYear: "anime.season_year",
    startYear: "anime.start_year",
    member: "anime.member",
    voter: "anime.voter",
    createdAt: "anime.created_at"
};

function toDto(
    entity: AnimeEntity,
    genres: string[] = [],
    studios: AnimeStudioDto[] = [],
    relatedAnime: RelatedAnimeDto[] = []
): AnimeDto {
    return {
        id: Number(entity.id),
        title: entity.title,
        titleEnglish: entity.titleEnglish,
        titleJapanese: entity.titleJapanese,
        titleSynonym: entity.titleSynonym,
        picture: entity.picture,
        synopsis: entity.synopsis,
        type: entity.type,
        status: entity.status,
        nsfw: entity.nsfw,
        episode: entity.episode !== undefined ? Number(entity.episode) : undefined,
        episodeDuration: entity.episodeDuration !== undefined ? Number(entity.episodeDuration) : undefined,
        season: entity.season,
        seasonYear: entity.seasonYear !== undefined ? Number(entity.seasonYear) : undefined,
        broadcastDay: entity.broadcastDay,
        broadcastTime: entity.broadcastTime,
        source: entity.source,
        rating: entity.rating,
        mean: entity.mean !== undefined ? Number(entity.mean) : undefined,
        rank: entity.rank !== undefined ? Number(entity.rank) : undefined,
        popularity: entity.popularity !== undefined ? Number(entity.popularity) : undefined,
        member: entity.member !== undefined ? Number(entity.member) : undefined,
        voter: entity.voter !== undefined ? Number(entity.voter) : undefined,
        startYear: entity.startYear !== undefined ? Number(entity.startYear) : undefined,
        startMonth: entity.startMonth !== undefined ? Number(entity.startMonth) : undefined,
        startDay: entity.startDay !== undefined ? Number(entity.startDay) : undefined,
        endYear: entity.endYear !== undefined ? Number(entity.endYear) : undefined,
        endMonth: entity.endMonth !== undefined ? Number(entity.endMonth) : undefined,
        endDay: entity.endDay !== undefined ? Number(entity.endDay) : undefined,
        userWatching: entity.userWatching !== undefined ? Number(entity.userWatching) : undefined,
        userCompleted: entity.userCompleted !== undefined ? Number(entity.userCompleted) : undefined,
        userOnHold: entity.userOnHold !== undefined ? Number(entity.userOnHold) : undefined,
        userDropped: entity.userDropped !== undefined ? Number(entity.userDropped) : undefined,
        userPlanned: entity.userPlanned !== undefined ? Number(entity.userPlanned) : undefined,
        createdAt: entity.createdAt,
        genres,
        studios,
        relatedAnime
    };
}

@Injectable()
export class AnimeService {
    constructor(
        @InjectRepository(AnimeEntity, ANIME_DB_CONNECTION)
        private readonly animeRepo: Repository<AnimeEntity>
    ) {}

    async findById(id: number): Promise<AnimeDto> {
        const entity = await this.animeRepo.findOne({
            where: { id, deletedAt: IsNull() }
        });
        if (!entity) {
            throw new NotFoundException(`Anime with id ${id} not found`);
        }
        const [genreMap, studioMap, relatedMap] = await Promise.all([
            this.loadGenreMap([id]),
            this.loadStudioMap([id]),
            this.loadRelatedMap([id])
        ]);
        return toDto(entity, genreMap.get(id) ?? [], studioMap.get(id) ?? [], relatedMap.get(id) ?? []);
    }

    async findAll(page: number, limit: number, query: AnimeQueryDto): Promise<PaginatedAnimeDto> {
        const qb = this.animeRepo.createQueryBuilder("anime").where("anime.deleted_at IS NULL");

        // Title search (case-insensitive across all title columns)
        if (query.search) {
            const search = `%${query.search.toLowerCase()}%`;
            qb.andWhere(
                "(LOWER(anime.title) LIKE :search OR LOWER(anime.title_english) LIKE :search OR LOWER(anime.title_japanese) LIKE :search OR LOWER(anime.title_synonym) LIKE :search)",
                { search }
            );
        }

        // Exact filters
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
        if (query.nsfw !== undefined) {
            qb.andWhere("anime.nsfw = :nsfw", { nsfw: query.nsfw === "true" });
        }

        // Year filters
        if (query.seasonYear !== undefined) {
            qb.andWhere("anime.season_year = :seasonYear", { seasonYear: query.seasonYear });
        }
        if (query.startYear !== undefined) {
            qb.andWhere("anime.start_year >= :startYear", { startYear: query.startYear });
        }
        if (query.endYear !== undefined) {
            qb.andWhere("anime.end_year <= :endYear", { endYear: query.endYear });
        }

        // Episode range
        if (query.minEpisodes !== undefined) {
            qb.andWhere("anime.episode >= :minEpisodes", { minEpisodes: query.minEpisodes });
        }
        if (query.maxEpisodes !== undefined) {
            qb.andWhere("anime.episode <= :maxEpisodes", { maxEpisodes: query.maxEpisodes });
        }

        // Score (mean) range
        if (query.minScore !== undefined) {
            qb.andWhere("anime.mean >= :minScore", { minScore: query.minScore });
        }
        if (query.maxScore !== undefined) {
            qb.andWhere("anime.mean <= :maxScore", { maxScore: query.maxScore });
        }

        // Rank range
        if (query.minRank !== undefined) {
            qb.andWhere("anime.rank >= :minRank", { minRank: query.minRank });
        }
        if (query.maxRank !== undefined) {
            qb.andWhere("anime.rank <= :maxRank", { maxRank: query.maxRank });
        }

        // Newly added filter
        if (query.newerThanDays !== undefined) {
            qb.andWhere("anime.created_at >= NOW() - (:days::integer * INTERVAL '1 day')", {
                days: query.newerThanDays
            });
        }

        // Genre filter
        if (query.genre) {
            qb.andWhere(
                `anime.id IN (
                    SELECT ag.anime_id FROM anime_genre ag
                    INNER JOIN genre g ON ag.genre_id = g.id
                    WHERE LOWER(g.name) = LOWER(:genre) AND g.deleted_at IS NULL
                )`,
                { genre: query.genre }
            );
        }

        // Sorting
        const sortColumn = query.sortBy ? (ALLOWED_SORT_FIELDS[query.sortBy] ?? "anime.id") : "anime.id";
        const sortOrder = query.sortOrder === "DESC" ? "DESC" : "ASC";
        qb.orderBy(sortColumn, sortOrder);

        // Pagination
        qb.skip((page - 1) * limit).take(limit);

        const [entities, total] = await qb.getManyAndCount();

        const ids = entities.map((e) => Number(e.id));
        const genreMap = await this.loadGenreMap(ids);

        return {
            data: entities.map((e) => toDto(e, genreMap.get(Number(e.id)) ?? [])),
            total,
            page,
            limit
        };
    }

    async create(dto: CreateAnimeDto): Promise<AnimeDto> {
        const now = new Date();
        const entity = this.animeRepo.create({
            ...dto,
            createdAt: now,
            updatedAt: now
        });
        const saved = await this.animeRepo.save(entity);
        return toDto(saved);
    }

    async update(id: number, dto: UpdateAnimeDto): Promise<AnimeDto> {
        const entity = await this.animeRepo.findOne({
            where: { id, deletedAt: IsNull() }
        });
        if (!entity) {
            throw new NotFoundException(`Anime with id ${id} not found`);
        }
        Object.assign(entity, dto, { updatedAt: new Date() });
        const saved = await this.animeRepo.save(entity);
        return toDto(saved);
    }

    async remove(id: number): Promise<void> {
        const entity = await this.animeRepo.findOne({
            where: { id, deletedAt: IsNull() }
        });
        if (!entity) {
            throw new NotFoundException(`Anime with id ${id} not found`);
        }
        entity.deletedAt = new Date();
        await this.animeRepo.save(entity);
    }

    async findByIds(ids: number[]): Promise<AnimeDto[]> {
        if (!ids.length) return [];
        const entities = await this.animeRepo
            .createQueryBuilder("anime")
            .where("anime.id IN (:...ids)", { ids })
            .andWhere("anime.deleted_at IS NULL")
            .getMany();
        const genreMap = await this.loadGenreMap(ids);
        return entities.map((e) => toDto(e, genreMap.get(Number(e.id)) ?? []));
    }

    async getAllGenres(): Promise<string[]> {
        const rows: { name: string }[] = await this.animeRepo.query(
            "SELECT DISTINCT name FROM genre WHERE deleted_at IS NULL AND name IS NOT NULL ORDER BY name"
        );
        return rows.map((r) => r.name);
    }

    private async loadStudioMap(animeIds: number[]): Promise<Map<number, AnimeStudioDto[]>> {
        if (!animeIds.length) return new Map();
        const rows: { anime_id: string; id: string; name: string }[] = await this.animeRepo.query(
            `SELECT as2.anime_id::bigint, s.id::bigint, s.name
             FROM anime_studio as2
             INNER JOIN studio s ON as2.studio_id = s.id
             WHERE as2.anime_id = ANY($1) AND s.deleted_at IS NULL
             ORDER BY s.name`,
            [animeIds]
        );
        const map = new Map<number, AnimeStudioDto[]>();
        for (const row of rows) {
            const id = Number(row.anime_id);
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push({ id: Number(row.id), name: row.name });
        }
        return map;
    }

    private async loadRelatedMap(animeIds: number[]): Promise<Map<number, RelatedAnimeDto[]>> {
        if (!animeIds.length) return new Map();
        const rows: {
            anime_id1: string;
            anime_id2: string;
            relation: string;
            title: string;
            title_english: string;
            picture: string;
        }[] = await this.animeRepo.query(
            `SELECT ar.anime_id1::bigint, ar.anime_id2::bigint, ar.relation,
                    a.title, a.title_english, a.picture
             FROM anime_related ar
             INNER JOIN anime a ON ar.anime_id2 = a.id
             WHERE ar.anime_id1 = ANY($1) AND a.deleted_at IS NULL
             ORDER BY ar.relation, a.title`,
            [animeIds]
        );
        const map = new Map<number, RelatedAnimeDto[]>();
        for (const row of rows) {
            const id = Number(row.anime_id1);
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push({
                animeId: Number(row.anime_id2),
                relation: row.relation,
                title: row.title,
                titleEnglish: row.title_english,
                picture: row.picture
            });
        }
        return map;
    }

    private async loadGenreMap(animeIds: number[]): Promise<Map<number, string[]>> {
        if (!animeIds.length) return new Map();
        const rows: { anime_id: string; name: string }[] = await this.animeRepo.query(
            `SELECT ag.anime_id::bigint, g.name
             FROM anime_genre ag
             INNER JOIN genre g ON ag.genre_id = g.id
             WHERE ag.anime_id = ANY($1) AND g.deleted_at IS NULL
             ORDER BY g.name`,
            [animeIds]
        );
        const map = new Map<number, string[]>();
        for (const row of rows) {
            const id = Number(row.anime_id);
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push(row.name);
        }
        return map;
    }
}
