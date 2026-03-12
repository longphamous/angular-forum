import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { ForumCategoryEntity } from "../entities/category.entity";
import { CategoryDetailDto, CategoryDto } from "../models/forum.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100);
}

function toDto(entity: ForumCategoryEntity): CategoryDto {
    return {
        id: entity.id,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        position: entity.position,
        isActive: entity.isActive,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(ForumCategoryEntity)
        private readonly categoryRepo: Repository<ForumCategoryEntity>
    ) {}

    async findAll(): Promise<CategoryDto[]> {
        const categories = await this.categoryRepo.find({
            where: { isActive: true },
            order: { position: "ASC" }
        });
        return categories.map(toDto);
    }

    async findById(id: string): Promise<CategoryDetailDto> {
        const category = await this.findEntityById(id);
        const withForums = await this.categoryRepo.findOne({
            where: { id },
            relations: ["forums"],
            order: { forums: { position: "ASC" } }
        });
        if (!withForums) throw new NotFoundException(`Category "${id}" not found`);

        return {
            ...toDto(category),
            forums: (withForums.forums ?? []).map((forum) => ({
                id: forum.id,
                categoryId: forum.categoryId,
                name: forum.name,
                slug: forum.slug,
                description: forum.description,
                position: forum.position,
                isLocked: forum.isLocked,
                isPrivate: forum.isPrivate,
                threadCount: forum.threadCount,
                postCount: forum.postCount,
                lastPostAt: forum.lastPostAt?.toISOString(),
                lastPostByUserId: forum.lastPostByUserId,
                createdAt: forum.createdAt.toISOString(),
                updatedAt: forum.updatedAt.toISOString()
            }))
        };
    }

    async create(dto: CreateCategoryDto): Promise<CategoryDto> {
        const slug = await this.buildUniqueSlug(generateSlug(dto.name));
        const entity = this.categoryRepo.create({
            name: dto.name,
            slug,
            description: dto.description,
            position: dto.position ?? 0
        });
        await this.categoryRepo.save(entity);
        return toDto(entity);
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
        const entity = await this.findEntityById(id);
        if (dto.name !== undefined) {
            entity.name = dto.name;
            entity.slug = await this.buildUniqueSlug(generateSlug(dto.name), id);
        }
        if (dto.description !== undefined) entity.description = dto.description;
        if (dto.position !== undefined) entity.position = dto.position;
        if (dto.isActive !== undefined) entity.isActive = dto.isActive;
        await this.categoryRepo.save(entity);
        return toDto(entity);
    }

    async remove(id: string): Promise<void> {
        const entity = await this.findEntityById(id);
        await this.categoryRepo.remove(entity);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findEntityById(id: string): Promise<ForumCategoryEntity> {
        const entity = await this.categoryRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Category "${id}" not found`);
        return entity;
    }

    private async buildUniqueSlug(base: string, excludeId?: string): Promise<string> {
        const existing = await this.categoryRepo.findOneBy({ slug: base });
        if (!existing || existing.id === excludeId) return base;
        return `${base}-${Date.now().toString(36)}`;
    }
}
