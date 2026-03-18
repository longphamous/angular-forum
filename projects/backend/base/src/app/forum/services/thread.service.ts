import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { GamificationService } from "../../gamification/gamification.service";
import { UserXpData } from "../../gamification/level.config";
import { UserEntity, UserRole } from "../../user/entities/user.entity";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";
import { ForumEntity } from "../entities/forum.entity";
import { ForumPollEntity } from "../entities/poll.entity";
import { ForumPostEntity } from "../entities/post.entity";
import { ForumThreadEntity } from "../entities/thread.entity";
import { PaginatedResult, PollDto, PollOptionDto, ThreadDetailDto, ThreadDto } from "../models/forum.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ThreadAuthorInfo {
    displayName: string;
    avatarUrl?: string;
    xpData?: UserXpData;
}

function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100);
}

function toDto(entity: ForumThreadEntity, author?: ThreadAuthorInfo): ThreadDto {
    return {
        id: entity.id,
        forumId: entity.forumId,
        authorId: entity.authorId,
        authorName: author?.displayName ?? entity.authorId.slice(0, 8),
        authorAvatarUrl: author?.avatarUrl,
        authorLevel: author?.xpData?.level ?? 1,
        authorLevelName: author?.xpData?.levelName ?? "Neuling",
        title: entity.title,
        slug: entity.slug,
        tags: entity.tags ?? [],
        isPinned: entity.isPinned,
        isLocked: entity.isLocked,
        isSticky: entity.isSticky,
        viewCount: entity.viewCount,
        replyCount: entity.replyCount,
        lastPostAt: entity.lastPostAt?.toISOString(),
        lastPostByUserId: entity.lastPostByUserId,
        bestAnswerPostId: entity.bestAnswerPostId,
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
        private readonly forumRepo: Repository<ForumEntity>,
        @InjectRepository(ForumPollEntity)
        private readonly pollRepo: Repository<ForumPollEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService
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

        const authorIds = [...new Set(threads.map((t) => t.authorId))];
        const [users, xpMap] = await Promise.all([
            authorIds.length
                ? this.userRepo.find({ where: { id: In(authorIds) }, select: ["id", "displayName", "avatarUrl"] })
                : Promise.resolve([]),
            this.gamificationService.getUserXpDataBatch(authorIds)
        ]);
        const userMap = new Map<string, ThreadAuthorInfo>(
            users.map((u) => [u.id, { displayName: u.displayName, avatarUrl: u.avatarUrl, xpData: xpMap.get(u.id) }])
        );

        return { data: threads.map((t) => toDto(t, userMap.get(t.authorId))), total, page, limit };
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

        const hasPoll = await this.pollRepo.existsBy({ threadId: id });

        return {
            ...toDto(entity),
            hasPoll,
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
            tags: dto.tags ?? [],
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

        // Create poll if provided
        if (dto.poll && dto.poll.question && dto.poll.options.length >= 2) {
            const poll = this.pollRepo.create({
                threadId: thread.id,
                question: dto.poll.question,
                options: dto.poll.options,
                votes: {},
                voterMap: {},
                isMultipleChoice: dto.poll.isMultipleChoice ?? false,
                closesAt: dto.poll.closesAt ? new Date(dto.poll.closesAt) : null
            });
            await this.pollRepo.save(poll);
        }

        // Award XP for creating a thread
        void this.gamificationService.awardXp(authorId, "create_thread", thread.id);

        return toDto(thread);
    }

    async update(id: string, dto: UpdateThreadDto, userId: string, userRole: UserRole): Promise<ThreadDto> {
        const entity = await this.findEntityById(id);
        if (!canModify(entity.authorId, userId, userRole)) {
            throw new ForbiddenException("You do not have permission to update this thread");
        }

        const isMod = userRole === "admin" || userRole === "moderator";

        if (dto.title !== undefined) {
            entity.title = dto.title;
            entity.slug = await this.buildUniqueSlug(generateSlug(dto.title), id);
        }
        if (dto.tags !== undefined) entity.tags = dto.tags;

        // Moderator/admin-only fields
        if (isMod) {
            if (dto.isPinned !== undefined) entity.isPinned = dto.isPinned;
            if (dto.isLocked !== undefined) entity.isLocked = dto.isLocked;
            if (dto.isSticky !== undefined) entity.isSticky = dto.isSticky;

            // Move thread to another forum
            if (dto.forumId !== undefined && dto.forumId !== entity.forumId) {
                await this.moveThread(entity, dto.forumId);
            }
        }

        await this.threadRepo.save(entity);
        return toDto(entity);
    }

    /** Move a thread to a different forum, updating counters on both sides. */
    private async moveThread(entity: ForumThreadEntity, targetForumId: string): Promise<void> {
        const targetForum = await this.forumRepo.findOneBy({ id: targetForumId });
        if (!targetForum) throw new NotFoundException(`Target forum "${targetForumId}" not found`);

        const oldForumId = entity.forumId;
        const postCount = entity.replyCount + 1; // replies + first post

        // Decrement old forum counters
        const oldForum = await this.forumRepo.findOneBy({ id: oldForumId });
        if (oldForum) {
            await this.forumRepo.update(oldForumId, {
                threadCount: Math.max(0, oldForum.threadCount - 1),
                postCount: Math.max(0, oldForum.postCount - postCount)
            });
        }

        // Increment target forum counters
        await this.forumRepo.increment({ id: targetForumId }, "threadCount", 1);
        await this.forumRepo.increment({ id: targetForumId }, "postCount", postCount);

        entity.forumId = targetForumId;
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

    // ── Poll ──────────────────────────────────────────────────────────────────

    async getPoll(threadId: string, userId?: string): Promise<PollDto | null> {
        const poll = await this.pollRepo.findOneBy({ threadId });
        if (!poll) return null;

        const totalVotes = Object.values(poll.votes).reduce((sum, n) => sum + n, 0);
        const myVote = userId && poll.voterMap[userId] !== undefined ? poll.voterMap[userId] : null;

        const options: PollOptionDto[] = poll.options.map((text, index) => {
            const votes = poll.votes[String(index)] ?? 0;
            return {
                index,
                text,
                votes,
                percentage: totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0
            };
        });

        return {
            id: poll.id,
            threadId: poll.threadId,
            question: poll.question,
            options,
            totalVotes,
            isMultipleChoice: poll.isMultipleChoice,
            isClosed: poll.isClosed || (poll.closesAt !== null && poll.closesAt < new Date()),
            closesAt: poll.closesAt?.toISOString() ?? null,
            myVote,
            createdAt: poll.createdAt.toISOString()
        };
    }

    async vote(threadId: string, userId: string, optionIndex: number): Promise<PollDto> {
        const poll = await this.pollRepo.findOneBy({ threadId });
        if (!poll) throw new NotFoundException("Poll not found");

        if (poll.isClosed || (poll.closesAt && poll.closesAt < new Date())) {
            throw new BadRequestException("This poll is closed");
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            throw new BadRequestException("Invalid option index");
        }

        if (poll.voterMap[userId] !== undefined) {
            throw new BadRequestException("You have already voted");
        }

        // Record vote
        poll.voterMap[userId] = optionIndex;
        const key = String(optionIndex);
        poll.votes[key] = (poll.votes[key] ?? 0) + 1;

        await this.pollRepo.save(poll);
        return (await this.getPoll(threadId, userId))!;
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
