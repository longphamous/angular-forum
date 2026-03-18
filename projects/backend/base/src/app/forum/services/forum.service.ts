import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateForumDto } from "../dto/create-forum.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { UpdateForumDto } from "../dto/update-forum.dto";
import { ForumCategoryEntity } from "../entities/category.entity";
import { ForumEntity } from "../entities/forum.entity";
import { ForumDetailDto, ForumDto, PaginatedResult } from "../models/forum.model";

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

function toDto(entity: ForumEntity): ForumDto {
    return {
        id: entity.id,
        categoryId: entity.categoryId,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        position: entity.position,
        isLocked: entity.isLocked,
        isPrivate: entity.isPrivate,
        threadCount: entity.threadCount,
        postCount: entity.postCount,
        lastPostAt: entity.lastPostAt?.toISOString(),
        lastPostByUserId: entity.lastPostByUserId,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ForumService {
    constructor(
        @InjectRepository(ForumEntity)
        private readonly forumRepo: Repository<ForumEntity>,
        @InjectRepository(ForumCategoryEntity)
        private readonly categoryRepo: Repository<ForumCategoryEntity>
    ) {}

    async findAll(): Promise<ForumDto[]> {
        const forums = await this.forumRepo.find({
            order: { position: "ASC" },
            relations: ["category"]
        });
        return forums.map((f) => ({
            ...toDto(f),
            name: `${f.category?.name ?? ""} → ${f.name}`
        }));
    }

    async findByCategory(categoryId: string, query: ForumQueryDto): Promise<PaginatedResult<ForumDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [forums, total] = await this.forumRepo.findAndCount({
            where: { categoryId },
            order: { position: "ASC" },
            skip,
            take: limit
        });

        return { data: forums.map(toDto), total, page, limit };
    }

    async findById(id: string): Promise<ForumDetailDto> {
        const entity = await this.forumRepo.findOne({
            where: { id },
            relations: ["category"]
        });
        if (!entity) throw new NotFoundException(`Forum "${id}" not found`);

        return {
            ...toDto(entity),
            categoryName: entity.category.name,
            categorySlug: entity.category.slug
        };
    }

    async create(categoryId: string, dto: CreateForumDto): Promise<ForumDto> {
        const categoryExists = await this.categoryRepo.existsBy({ id: categoryId });
        if (!categoryExists) throw new NotFoundException(`Category "${categoryId}" not found`);

        const slug = await this.buildUniqueSlug(generateSlug(dto.name));
        const entity = this.forumRepo.create({
            categoryId,
            name: dto.name,
            slug,
            description: dto.description,
            position: dto.position ?? 0,
            isLocked: dto.isLocked ?? false,
            isPrivate: dto.isPrivate ?? false
        });
        await this.forumRepo.save(entity);
        return toDto(entity);
    }

    async update(id: string, dto: UpdateForumDto): Promise<ForumDto> {
        const entity = await this.findEntityById(id);

        if (dto.categoryId !== undefined) {
            const categoryExists = await this.categoryRepo.existsBy({ id: dto.categoryId });
            if (!categoryExists) throw new NotFoundException(`Category "${dto.categoryId}" not found`);
            entity.categoryId = dto.categoryId;
        }
        if (dto.name !== undefined) {
            entity.name = dto.name;
            entity.slug = await this.buildUniqueSlug(generateSlug(dto.name), id);
        }
        if (dto.description !== undefined) entity.description = dto.description;
        if (dto.position !== undefined) entity.position = dto.position;
        if (dto.isLocked !== undefined) entity.isLocked = dto.isLocked;
        if (dto.isPrivate !== undefined) entity.isPrivate = dto.isPrivate;

        await this.forumRepo.save(entity);
        return toDto(entity);
    }

    async remove(id: string): Promise<void> {
        const entity = await this.findEntityById(id);
        await this.forumRepo.remove(entity);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findEntityById(id: string): Promise<ForumEntity> {
        const entity = await this.forumRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Forum "${id}" not found`);
        return entity;
    }

    private async buildUniqueSlug(base: string, excludeId?: string): Promise<string> {
        const existing = await this.forumRepo.findOneBy({ slug: base });
        if (!existing || existing.id === excludeId) return base;
        return `${base}-${Date.now().toString(36)}`;
    }
}
