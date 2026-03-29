import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ClanQueryDto } from "../dto/clan-query.dto";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { ClanEntity, type ClanStatus } from "../entities/clan.entity";
import { ClanCategoryEntity } from "../entities/clan-category.entity";
import type { ClanCategoryDto, ClanListItemDto, PaginatedResult } from "../models/clan.model";

@Injectable()
export class ClanAdminService {
    constructor(
        @InjectRepository(ClanCategoryEntity)
        private readonly categoryRepo: Repository<ClanCategoryEntity>,
        @InjectRepository(ClanEntity)
        private readonly clanRepo: Repository<ClanEntity>
    ) {}

    // ── Categories ───────────────────────────────────────────────────────────

    async getCategories(): Promise<ClanCategoryDto[]> {
        const categories = await this.categoryRepo.find({
            order: { position: "ASC" },
            relations: ["clans"]
        });
        return categories.map((c) => this.toCategoryDto(c));
    }

    async createCategory(dto: CreateCategoryDto): Promise<ClanCategoryDto> {
        const category = this.categoryRepo.create(dto);
        const saved = await this.categoryRepo.save(category);
        return this.toCategoryDto(saved);
    }

    async updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<ClanCategoryDto> {
        const category = await this.categoryRepo.findOneBy({ id });
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        Object.assign(category, dto);
        const saved = await this.categoryRepo.save(category);
        return this.toCategoryDto(saved);
    }

    async deleteCategory(id: string): Promise<void> {
        const category = await this.categoryRepo.findOneBy({ id });
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        await this.categoryRepo.remove(category);
    }

    // ── Admin clan list ──────────────────────────────────────────────────────

    async getAllClans(query: ClanQueryDto): Promise<PaginatedResult<ClanListItemDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const qb = this.clanRepo.createQueryBuilder("c").leftJoin("c.category", "cat").addSelect(["cat.name"]);

        if (query.status) {
            qb.where("c.status = :status", { status: query.status });
        }

        if (query.categoryId) {
            qb.andWhere("c.categoryId = :categoryId", { categoryId: query.categoryId });
        }

        if (query.search) {
            qb.andWhere("(c.name ILIKE :search OR c.tag ILIKE :search)", {
                search: `%${query.search}%`
            });
        }

        if (query.joinType) {
            qb.andWhere("c.joinType = :joinType", { joinType: query.joinType });
        }

        qb.orderBy("c.createdAt", "DESC")
            .skip((page - 1) * limit)
            .take(limit);

        const total = await qb.getCount();
        const items = await qb.getMany();

        return {
            data: items.map((c) => this.toListItemDto(c)),
            total,
            page,
            limit
        };
    }

    async moderateClan(id: string, status: ClanStatus): Promise<void> {
        const clan = await this.clanRepo.findOneBy({ id });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }
        clan.status = status;
        await this.clanRepo.save(clan);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private toCategoryDto(category: ClanCategoryEntity): ClanCategoryDto {
        return {
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            position: category.position,
            isActive: category.isActive,
            clanCount: category.clans?.length ?? 0
        };
    }

    private toListItemDto(clan: ClanEntity): ClanListItemDto {
        return {
            id: clan.id,
            name: clan.name,
            slug: clan.slug,
            tag: clan.tag,
            tagColor: clan.tagColor,
            tagBrackets: clan.tagBrackets,
            description: clan.description,
            avatarUrl: clan.avatarUrl,
            categoryId: clan.categoryId,
            categoryName: clan.category?.name,
            joinType: clan.joinType,
            memberCount: clan.memberCount,
            status: clan.status,
            createdAt: clan.createdAt.toISOString()
        };
    }
}
