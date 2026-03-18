import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SlideTranslation, TeaserSlideEntity } from "./entities/teaser-slide.entity";

export interface TeaserSlideDto {
    id: string;
    title: string;
    description: string | null;
    translations: Record<string, SlideTranslation> | null;
    imageUrl: string;
    linkUrl: string | null;
    linkLabel: string | null;
    linkFullSlide: boolean;
    textStyle: string;
    textAlign: string;
    isActive: boolean;
    sortOrder: number;
    validFrom: string | null;
    validUntil: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSlideDto {
    title: string;
    description?: string;
    translations?: Record<string, SlideTranslation>;
    imageUrl: string;
    linkUrl?: string;
    linkLabel?: string;
    linkFullSlide?: boolean;
    textStyle?: string;
    textAlign?: string;
    isActive?: boolean;
    sortOrder?: number;
    validFrom?: string | null;
    validUntil?: string | null;
}

@Injectable()
export class SlideshowService {
    constructor(
        @InjectRepository(TeaserSlideEntity)
        private readonly repo: Repository<TeaserSlideEntity>
    ) {}

    async findActive(): Promise<TeaserSlideDto[]> {
        const now = new Date();
        const slides = await this.repo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC", createdAt: "ASC" }
        });
        return slides
            .filter((s) => {
                if (s.validFrom && s.validFrom > now) return false;
                if (s.validUntil && s.validUntil < now) return false;
                return true;
            })
            .map(this.toDto);
    }

    async findAll(): Promise<TeaserSlideDto[]> {
        const slides = await this.repo.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
        return slides.map(this.toDto);
    }

    async create(dto: CreateSlideDto): Promise<TeaserSlideDto> {
        const slide = this.repo.create({
            title: dto.title,
            description: dto.description ?? null,
            translations: dto.translations ?? null,
            imageUrl: dto.imageUrl,
            linkUrl: dto.linkUrl ?? null,
            linkLabel: dto.linkLabel ?? null,
            linkFullSlide: dto.linkFullSlide ?? false,
            textStyle: dto.textStyle ?? "overlay",
            textAlign: dto.textAlign ?? "left",
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
            validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
            validUntil: dto.validUntil ? new Date(dto.validUntil) : null
        });
        const saved = await this.repo.save(slide);
        return this.toDto(saved);
    }

    async update(id: string, dto: Partial<CreateSlideDto>): Promise<TeaserSlideDto> {
        await this.repo.update(id, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description || null }),
            ...(dto.translations !== undefined && { translations: dto.translations ?? null }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl || null }),
            ...(dto.linkLabel !== undefined && { linkLabel: dto.linkLabel || null }),
            ...(dto.linkFullSlide !== undefined && { linkFullSlide: dto.linkFullSlide }),
            ...(dto.textStyle !== undefined && { textStyle: dto.textStyle }),
            ...(dto.textAlign !== undefined && { textAlign: dto.textAlign }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            ...(dto.validFrom !== undefined && { validFrom: dto.validFrom ? new Date(dto.validFrom) : null }),
            ...(dto.validUntil !== undefined && { validUntil: dto.validUntil ? new Date(dto.validUntil) : null })
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
            translations: slide.translations,
            imageUrl: slide.imageUrl,
            linkUrl: slide.linkUrl,
            linkLabel: slide.linkLabel,
            linkFullSlide: slide.linkFullSlide,
            textStyle: slide.textStyle,
            textAlign: slide.textAlign,
            isActive: slide.isActive,
            sortOrder: slide.sortOrder,
            validFrom: slide.validFrom?.toISOString() ?? null,
            validUntil: slide.validUntil?.toISOString() ?? null,
            createdAt: slide.createdAt.toISOString(),
            updatedAt: slide.updatedAt.toISOString()
        };
    }
}
