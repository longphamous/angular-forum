import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserRole } from "../../user/entities/user.entity";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";
import { ForumEntity } from "../entities/forum.entity";
import { ForumPostEntity } from "../entities/post.entity";
import { ForumThreadEntity } from "../entities/thread.entity";
import { PaginatedResult, ThreadDetailDto, ThreadDto } from "../models/forum.model";

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

function toDto(entity: ForumThreadEntity): ThreadDto {
    return {
        id: entity.id,
        forumId: entity.forumId,
        authorId: entity.authorId,
        title: entity.title,
        slug: entity.slug,
        isPinned: entity.isPinned,
        isLocked: entity.isLocked,
        isSticky: entity.isSticky,
        viewCount: entity.viewCount,
        replyCount: entity.replyCount,
        lastPostAt: entity.lastPostAt?.toISOString(),
        lastPostByUserId: entity.lastPostByUserId,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
    };
}

function canModify(authorId: string, userId: string, userRole: UserRole): boolean {
    return authorId === userId || userRole === "admin" || userRole === "moderator";
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ThreadService {
    constructor(
        @InjectRepository(ForumThreadEntity)
        private readonly threadRepo: Repository<ForumThreadEntity>,
        @InjectRepository(ForumPostEntity)
        private readonly postRepo: Repository<ForumPostEntity>,
        @InjectRepository(ForumEntity)
        private readonly forumRepo: Repository<ForumEntity>
    ) {}

    async findByForum(forumId: string, query: ForumQueryDto): Promise<PaginatedResult<ThreadDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [threads, total] = await this.threadRepo.findAndCount({
            where: { forumId },
            order: {
                isPinned: "DESC",
                isSticky: "DESC",
                lastPostAt: "DESC"
            },
            skip,
            take: limit
        });

        return { data: threads.map(toDto), total, page, limit };
    }

    async findById(id: string): Promise<ThreadDetailDto> {
        const entity = await this.threadRepo.findOne({
            where: { id },
            relations: ["forum"]
        });
        if (!entity) throw new NotFoundException(`Thread "${id}" not found`);

        // Increment view count without triggering full save/updatedAt change
        await this.threadRepo.increment({ id }, "viewCount", 1);
        entity.viewCount += 1;

        return {
            ...toDto(entity),
            forumName: entity.forum.name,
            forumSlug: entity.forum.slug
        };
    }

    async create(forumId: string, authorId: string, dto: CreateThreadDto): Promise<ThreadDto> {
        const forum = await this.forumRepo.findOneBy({ id: forumId });
        if (!forum) throw new NotFoundException(`Forum "${forumId}" not found`);

        const slug = await this.buildUniqueSlug(generateSlug(dto.title));
        const now = new Date();

        const thread = this.threadRepo.create({
            forumId,
            authorId,
            title: dto.title,
            slug,
            isPinned: dto.isPinned ?? false,
            isSticky: dto.isSticky ?? false,
            lastPostAt: now,
            lastPostByUserId: authorId
        });
        await this.threadRepo.save(thread);

        const firstPost = this.postRepo.create({
            threadId: thread.id,
            authorId,
            content: dto.content,
            isFirstPost: true
        });
        await this.postRepo.save(firstPost);

        // Update forum counters
        await this.forumRepo.increment({ id: forumId }, "threadCount", 1);
        await this.forumRepo.increment({ id: forumId }, "postCount", 1);
        await this.forumRepo.update(forumId, { lastPostAt: now, lastPostByUserId: authorId });

        return toDto(thread);
    }

    async update(id: string, dto: UpdateThreadDto, userId: string, userRole: UserRole): Promise<ThreadDto> {
        const entity = await this.findEntityById(id);
        if (!canModify(entity.authorId, userId, userRole)) {
            throw new ForbiddenException("You do not have permission to update this thread");
        }

        if (dto.title !== undefined) {
            entity.title = dto.title;
            entity.slug = await this.buildUniqueSlug(generateSlug(dto.title), id);
        }
        if (dto.isPinned !== undefined) entity.isPinned = dto.isPinned;
        if (dto.isLocked !== undefined) entity.isLocked = dto.isLocked;
        if (dto.isSticky !== undefined) entity.isSticky = dto.isSticky;

        await this.threadRepo.save(entity);
        return toDto(entity);
    }

    async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
        const entity = await this.findEntityById(id);
        if (!canModify(entity.authorId, userId, userRole)) {
            throw new ForbiddenException("You do not have permission to delete this thread");
        }

        await this.threadRepo.softDelete(id);

        // Decrement forum counters
        const forumId = entity.forumId;
        const currentForum = await this.forumRepo.findOneBy({ id: forumId });
        if (currentForum) {
            await this.forumRepo.update(forumId, {
                threadCount: Math.max(0, currentForum.threadCount - 1),
                postCount: Math.max(0, currentForum.postCount - (entity.replyCount + 1))
            });
        }
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findEntityById(id: string): Promise<ForumThreadEntity> {
        const entity = await this.threadRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Thread "${id}" not found`);
        return entity;
    }

    private async buildUniqueSlug(base: string, excludeId?: string): Promise<string> {
        const existing = await this.threadRepo.findOneBy({ slug: base });
        if (!existing || existing.id === excludeId) return base;
        return `${base}-${Date.now().toString(36)}`;
    }
}
