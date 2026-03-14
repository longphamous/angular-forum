import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { CreditService } from "../../credit/credit.service";
import { GamificationService } from "../../gamification/gamification.service";
import { UserXpData } from "../../gamification/level.config";
import { UserEntity, UserRole } from "../../user/entities/user.entity";
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

interface AuthorInfo {
    displayName: string;
    role: string;
    postCount: number;
    avatarUrl?: string;
    signature?: string;
    xpData?: UserXpData;
    balance?: number;
}

function toDto(entity: ForumPostEntity, author?: AuthorInfo): PostDto {
    return {
        id: entity.id,
        threadId: entity.threadId,
        authorId: entity.authorId,
        authorName: author?.displayName ?? entity.authorId.slice(0, 8),
        authorRole: author?.role ?? "member",
        authorPostCount: author?.postCount ?? 0,
        authorAvatarUrl: author?.avatarUrl,
        authorSignature: author?.signature,
        authorLevel: author?.xpData?.level ?? 1,
        authorLevelName: author?.xpData?.levelName ?? "Neuling",
        authorBalance: author?.balance,
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
        private readonly forumRepo: Repository<ForumEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService,
        private readonly creditService: CreditService
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

        const authorIds = [...new Set(posts.map((p) => p.authorId))];
        const [users, postCountRows, xpMap, balanceMap] = await Promise.all([
            authorIds.length
                ? this.userRepo.find({ where: { id: In(authorIds) }, select: ["id", "displayName", "role", "avatarUrl", "signature"] })
                : Promise.resolve([]),
            authorIds.length
                ? this.postRepo.query<{ author_id: string; count: string }[]>(
                      `SELECT author_id, COUNT(*) AS count FROM forum_posts WHERE author_id = ANY($1) AND deleted_at IS NULL GROUP BY author_id`,
                      [authorIds]
                  )
                : Promise.resolve([]),
            this.gamificationService.getUserXpDataBatch(authorIds),
            this.creditService.getBalances(authorIds)
        ]);

        const postCountMap = new Map(postCountRows.map((r) => [r.author_id, Number(r.count)]));

        const userMap = new Map<string, AuthorInfo>(
            users.map((u) => [
                u.id,
                {
                    displayName: u.displayName,
                    role: u.role,
                    postCount: postCountMap.get(u.id) ?? 0,
                    avatarUrl: u.avatarUrl,
                    signature: u.signature,
                    xpData: xpMap.get(u.id),
                    balance: balanceMap.get(u.id)
                }
            ])
        );

        return { data: posts.map((p) => toDto(p, userMap.get(p.authorId))), total, page, limit };
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

        // Award XP for creating a post
        void this.gamificationService.awardXp(authorId, "create_post", post.id);
        // Award 5 coins for creating a post
        void this.creditService.addCredits(authorId, 5, "reward", "Coins für neuen Beitrag").catch(() => undefined);

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

            // Award XP: giver gets 1, receiver gets 3
            void this.gamificationService.awardXp(userId, "give_reaction", postId);
            if (post.authorId !== userId) {
                void this.gamificationService.awardXp(post.authorId, "receive_reaction", postId);
                // Award 2 coins to post author for receiving a reaction
                void this.creditService.addCredits(post.authorId, 2, "reward", "Coins für erhaltene Reaktion").catch(() => undefined);
            }
        }

        return toReactionDto(reaction);
    }

    async getMyReactions(threadId: string, userId: string): Promise<string[]> {
        const rows = await this.reactionRepo.query<{ post_id: string }[]>(
            `SELECT r.post_id
               FROM forum_post_reactions r
               JOIN forum_posts p ON p.id = r.post_id
              WHERE p.thread_id = $1
                AND r.user_id  = $2
                AND p.deleted_at IS NULL`,
            [threadId, userId]
        );
        return rows.map((r) => r.post_id);
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
