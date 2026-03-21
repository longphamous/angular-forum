import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity } from "../user/entities/user.entity";
import {
    CreateCategoryDto,
    CreateLinkDto,
    LinkFilterDto,
    UpdateCategoryDto,
    UpdateLinkDto
} from "./dto/link-database.dto";
import { LinkCategoryEntity } from "./entities/link-category.entity";
import { LinkCommentEntity } from "./entities/link-comment.entity";
import { LinkEntryEntity } from "./entities/link-entry.entity";
import { LinkRatingEntity } from "./entities/link-rating.entity";
import { LinkCategoryDto, LinkCommentDto, LinkEntryDto, LinkListResult } from "./models/link-database.model";

@Injectable()
export class LinkDatabaseService {
    constructor(
        @InjectRepository(LinkCategoryEntity) private readonly categoryRepo: Repository<LinkCategoryEntity>,
        @InjectRepository(LinkEntryEntity) private readonly linkRepo: Repository<LinkEntryEntity>,
        @InjectRepository(LinkCommentEntity) private readonly commentRepo: Repository<LinkCommentEntity>,
        @InjectRepository(LinkRatingEntity) private readonly ratingRepo: Repository<LinkRatingEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    async getCategories(): Promise<LinkCategoryDto[]> {
        const cats = await this.categoryRepo.find({ order: { sortOrder: "ASC", name: "ASC" } });
        const counts = await this.linkRepo
            .createQueryBuilder("l")
            .select("l.category_id", "categoryId")
            .addSelect("COUNT(*)", "count")
            .where("l.status = 'active'")
            .groupBy("l.category_id")
            .getRawMany<{ categoryId: string; count: string }>();
        const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));
        return cats.map((c) => ({ ...this.toCatDto(c), linkCount: countMap.get(c.id) ?? 0 }));
    }

    async getCategory(id: string): Promise<LinkCategoryDto | null> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) return null;
        const count = await this.linkRepo.count({ where: { categoryId: id, status: "active" } });
        return { ...this.toCatDto(cat), linkCount: count };
    }

    async createCategory(dto: CreateCategoryDto): Promise<LinkCategoryDto> {
        const cat = this.categoryRepo.create({
            name: dto.name,
            slug: this.slugify(dto.name),
            description: dto.description ?? null,
            iconClass: dto.iconClass ?? null,
            color: dto.color ?? null,
            sortOrder: dto.sortOrder ?? 0,
            requiresApproval: dto.requiresApproval ?? false,
            defaultSortBy: dto.defaultSortBy ?? "createdAt"
        });
        const saved = await this.categoryRepo.save(cat);
        return { ...this.toCatDto(saved), linkCount: 0 };
    }

    async updateCategory(id: string, dto: UpdateCategoryDto): Promise<LinkCategoryDto | null> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) return null;
        if (dto.name !== undefined) {
            cat.name = dto.name;
            cat.slug = this.slugify(dto.name);
        }
        if (dto.description !== undefined) cat.description = dto.description ?? null;
        if (dto.iconClass !== undefined) cat.iconClass = dto.iconClass ?? null;
        if (dto.color !== undefined) cat.color = dto.color ?? null;
        if (dto.sortOrder !== undefined) cat.sortOrder = dto.sortOrder;
        if (dto.requiresApproval !== undefined) cat.requiresApproval = dto.requiresApproval;
        if (dto.defaultSortBy !== undefined) cat.defaultSortBy = dto.defaultSortBy;
        const saved = await this.categoryRepo.save(cat);
        const count = await this.linkRepo.count({ where: { categoryId: id, status: "active" } });
        return { ...this.toCatDto(saved), linkCount: count };
    }

    async deleteCategory(id: string): Promise<void> {
        await this.categoryRepo.delete(id);
    }

    async getLinks(filter: LinkFilterDto, userId?: string): Promise<LinkListResult> {
        const qb = this.linkRepo
            .createQueryBuilder("l")
            .leftJoinAndSelect("l.category", "cat")
            .leftJoinAndSelect("l.author", "author")
            .leftJoinAndSelect("l.assignedTo", "assignedTo");

        if (filter.categoryId) qb.andWhere("l.category_id = :catId", { catId: filter.categoryId });
        if (filter.status) qb.andWhere("l.status = :status", { status: filter.status });
        else qb.andWhere("l.status = 'active'");
        if (filter.tag) qb.andWhere(":tag = ANY(l.tags)", { tag: filter.tag });
        if (filter.search) {
            qb.andWhere("(l.title ILIKE :q OR l.description ILIKE :q OR l.url ILIKE :q)", { q: `%${filter.search}%` });
        }

        const sortBy = filter.sortBy ?? "createdAt";
        const sortCol =
            sortBy === "title"
                ? "l.title"
                : sortBy === "viewCount"
                  ? "l.viewCount"
                  : sortBy === "rating"
                    ? "l.rating"
                    : "l.createdAt";
        qb.orderBy(sortCol, sortBy === "title" ? "ASC" : "DESC");

        qb.skip(filter.offset ?? 0).take(filter.limit ?? 20);

        const [entries, total] = await qb.getManyAndCount();

        let ratingMap = new Map<string, number>();
        if (userId && entries.length) {
            const ids = entries.map((e) => e.id);
            const ratings = await this.ratingRepo
                .createQueryBuilder("r")
                .where("r.link_id IN (:...ids) AND r.user_id = :userId", { ids, userId })
                .getMany();
            ratingMap = new Map(ratings.map((r) => [r.linkId, r.score]));
        }

        return { items: entries.map((e) => this.toDto(e, ratingMap.get(e.id))), total };
    }

    async getLinkById(id: string, userId?: string): Promise<LinkEntryDto | null> {
        const entry = await this.linkRepo.findOne({
            where: { id },
            relations: ["category", "author", "assignedTo"]
        });
        if (!entry) return null;
        await this.linkRepo.increment({ id }, "viewCount", 1);
        entry.viewCount += 1;
        let userRating: number | undefined;
        if (userId) {
            const r = await this.ratingRepo.findOne({ where: { linkId: id, userId } });
            userRating = r?.score;
        }
        return this.toDto(entry, userRating);
    }

    async createLink(authorId: string, dto: CreateLinkDto): Promise<LinkEntryDto> {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (!category) throw new NotFoundException("Category not found");
        const entry = this.linkRepo.create({
            title: dto.title,
            url: dto.url,
            description: dto.description ?? null,
            excerpt: dto.excerpt ?? null,
            previewImageUrl: dto.previewImageUrl ?? null,
            tags: dto.tags ?? [],
            status: category.requiresApproval ? "pending" : "active",
            categoryId: dto.categoryId,
            authorId,
            address: dto.address ?? null,
            latitude: dto.latitude ?? null,
            longitude: dto.longitude ?? null,
            contactEmail: dto.contactEmail ?? null,
            contactPhone: dto.contactPhone ?? null,
            customFields: dto.customFields ?? null
        });
        const saved = await this.linkRepo.save(entry);
        const full = await this.linkRepo.findOne({
            where: { id: saved.id },
            relations: ["category", "author", "assignedTo"]
        });
        return this.toDto(full!);
    }

    async updateLink(id: string, userId: string, isAdmin: boolean, dto: UpdateLinkDto): Promise<LinkEntryDto | null> {
        const entry = await this.linkRepo.findOne({ where: { id }, relations: ["category", "author", "assignedTo"] });
        if (!entry) return null;
        const canEdit = isAdmin || entry.authorId === userId || entry.assignedToId === userId;
        if (!canEdit) return null;

        if (dto.title !== undefined) entry.title = dto.title;
        if (dto.url !== undefined) entry.url = dto.url;
        if (dto.description !== undefined) entry.description = dto.description ?? null;
        if (dto.excerpt !== undefined) entry.excerpt = dto.excerpt ?? null;
        if (dto.previewImageUrl !== undefined) entry.previewImageUrl = dto.previewImageUrl ?? null;
        if (dto.tags !== undefined) entry.tags = dto.tags;
        if (dto.categoryId !== undefined) entry.categoryId = dto.categoryId;
        if (dto.address !== undefined) entry.address = dto.address ?? null;
        if (dto.latitude !== undefined) entry.latitude = dto.latitude ?? null;
        if (dto.longitude !== undefined) entry.longitude = dto.longitude ?? null;
        if (dto.contactEmail !== undefined) entry.contactEmail = dto.contactEmail ?? null;
        if (dto.contactPhone !== undefined) entry.contactPhone = dto.contactPhone ?? null;
        if (dto.customFields !== undefined) entry.customFields = dto.customFields ?? null;
        if (isAdmin && dto.assignedToId !== undefined) entry.assignedToId = dto.assignedToId ?? null;

        const saved = await this.linkRepo.save(entry);
        const full = await this.linkRepo.findOne({
            where: { id: saved.id },
            relations: ["category", "author", "assignedTo"]
        });
        return this.toDto(full!);
    }

    async deleteLink(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const entry = await this.linkRepo.findOne({ where: { id } });
        if (!entry) return;
        if (!isAdmin && entry.authorId !== userId) return;
        await this.linkRepo.delete(id);
    }

    async approveLink(id: string): Promise<LinkEntryDto | null> {
        const entry = await this.linkRepo.findOne({ where: { id }, relations: ["category", "author", "assignedTo"] });
        if (!entry) return null;
        entry.status = "active";
        const saved = await this.linkRepo.save(entry);
        void this.notificationsService.create(
            entry.authorId,
            "system",
            "Link freigegeben",
            `Dein Link "${entry.title}" wurde freigegeben.`,
            `/links/${entry.id}`
        );
        return this.toDto(saved);
    }

    async rejectLink(id: string, reason?: string): Promise<LinkEntryDto | null> {
        const entry = await this.linkRepo.findOne({ where: { id }, relations: ["category", "author", "assignedTo"] });
        if (!entry) return null;
        entry.status = "rejected";
        const saved = await this.linkRepo.save(entry);
        const msg = reason
            ? `Dein Link "${entry.title}" wurde abgelehnt: ${reason}`
            : `Dein Link "${entry.title}" wurde abgelehnt.`;
        void this.notificationsService.create(entry.authorId, "system", "Link abgelehnt", msg);
        return this.toDto(saved);
    }

    async assignLink(id: string, assignedToId: string | null): Promise<LinkEntryDto | null> {
        const entry = await this.linkRepo.findOne({ where: { id }, relations: ["category", "author", "assignedTo"] });
        if (!entry) return null;
        entry.assignedToId = assignedToId;
        const saved = await this.linkRepo.save(entry);
        if (assignedToId) {
            void this.notificationsService.create(
                assignedToId,
                "system",
                "Link zugewiesen",
                `Dir wurde ein Link-Eintrag zur Bearbeitung zugewiesen: "${entry.title}"`,
                `/links/${entry.id}`
            );
        }
        const full = await this.linkRepo.findOne({
            where: { id: saved.id },
            relations: ["category", "author", "assignedTo"]
        });
        return this.toDto(full!);
    }

    async rateLink(linkId: string, userId: string, score: number): Promise<void> {
        let rating = await this.ratingRepo.findOne({ where: { linkId, userId } });
        if (rating) {
            rating.score = score;
            await this.ratingRepo.save(rating);
        } else {
            rating = this.ratingRepo.create({ linkId, userId, score });
            await this.ratingRepo.save(rating);
        }
        // Recalculate average
        const result = await this.ratingRepo
            .createQueryBuilder("r")
            .select("AVG(r.score)", "avg")
            .addSelect("COUNT(*)", "count")
            .where("r.link_id = :linkId", { linkId })
            .getRawOne<{ avg: string; count: string }>();
        await this.linkRepo.update(linkId, {
            rating: parseFloat(result?.avg ?? "0"),
            ratingCount: parseInt(result?.count ?? "0", 10)
        });
    }

    async getComments(linkId: string): Promise<LinkCommentDto[]> {
        const comments = await this.commentRepo.find({
            where: { linkId },
            relations: ["author"],
            order: { createdAt: "ASC" }
        });
        return comments.map((c) => this.toCommentDto(c));
    }

    async addComment(linkId: string, authorId: string, content: string): Promise<LinkCommentDto> {
        const comment = this.commentRepo.create({ linkId, authorId, content });
        const saved = await this.commentRepo.save(comment);
        await this.linkRepo.increment({ id: linkId }, "commentCount", 1);
        const full = await this.commentRepo.findOne({ where: { id: saved.id }, relations: ["author"] });
        return this.toCommentDto(full!);
    }

    async updateComment(id: string, userId: string, isAdmin: boolean, content: string): Promise<LinkCommentDto> {
        const comment = await this.commentRepo.findOne({ where: { id }, relations: ["author"] });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new NotFoundException("Comment not found");
        comment.content = content;
        const saved = await this.commentRepo.save(comment);
        const full = await this.commentRepo.findOne({ where: { id: saved.id }, relations: ["author"] });
        return this.toCommentDto(full!);
    }

    async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) return;
        if (!isAdmin && comment.authorId !== userId) return;
        await this.commentRepo.delete(id);
        await this.linkRepo.decrement({ id: comment.linkId }, "commentCount", 1);
    }

    async getPendingLinks(): Promise<LinkEntryDto[]> {
        const entries = await this.linkRepo.find({
            where: { status: "pending" },
            relations: ["category", "author", "assignedTo"],
            order: { createdAt: "ASC" }
        });
        return entries.map((e) => this.toDto(e));
    }

    private toCatDto(cat: LinkCategoryEntity): Omit<LinkCategoryDto, "linkCount"> {
        return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            iconClass: cat.iconClass,
            color: cat.color,
            sortOrder: cat.sortOrder,
            requiresApproval: cat.requiresApproval,
            defaultSortBy: cat.defaultSortBy,
            createdAt: cat.createdAt
        };
    }

    private toDto(entry: LinkEntryEntity, userRating?: number): LinkEntryDto {
        return {
            id: entry.id,
            title: entry.title,
            url: entry.url,
            description: entry.description,
            excerpt: entry.excerpt,
            previewImageUrl: entry.previewImageUrl,
            tags: entry.tags,
            status: entry.status,
            viewCount: entry.viewCount,
            rating: Number(entry.rating),
            ratingCount: entry.ratingCount,
            userRating,
            categoryId: entry.categoryId,
            categoryName: entry.category?.name ?? "",
            authorId: entry.authorId,
            authorName: entry.author?.username ?? "",
            authorAvatarUrl: entry.author?.avatarUrl ?? null,
            assignedToId: entry.assignedToId,
            assignedToName: entry.assignedTo?.username ?? null,
            address: entry.address,
            latitude: entry.latitude !== null ? Number(entry.latitude) : null,
            longitude: entry.longitude !== null ? Number(entry.longitude) : null,
            contactEmail: entry.contactEmail,
            contactPhone: entry.contactPhone,
            customFields: entry.customFields,
            commentCount: entry.commentCount,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
        };
    }

    private toCommentDto(c: LinkCommentEntity): LinkCommentDto {
        return {
            id: c.id,
            linkId: c.linkId,
            authorId: c.authorId,
            authorName: c.author?.username ?? "",
            authorAvatarUrl: c.author?.avatarUrl ?? null,
            content: c.content,
            createdAt: c.createdAt
        };
    }

    private slugify(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-");
    }
}
