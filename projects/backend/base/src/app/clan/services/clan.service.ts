import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../../notifications/notifications.service";
import { UserEntity } from "../../user/entities/user.entity";
import { ClanQueryDto } from "../dto/clan-query.dto";
import { CreateClanDto } from "../dto/create-clan.dto";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { CreatePageDto } from "../dto/create-page.dto";
import { UpdateClanDto } from "../dto/update-clan.dto";
import { ClanEntity } from "../entities/clan.entity";
import { ClanCategoryEntity } from "../entities/clan-category.entity";
import { ClanCommentEntity } from "../entities/clan-comment.entity";
import { ClanMemberEntity } from "../entities/clan-member.entity";
import { ClanPageEntity } from "../entities/clan-page.entity";
import type { ClanCommentDto, ClanDto, ClanListItemDto, ClanPageDto, PaginatedResult } from "../models/clan.model";

@Injectable()
export class ClanService {
    constructor(
        @InjectRepository(ClanEntity)
        private readonly clanRepo: Repository<ClanEntity>,
        @InjectRepository(ClanCategoryEntity)
        private readonly categoryRepo: Repository<ClanCategoryEntity>,
        @InjectRepository(ClanPageEntity)
        private readonly pageRepo: Repository<ClanPageEntity>,
        @InjectRepository(ClanCommentEntity)
        private readonly commentRepo: Repository<ClanCommentEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    // ── Public queries ───────────────────────────────────────────────────────

    async findAll(query: ClanQueryDto): Promise<PaginatedResult<ClanListItemDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const qb = this.clanRepo.createQueryBuilder("c").leftJoin("c.category", "cat").addSelect(["cat.name"]);

        // Default: only active clans
        if (query.status) {
            qb.where("c.status = :status", { status: query.status });
        } else {
            qb.where("c.status = :status", { status: "active" });
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

    async findById(id: string): Promise<ClanDto> {
        const clan = await this.clanRepo.findOne({
            where: { id },
            relations: ["category"]
        });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }
        const owner = await this.userRepo.findOne({ where: { id: clan.ownerId } });
        return this.toDto(clan, owner?.displayName);
    }

    async findBySlug(slug: string): Promise<ClanDto> {
        const clan = await this.clanRepo.findOne({
            where: { slug },
            relations: ["category"]
        });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }
        const owner = await this.userRepo.findOne({ where: { id: clan.ownerId } });
        return this.toDto(clan, owner?.displayName);
    }

    // ── Mutations ────────────────────────────────────────────────────────────

    async create(ownerId: string, dto: CreateClanDto): Promise<ClanDto> {
        const slug = this.generateSlug(dto.name);

        const clan = this.clanRepo.create({
            ...dto,
            slug,
            ownerId,
            memberCount: 1,
            status: "active"
        });

        const saved = await this.clanRepo.save(clan);

        // Add owner as first member
        const memberRepo = this.clanRepo.manager.getRepository(ClanMemberEntity);
        const ownerMember = memberRepo.create({
            clanId: saved.id,
            userId: ownerId,
            role: "owner"
        });
        await memberRepo.save(ownerMember);

        return this.findById(saved.id);
    }

    async update(id: string, userId: string, dto: UpdateClanDto): Promise<ClanDto> {
        const clan = await this.clanRepo.findOneBy({ id });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }

        await this.verifyClanAdmin(clan, userId);

        if (dto.name && dto.name !== clan.name) {
            (dto as Record<string, unknown>)["slug"] = this.generateSlug(dto.name);
        }

        Object.assign(clan, dto);
        await this.clanRepo.save(clan);

