import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TeaserSlideEntity } from "./entities/teaser-slide.entity";

export interface TeaserSlideDto {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    linkUrl: string | null;
    linkLabel: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSlideDto {
    title: string;
    description?: string;
    imageUrl: string;
    linkUrl?: string;
    linkLabel?: string;
    isActive?: boolean;
    sortOrder?: number;
}

@Injectable()
export class SlideshowService {
    constructor(
        @InjectRepository(TeaserSlideEntity)
        private readonly repo: Repository<TeaserSlideEntity>
    ) {}

    async findActive(): Promise<TeaserSlideDto[]> {
        const slides = await this.repo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC", createdAt: "ASC" }
        });
        return slides.map(this.toDto);
    }

    async findAll(): Promise<TeaserSlideDto[]> {
        const slides = await this.repo.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
        return slides.map(this.toDto);
    }

    async create(dto: CreateSlideDto): Promise<TeaserSlideDto> {
        const slide = this.repo.create({
            title: dto.title,
            description: dto.description ?? null,
            imageUrl: dto.imageUrl,
            linkUrl: dto.linkUrl ?? null,
            linkLabel: dto.linkLabel ?? null,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0
        });
        const saved = await this.repo.save(slide);
        return this.toDto(saved);
    }

    async update(id: string, dto: Partial<CreateSlideDto>): Promise<TeaserSlideDto> {
        await this.repo.update(id, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description || null }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl || null }),
            ...(dto.linkLabel !== undefined && { linkLabel: dto.linkLabel || null }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder })
        });
        const slide = await this.repo.findOneByOrFail({ id });
        return this.toDto(slide);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    private toDto(slide: TeaserSlideEntity): TeaserSlideDto {
        return {
            id: slide.id,
            title: slide.title,
            description: slide.description,
            imageUrl: slide.imageUrl,
            linkUrl: slide.linkUrl,
            linkLabel: slide.linkLabel,
            isActive: slide.isActive,
            sortOrder: slide.sortOrder,
            createdAt: slide.createdAt.toISOString(),
            updatedAt: slide.updatedAt.toISOString()
        };
    }
}
