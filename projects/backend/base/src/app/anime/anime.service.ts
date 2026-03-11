import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { AnimeQueryDto, AnimeSortField } from "./dto/anime-query.dto";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { UpdateAnimeDto } from "./dto/update-anime.dto";
import { AnimeEntity } from "./entities/anime.entity";
import { AnimeDto, PaginatedAnimeDto } from "./models/anime.model";

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
    voter: "anime.voter"
};

function toDto(entity: AnimeEntity): AnimeDto {
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
        userPlanned: entity.userPlanned !== undefined ? Number(entity.userPlanned) : undefined
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
        return toDto(entity);
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

        // Sorting
        const sortColumn = query.sortBy ? (ALLOWED_SORT_FIELDS[query.sortBy] ?? "anime.id") : "anime.id";
        const sortOrder = query.sortOrder === "DESC" ? "DESC" : "ASC";
        qb.orderBy(sortColumn, sortOrder);

        // Pagination
        qb.skip((page - 1) * limit).take(limit);

        const [entities, total] = await qb.getManyAndCount();

        return {
            data: entities.map(toDto),
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
}