        return this.findById(id);
    }

    async delete(id: string, userId: string): Promise<void> {
        const clan = await this.clanRepo.findOneBy({ id });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }
        if (clan.ownerId !== userId) {
            throw new ForbiddenException("Only the clan owner can disband the clan");
        }

        clan.status = "disbanded";
        await this.clanRepo.save(clan);
    }

    async getMyClans(userId: string): Promise<ClanListItemDto[]> {
        const clans = await this.clanRepo
            .createQueryBuilder("c")
            .innerJoin(ClanMemberEntity, "m", "m.clanId = c.id AND m.userId = :userId", { userId })
            .leftJoin("c.category", "cat")
            .addSelect(["cat.name"])
            .orderBy("c.createdAt", "DESC")
            .getMany();

        return clans.map((c) => this.toListItemDto(c));
    }

    // ── Pages ────────────────────────────────────────────────────────────────

    async getPages(clanId: string): Promise<ClanPageDto[]> {
        const pages = await this.pageRepo.find({
            where: { clanId },
            order: { position: "ASC" }
        });
        return pages.map((p) => this.toPageDto(p));
    }

    async createPage(clanId: string, dto: CreatePageDto): Promise<ClanPageDto> {
        const slug = this.generateSlug(dto.title);
        const page = this.pageRepo.create({
            clanId,
            title: dto.title,
            slug,
            content: dto.content,
            isPublished: dto.isPublished ?? true
        });
        const saved = await this.pageRepo.save(page);
        return this.toPageDto(saved);
    }

    async updatePage(pageId: string, dto: Partial<CreatePageDto>): Promise<ClanPageDto> {
        const page = await this.pageRepo.findOneBy({ id: pageId });
        if (!page) {
            throw new NotFoundException("Page not found");
        }

        if (dto.title && dto.title !== page.title) {
            page.slug = this.generateSlug(dto.title);
        }

        Object.assign(page, dto);
        const saved = await this.pageRepo.save(page);
        return this.toPageDto(saved);
    }

    async deletePage(pageId: string): Promise<void> {
        const page = await this.pageRepo.findOneBy({ id: pageId });
        if (!page) {
            throw new NotFoundException("Page not found");
        }
        await this.pageRepo.remove(page);
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    async getComments(clanId: string): Promise<ClanCommentDto[]> {
        const comments = await this.commentRepo.find({
            where: { clanId },
            order: { createdAt: "DESC" }
        });

        const authorIds = [...new Set(comments.map((c) => c.authorId))];
        const userMap = await this.getUserMap(authorIds);

        return comments.map((c) => this.toCommentDto(c, userMap.get(c.authorId)));
    }

    async addComment(clanId: string, authorId: string, dto: CreateCommentDto): Promise<ClanCommentDto> {
        const clan = await this.clanRepo.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }

        const comment = this.commentRepo.create({
            clanId,
            authorId,
            content: dto.content
        });
        const saved = await this.commentRepo.save(comment);

        const author = await this.userRepo.findOne({ where: { id: authorId } });
        return this.toCommentDto(saved, author?.displayName);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private toDto(clan: ClanEntity, ownerName?: string): ClanDto {
        return {
            id: clan.id,
            categoryId: clan.categoryId,
            categoryName: clan.category?.name,
            name: clan.name,
            slug: clan.slug,
            tag: clan.tag,
            tagColor: clan.tagColor,
            tagBrackets: clan.tagBrackets,
            description: clan.description,
            avatarUrl: clan.avatarUrl,
            bannerUrl: clan.bannerUrl,
            ownerId: clan.ownerId,
            ownerName,
            joinType: clan.joinType,
            memberCount: clan.memberCount,
            showActivity: clan.showActivity,
            showMembers: clan.showMembers,
            showComments: clan.showComments,
            applicationTemplate: clan.applicationTemplate,
            customFields: clan.customFields,
            status: clan.status,
            createdAt: clan.createdAt.toISOString(),
            updatedAt: clan.updatedAt.toISOString()
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

    private toPageDto(page: ClanPageEntity): ClanPageDto {
        return {
            id: page.id,
            clanId: page.clanId,
            title: page.title,
            slug: page.slug,
            content: page.content,
            position: page.position,
            isPublished: page.isPublished,
            createdAt: page.createdAt.toISOString(),
            updatedAt: page.updatedAt.toISOString()
        };
    }

    private toCommentDto(comment: ClanCommentEntity, authorName?: string): ClanCommentDto {
        return {
            id: comment.id,
            clanId: comment.clanId,
            authorId: comment.authorId,
            authorName,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        };
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    private async verifyClanAdmin(clan: ClanEntity, userId: string): Promise<void> {
        if (clan.ownerId === userId) {
            return;
        }
        const memberRepo = this.clanRepo.manager.getRepository(ClanMemberEntity);
        const member = await memberRepo.findOne({
            where: { clanId: clan.id, userId }
        });
        if (!member || (member.role !== "admin" && member.role !== "owner")) {
            throw new ForbiddenException("You do not have permission to manage this clan");
        }
    }

    private async getUserMap(userIds: string[]): Promise<Map<string, string>> {
        const map = new Map<string, string>();
        if (userIds.length === 0) {
            return map;
        }
        const users = await this.userRepo
            .createQueryBuilder("u")
            .select(["u.id", "u.displayName"])
            .where("u.id IN (:...ids)", { ids: userIds })
            .getMany();
        for (const u of users) {
            map.set(u.id, u.displayName);
        }
        return map;
    }
}
