import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { AnimeEntity } from "./entities/anime.entity";
import { AnimeDto, PaginatedAnimeDto } from "./models/anime.model";

const ANIME_DB_CONNECTION = "anime-db";

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

    async findAll(page: number, limit: number): Promise<PaginatedAnimeDto> {
        const [entities, total] = await this.animeRepo.findAndCount({
            where: { deletedAt: IsNull() },
            order: { id: "ASC" },
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            data: entities.map(toDto),
            total,
            page,
            limit
        };
    }
}
