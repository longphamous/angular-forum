import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserRole } from "../../user/entities/user.entity";
import { CreatePostDto } from "../dto/create-post.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { ReactPostDto } from "../dto/react-post.dto";
import { UpdatePostDto } from "../dto/update-post.dto";
import { ForumEntity } from "../entities/forum.entity";
import { ForumPostEntity } from "../entities/post.entity";
import { ForumPostReactionEntity } from "../entities/post-reaction.entity";
import { ForumThreadEntity } from "../entities/thread.entity";
import { PaginatedResult, PostDto, ReactionDto } from "../models/forum.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDto(entity: ForumPostEntity): PostDto {
    return {
        id: entity.id,
        threadId: entity.threadId,
        authorId: entity.authorId,
        content: entity.content,
        isFirstPost: entity.isFirstPost,
        isEdited: entity.isEdited,
        editedAt: entity.editedAt?.toISOString(),
        editCount: entity.editCount,
        reactionCount: entity.reactionCount,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
    };
}

function toReactionDto(entity: ForumPostReactionEntity): ReactionDto {
    return {
        id: entity.id,
        postId: entity.postId,
        userId: entity.userId,
        reactionType: entity.reactionType,
        createdAt: entity.createdAt.toISOString()
    };
}

function canModify(authorId: string, userId: string, userRole: UserRole): boolean {
    return authorId === userId || userRole === "admin" || userRole === "moderator";
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(ForumPostEntity)
        private readonly postRepo: Repository<ForumPostEntity>,
        @InjectRepository(ForumPostReactionEntity)
        private readonly reactionRepo: Repository<ForumPostReactionEntity>,
        @InjectRepository(ForumThreadEntity)
        private readonly threadRepo: Repository<ForumThreadEntity>,
        @InjectRepository(ForumEntity)
        private readonly forumRepo: Repository<ForumEntity>
    ) {}

    async findByThread(threadId: string, query: ForumQueryDto): Promise<PaginatedResult<PostDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const [posts, total] = await this.postRepo.findAndCount({
            where: { threadId },
            order: { createdAt: "ASC" },
            skip,
            take: limit
        });

        return { data: posts.map(toDto), total, page, limit };
    }

    async findById(id: string): Promise<PostDto> {
        return toDto(await this.findEntityById(id));
    }

    async create(threadId: string, authorId: string, dto: CreatePostDto): Promise<PostDto> {
        const thread = await this.threadRepo.findOneBy({ id: threadId });
        if (!thread) throw new NotFoundException(`Thread "${threadId}" not found`);

        const now = new Date();
        const post = this.postRepo.create({
            threadId,
            authorId,
            content: dto.content
        });
        await this.postRepo.save(post);

        // Update thread counters
        await this.threadRepo.increment({ id: threadId }, "replyCount", 1);
        await this.threadRepo.update(threadId, { lastPostAt: now, lastPostByUserId: authorId });

        // Update forum counters
        await this.forumRepo.increment({ id: thread.forumId }, "postCount", 1);
        await this.forumRepo.update(thread.forumId, { lastPostAt: now, lastPostByUserId: authorId });

        return toDto(post);
    }

    async update(id: string, dto: UpdatePostDto, userId: string): Promise<PostDto> {
        const entity = await this.findEntityById(id);
        if (entity.authorId !== userId) {
            throw new ForbiddenException("You do not have permission to update this post");
        }

        entity.content = dto.content;
        entity.isEdited = true;
        entity.editedAt = new Date();
        entity.editCount += 1;

        await this.postRepo.save(entity);
        return toDto(entity);
    }

    async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
        const entity = await this.findEntityById(id);
        if (!canModify(entity.authorId, userId, userRole)) {
            throw new ForbiddenException("You do not have permission to delete this post");
        }

        const thread = await this.threadRepo.findOneBy({ id: entity.threadId });
        await this.postRepo.softDelete(id);

        if (thread) {
            const currentThread = await this.threadRepo.findOneBy({ id: entity.threadId });
            if (currentThread) {
                await this.threadRepo.update(entity.threadId, {
                    replyCount: Math.max(0, currentThread.replyCount - 1)
                });
            }

            const currentForum = await this.forumRepo.findOneBy({ id: thread.forumId });
            if (currentForum) {
                await this.forumRepo.update(thread.forumId, {
                    postCount: Math.max(0, currentForum.postCount - 1)
                });
            }
        }
    }

    async react(postId: string, userId: string, dto: ReactPostDto): Promise<ReactionDto> {
        const post = await this.findEntityById(postId);

        let reaction = await this.reactionRepo.findOneBy({ postId, userId });

        if (reaction) {
            // Update existing reaction type; reaction_count stays the same when changing type
            reaction.reactionType = dto.reactionType;
            await this.reactionRepo.save(reaction);
        } else {
            // Create new reaction and increment cached count
            reaction = this.reactionRepo.create({
                postId,
                userId,
                reactionType: dto.reactionType
            });
            await this.reactionRepo.save(reaction);
            await this.postRepo.increment({ id: postId }, "reactionCount", 1);
            post.reactionCount += 1;
        }

        return toReactionDto(reaction);
    }

    async unreact(postId: string, userId: string): Promise<void> {
        const reaction = await this.reactionRepo.findOneBy({ postId, userId });
        if (!reaction) return;

        await this.reactionRepo.remove(reaction);

        const currentPost = await this.postRepo.findOneBy({ id: postId });
        if (currentPost) {
            await this.postRepo.update(postId, {
                reactionCount: Math.max(0, currentPost.reactionCount - 1)
            });
        }
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findEntityById(id: string): Promise<ForumPostEntity> {
        const entity = await this.postRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Post "${id}" not found`);
        return entity;
    }
}
