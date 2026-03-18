import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AnimeService } from "./anime.service";
import { SaveAnimeListEntryDto } from "./dto/save-anime-list-entry.dto";
import { UserAnimeListEntity } from "./entities/user-anime-list.entity";
import { AnimeDto } from "./models/anime.model";

export interface AnimeListEntryDto {
    animeId: number;
    userId: string;
    status: string;
    score?: number;
    episodesWatched: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
    anime?: AnimeDto;
}

@Injectable()
export class AnimeListService {
    constructor(
        @InjectRepository(UserAnimeListEntity)
        private readonly listRepo: Repository<UserAnimeListEntity>,
        private readonly animeService: AnimeService
    ) {}

    async getUserList(userId: string): Promise<AnimeListEntryDto[]> {
        const entries = await this.listRepo.find({
            where: { userId },
            order: { updatedAt: "DESC" }
        });
        if (!entries.length) return [];

        const animeIds = entries.map((e) => e.animeId);
        const animes = await this.animeService.findByIds(animeIds);
        const animeMap = new Map(animes.map((a) => [a.id, a]));

        return entries.map((e) => this.toDto(e, animeMap.get(e.animeId)));
    }

    async saveEntry(userId: string, dto: SaveAnimeListEntryDto): Promise<AnimeListEntryDto> {
        let entry = await this.listRepo.findOne({ where: { userId, animeId: dto.animeId } });

        if (entry) {
            entry.status = dto.status;
            entry.score = dto.score ?? undefined;
            entry.episodesWatched = dto.episodesWatched ?? 0;
            entry.review = dto.review ?? undefined;
        } else {
            entry = this.listRepo.create({
                userId,
                animeId: dto.animeId,
                status: dto.status,
                score: dto.score,
                episodesWatched: dto.episodesWatched ?? 0,
                review: dto.review
            });
        }

        const saved = await this.listRepo.save(entry);
        const [anime] = await this.animeService.findByIds([dto.animeId]);
        return this.toDto(saved, anime);
    }

    async removeEntry(userId: string, animeId: number): Promise<void> {
        const entry = await this.listRepo.findOne({ where: { userId, animeId } });
        if (!entry) throw new NotFoundException(`Anime ${animeId} not in list`);
        await this.listRepo.remove(entry);
    }

    private toDto(entity: UserAnimeListEntity, anime?: AnimeDto): AnimeListEntryDto {
        return {
            animeId: entity.animeId,
            userId: entity.userId,
            status: entity.status,
            score: entity.score,
            episodesWatched: entity.episodesWatched,
            review: entity.review,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
            anime
        };
    }
}
