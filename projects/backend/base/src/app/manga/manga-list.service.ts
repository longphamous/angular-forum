import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SaveMangaListEntryDto } from "./dto/save-manga-list-entry.dto";
import { UserMangaListEntity } from "./entities/user-manga-list.entity";
import { MangaService } from "./manga.service";
import { MangaDto } from "./models/manga.model";

export interface MangaListEntryDto {
    mangaId: number;
    userId: string;
    status: string;
    score?: number;
    chaptersRead: number;
    volumesRead: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
    manga?: MangaDto;
}

@Injectable()
export class MangaListService {
    constructor(
        @InjectRepository(UserMangaListEntity)
        private readonly listRepo: Repository<UserMangaListEntity>,
        private readonly mangaService: MangaService
    ) {}

    async getUserList(userId: string): Promise<MangaListEntryDto[]> {
        const entries = await this.listRepo.find({
            where: { userId },
            order: { updatedAt: "DESC" }
        });
        if (!entries.length) return [];

        const mangaIds = entries.map((e) => e.mangaId);
        const mangas = await this.mangaService.findByIds(mangaIds);
        const mangaMap = new Map(mangas.map((m) => [m.id, m]));

        return entries.map((e) => this.toDto(e, mangaMap.get(e.mangaId)));
    }

    async saveEntry(userId: string, dto: SaveMangaListEntryDto): Promise<MangaListEntryDto> {
        let entry = await this.listRepo.findOne({ where: { userId, mangaId: dto.mangaId } });

        if (entry) {
            entry.status = dto.status;
            entry.score = dto.score ?? undefined;
            entry.chaptersRead = dto.chaptersRead ?? 0;
            entry.volumesRead = dto.volumesRead ?? 0;
            entry.review = dto.review ?? undefined;
        } else {
            entry = this.listRepo.create({
                userId,
                mangaId: dto.mangaId,
                status: dto.status,
                score: dto.score,
                chaptersRead: dto.chaptersRead ?? 0,
                volumesRead: dto.volumesRead ?? 0,
                review: dto.review
            });
        }

        const saved = await this.listRepo.save(entry);
        const [manga] = await this.mangaService.findByIds([dto.mangaId]);
        return this.toDto(saved, manga);
    }

    async removeEntry(userId: string, mangaId: number): Promise<void> {
        const entry = await this.listRepo.findOne({ where: { userId, mangaId } });
        if (!entry) throw new NotFoundException(`Manga ${mangaId} not in list`);
        await this.listRepo.remove(entry);
    }

    private toDto(entity: UserMangaListEntity, manga?: MangaDto): MangaListEntryDto {
        return {
            mangaId: entity.mangaId,
            userId: entity.userId,
            status: entity.status,
            score: entity.score,
            chaptersRead: entity.chaptersRead,
            volumesRead: entity.volumesRead,
            review: entity.review,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
            manga
        };
    }
}
