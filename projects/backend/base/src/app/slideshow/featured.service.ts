import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateFeaturedItemDto } from "./dto/create-featured-item.dto";
import { FeaturedItemEntity, FeaturedSection } from "./entities/featured-item.entity";

export interface FeaturedItemDto {
    id: string;
    section: string;
    sourceType: string;
    sourceId?: string;
    title: string;
    description?: string;
    imageUrl?: string;
    linkUrl?: string;
    badgeText?: string;
    badgeColor?: string;
    originalPrice?: number;
    discountPrice?: number;
    isActive: boolean;
    sortOrder: number;
    validFrom?: string;
    validUntil?: string;
    createdAt: string;
}

@Injectable()
export class FeaturedService {
    constructor(
        @InjectRepository(FeaturedItemEntity)
        private readonly repo: Repository<FeaturedItemEntity>
    ) {}

    async getActive(section?: FeaturedSection): Promise<FeaturedItemDto[]> {
        const now = new Date();
        const qb = this.repo.createQueryBuilder("item").where("item.isActive = :active", { active: true });

        if (section) {
            qb.andWhere("item.section = :section", { section });
        }

        qb.orderBy("item.sortOrder", "ASC").addOrderBy("item.createdAt", "ASC");

        const items = await qb.getMany();

        return items
            .filter((item) => {
                if (item.validFrom && item.validFrom > now) return false;
                if (item.validUntil && item.validUntil < now) return false;
                return true;
            })
            .map(this.toDto);
    }

    async findAll(): Promise<FeaturedItemDto[]> {
        const qb = this.repo
            .createQueryBuilder("item")
            .orderBy("item.section", "ASC")
            .addOrderBy("item.sortOrder", "ASC");

        const items = await qb.getMany();
        return items.map(this.toDto);
    }

    async create(dto: CreateFeaturedItemDto): Promise<FeaturedItemDto> {
        const item = this.repo.create({
            section: dto.section,
            sourceType: dto.sourceType,
            sourceId: dto.sourceId ?? null,
            title: dto.title,
            description: dto.description ?? null,
            imageUrl: dto.imageUrl ?? null,
            linkUrl: dto.linkUrl ?? null,
            badgeText: dto.badgeText ?? null,
            badgeColor: dto.badgeColor ?? "#EF4444",
            originalPrice: dto.originalPrice ?? null,
            discountPrice: dto.discountPrice ?? null,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
            validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
            validUntil: dto.validUntil ? new Date(dto.validUntil) : null
        });
        const saved = await this.repo.save(item);
        return this.toDto(saved);
    }

    async update(id: string, dto: Partial<CreateFeaturedItemDto>): Promise<FeaturedItemDto> {
        await this.repo.update(id, {
            ...(dto.section !== undefined && { section: dto.section }),
            ...(dto.sourceType !== undefined && { sourceType: dto.sourceType }),
            ...(dto.sourceId !== undefined && { sourceId: dto.sourceId || null }),
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description || null }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl || null }),
            ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl || null }),
            ...(dto.badgeText !== undefined && { badgeText: dto.badgeText || null }),
            ...(dto.badgeColor !== undefined && { badgeColor: dto.badgeColor }),
            ...(dto.originalPrice !== undefined && { originalPrice: dto.originalPrice ?? null }),
            ...(dto.discountPrice !== undefined && { discountPrice: dto.discountPrice ?? null }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            ...(dto.validFrom !== undefined && { validFrom: dto.validFrom ? new Date(dto.validFrom) : null }),
            ...(dto.validUntil !== undefined && { validUntil: dto.validUntil ? new Date(dto.validUntil) : null })
        });
        const item = await this.repo.findOneByOrFail({ id });
        return this.toDto(item);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    private toDto(item: FeaturedItemEntity): FeaturedItemDto {
        return {
            id: item.id,
            section: item.section,
            sourceType: item.sourceType,
            sourceId: item.sourceId ?? undefined,
            title: item.title,
            description: item.description ?? undefined,
            imageUrl: item.imageUrl ?? undefined,
            linkUrl: item.linkUrl ?? undefined,
            badgeText: item.badgeText ?? undefined,
            badgeColor: item.badgeColor ?? undefined,
            originalPrice: item.originalPrice ?? undefined,
            discountPrice: item.discountPrice ?? undefined,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
            validFrom: item.validFrom?.toISOString() ?? undefined,
            validUntil: item.validUntil?.toISOString() ?? undefined,
            createdAt: item.createdAt.toISOString()
        };
    }
}
