import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity } from "../user/entities/user.entity";
import { ChronikQueryDto, CreateCommentDto, CreateEntryDto } from "./dto/chronik.dto";
import { ChronikCommentEntity } from "./entities/chronik-comment.entity";
import { ChronikCommentLikeEntity } from "./entities/chronik-comment-like.entity";
import { ChronikEntryEntity } from "./entities/chronik-entry.entity";
import { ChronikFollowingEntity } from "./entities/chronik-following.entity";
import { ChronikHiddenEntity } from "./entities/chronik-hidden.entity";
import { ChronikLikeEntity } from "./entities/chronik-like.entity";
import { ChronikCommentDto, ChronikEntryDto, ChronikProfileStats } from "./models/chronik.model";

@Injectable()
export class ChronikService {
    constructor(
        @InjectRepository(ChronikEntryEntity)
        private readonly entryRepo: Repository<ChronikEntryEntity>,
        @InjectRepository(ChronikLikeEntity)
        private readonly likeRepo: Repository<ChronikLikeEntity>,
        @InjectRepository(ChronikCommentEntity)
        private readonly commentRepo: Repository<ChronikCommentEntity>,
        @InjectRepository(ChronikCommentLikeEntity)
        private readonly commentLikeRepo: Repository<ChronikCommentLikeEntity>,
        @InjectRepository(ChronikHiddenEntity)
        private readonly hiddenRepo: Repository<ChronikHiddenEntity>,
        @InjectRepository(ChronikFollowingEntity)
        private readonly followingRepo: Repository<ChronikFollowingEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    async getEntries(
        currentUserId: string,
        query: ChronikQueryDto
    ): Promise<{ items: ChronikEntryDto[]; total: number }> {
        const limit = query.limit ?? 20;
        const offset = query.offset ?? 0;

        const qb = this.entryRepo
            .createQueryBuilder("entry")
            .leftJoinAndSelect("entry.author", "author")
            .orderBy("entry.createdAt", "DESC")
            .take(limit)
            .skip(offset);

        if (query.userId) {
            qb.where("entry.authorId = :userId", { userId: query.userId });

            if (query.userId === currentUserId) {
                // Own wall: see everything
            } else {
                // Check if current user follows the profile user
                const isFollowing = await this.followingRepo.findOne({
                    where: { followerId: currentUserId, followingId: query.userId }
                });

                if (isFollowing) {
                    qb.andWhere("entry.visibility IN (:...vis)", {
                        vis: ["public", "followers"]
                    });
                } else {
                    qb.andWhere("entry.visibility = :vis", { vis: "public" });
                }
            }
        } else if (query.feed) {
            // Entries from all followed users
            const followingRows = await this.followingRepo.find({
                where: { followerId: currentUserId },
                select: ["followingId"]
            });
            const followingIds = followingRows.map((f) => f.followingId);

            if (followingIds.length === 0) {
                return { items: [], total: 0 };
            }

            qb.where("entry.authorId IN (:...ids)", { ids: followingIds }).andWhere("entry.visibility IN (:...vis)", {
                vis: ["public", "followers"]
            });
        } else {
            // Global public wall
            qb.where("entry.visibility = :vis", { vis: "public" });
        }

        // Exclude entries hidden by current user
        const hiddenRows = await this.hiddenRepo.find({
            where: { userId: currentUserId },
            select: ["entryId"]
        });
        const hiddenEntryIds = new Set(hiddenRows.map((h) => h.entryId));

        if (hiddenEntryIds.size > 0) {
            qb.andWhere("entry.id NOT IN (:...hiddenIds)", {
                hiddenIds: [...hiddenEntryIds]
            });
        }

        const [entries, total] = await qb.getManyAndCount();

        if (entries.length === 0) {
            return { items: [], total };
        }

        // Load liked entries for current user in one query
        const entryIds = entries.map((e) => e.id);
        const likes = await this.likeRepo.find({
            where: { userId: currentUserId, entryId: In(entryIds) },
            select: ["entryId"]
        });
        const likedEntryIds = new Set(likes.map((l) => l.entryId));

        const items = entries.map((entry) => this.mapEntryToDto(entry, currentUserId, likedEntryIds, hiddenEntryIds));

        return { items, total };
    }

    async createEntry(authorId: string, dto: CreateEntryDto): Promise<ChronikEntryDto> {
        const entry = this.entryRepo.create({
            authorId,
            type: dto.type,
            content: dto.content,
            imageUrl: dto.imageUrl ?? null,
            linkUrl: dto.linkUrl ?? null,
            linkTitle: dto.linkTitle ?? null,
            linkDescription: dto.linkDescription ?? null,
            linkImageUrl: dto.linkImageUrl ?? null,
            linkDomain: dto.linkDomain ?? null,
            visibility: dto.visibility,
            likeCount: 0,
            commentCount: 0
        });

        const saved = await this.entryRepo.save(entry);

        const withAuthor = await this.entryRepo.findOne({
            where: { id: saved.id },
            relations: ["author"]
        });

        if (!withAuthor) {
            throw new NotFoundException("Entry not found after creation");
        }

        return this.mapEntryToDto(withAuthor, authorId, new Set<string>(), new Set<string>());
    }

    async deleteEntry(userId: string, entryId: string): Promise<void> {
        const entry = await this.entryRepo.findOne({ where: { id: entryId } });

        if (!entry) {
            throw new NotFoundException("Entry not found");
        }

        if (entry.authorId !== userId) {
            throw new ForbiddenException("You are not allowed to delete this entry");
        }

        await this.entryRepo.remove(entry);
    }

    async toggleLike(userId: string, entryId: string): Promise<{ liked: boolean; likeCount: number }> {
        const entry = await this.entryRepo.findOne({ where: { id: entryId } });

        if (!entry) {
            throw new NotFoundException("Entry not found");
        }

        const existing = await this.likeRepo.findOne({
            where: { entryId, userId }
        });

        let liked: boolean;

        if (existing) {
            await this.likeRepo.remove(existing);
            entry.likeCount = Math.max(0, entry.likeCount - 1);
            liked = false;
        } else {
            const like = this.likeRepo.create({ entryId, userId });
            await this.likeRepo.save(like);
            entry.likeCount = entry.likeCount + 1;
            liked = true;

            if (entry.authorId !== userId) {
                const liker = await this.userRepo.findOne({ where: { id: userId } });
                if (liker) {
                    await this.notificationsService.create(
                        entry.authorId,
                        "system",
                        "Neues Like",
                        `${liker.displayName} gefällt dein Beitrag.`,
                        "/chronik"
                    );
                }
            }
        }

        await this.entryRepo.save(entry);

        return { liked, likeCount: entry.likeCount };
    }

    async hideEntry(userId: string, entryId: string): Promise<void> {
        try {
            const hidden = this.hiddenRepo.create({ userId, entryId });
            await this.hiddenRepo.save(hidden);
        } catch {
            // Ignore duplicate constraint errors
        }
    }

    async unhideEntry(userId: string, entryId: string): Promise<void> {
        await this.hiddenRepo.delete({ userId, entryId });
    }

    async getComments(entryId: string, currentUserId: string): Promise<ChronikCommentDto[]> {
        // Load top-level comments
        const topLevelComments = await this.commentRepo.find({
            where: { entryId, parentId: IsNull() },
            relations: ["author"],
            order: { createdAt: "ASC" }
        });

        if (topLevelComments.length === 0) {
            return [];
        }

        const topLevelIds = topLevelComments.map((c) => c.id);

        // Load all replies for these top-level comments
        const allReplies = await this.commentRepo.find({
            where: { entryId, parentId: In(topLevelIds) },
            relations: ["author"],
            order: { createdAt: "ASC" }
        });

        // Load liked comment ids for current user in one query
        const allCommentIds = [...topLevelIds, ...allReplies.map((r) => r.id)];
        const commentLikes = await this.commentLikeRepo.find({
            where: { userId: currentUserId, commentId: In(allCommentIds) },
            select: ["commentId"]
        });
        const likedCommentIds = new Set(commentLikes.map((l) => l.commentId));

        // Group replies by parentId
        const repliesByParentId = new Map<string, ChronikCommentEntity[]>();
        for (const reply of allReplies) {
            if (reply.parentId) {
                const existing = repliesByParentId.get(reply.parentId) ?? [];
                existing.push(reply);
                repliesByParentId.set(reply.parentId, existing);
            }
        }

        return topLevelComments.map((comment) => {
            const replies = (repliesByParentId.get(comment.id) ?? []).map((reply) =>
                this.mapCommentToDto(reply, currentUserId, likedCommentIds, [])
            );
            return this.mapCommentToDto(comment, currentUserId, likedCommentIds, replies);
        });
    }

    async createComment(authorId: string, entryId: string, dto: CreateCommentDto): Promise<ChronikCommentDto> {
        const entry = await this.entryRepo.findOne({ where: { id: entryId } });

        if (!entry) {
            throw new NotFoundException("Entry not found");
        }

        const comment = this.commentRepo.create({
            entryId,
            authorId,
            content: dto.content,
            parentId: dto.parentId ?? null,
            likeCount: 0
        });

        const saved = await this.commentRepo.save(comment);

        entry.commentCount = entry.commentCount + 1;
        await this.entryRepo.save(entry);

        const author = await this.userRepo.findOne({ where: { id: authorId } });

        if (author) {
            // Notify entry author if not the same person
            if (entry.authorId !== authorId) {
                await this.notificationsService.create(
                    entry.authorId,
                    "system",
                    "Neuer Kommentar",
                    `${author.displayName} hat deinen Beitrag kommentiert.`,
                    "/chronik"
                );
            }

            // Notify parent comment author if this is a reply
            if (dto.parentId) {
                const parentComment = await this.commentRepo.findOne({
                    where: { id: dto.parentId }
                });
                if (parentComment && parentComment.authorId !== authorId) {
                    await this.notificationsService.create(
                        parentComment.authorId,
                        "system",
                        "Neue Antwort",
                        `${author.displayName} hat deinen Kommentar beantwortet.`,
                        "/chronik"
                    );
                }
            }
        }

        const withAuthor = await this.commentRepo.findOne({
            where: { id: saved.id },
            relations: ["author"]
        });

        if (!withAuthor) {
            throw new NotFoundException("Comment not found after creation");
        }

        return this.mapCommentToDto(withAuthor, authorId, new Set<string>(), []);
    }

    async deleteComment(userId: string, commentId: string): Promise<void> {
        const comment = await this.commentRepo.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        if (comment.authorId !== userId) {
            throw new ForbiddenException("You are not allowed to delete this comment");
        }

        const entry = await this.entryRepo.findOne({
            where: { id: comment.entryId }
        });

        await this.commentRepo.remove(comment);

        if (entry) {
            entry.commentCount = Math.max(0, entry.commentCount - 1);
            await this.entryRepo.save(entry);
        }
    }

    async toggleCommentLike(userId: string, commentId: string): Promise<{ liked: boolean; likeCount: number }> {
        const comment = await this.commentRepo.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        const existing = await this.commentLikeRepo.findOne({
            where: { commentId, userId }
        });

        let liked: boolean;

        if (existing) {
            await this.commentLikeRepo.remove(existing);
            comment.likeCount = Math.max(0, comment.likeCount - 1);
            liked = false;
        } else {
            const like = this.commentLikeRepo.create({ commentId, userId });
            await this.commentLikeRepo.save(like);
            comment.likeCount = comment.likeCount + 1;
            liked = true;
        }

        await this.commentRepo.save(comment);

        return { liked, likeCount: comment.likeCount };
    }

    async toggleFollow(
        followerId: string,
        followingId: string
    ): Promise<{ following: boolean; followerCount: number }> {
        const existing = await this.followingRepo.findOne({
            where: { followerId, followingId }
        });

        let following: boolean;

        if (existing) {
            await this.followingRepo.remove(existing);
            following = false;
        } else {
            const follow = this.followingRepo.create({ followerId, followingId });
            await this.followingRepo.save(follow);
            following = true;

            const follower = await this.userRepo.findOne({
                where: { id: followerId }
            });
            if (follower) {
                await this.notificationsService.create(
                    followingId,
                    "system",
                    "Neuer Follower",
                    `${follower.displayName} folgt dir jetzt.`,
                    "/chronik"
                );
            }
        }

        const followerCount = await this.followingRepo.count({
            where: { followingId }
        });

        return { following, followerCount };
    }

    async getFollowing(
        userId: string
    ): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
        const rows = await this.followingRepo.find({
            where: { followerId: userId },
            select: ["followingId"]
        });

        if (rows.length === 0) {
            return [];
        }

        const followingIds = rows.map((r) => r.followingId);
        const users = await this.userRepo.find({
            where: { id: In(followingIds) },
            select: ["id", "username", "displayName", "avatarUrl"]
        });

        return users.map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl ?? null
        }));
    }

    async getFollowers(
        userId: string
    ): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
        const rows = await this.followingRepo.find({
            where: { followingId: userId },
            select: ["followerId"]
        });

        if (rows.length === 0) {
            return [];
        }

        const followerIds = rows.map((r) => r.followerId);
        const users = await this.userRepo.find({
            where: { id: In(followerIds) },
            select: ["id", "username", "displayName", "avatarUrl"]
        });

        return users.map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl ?? null
        }));
    }

    async getProfileStats(profileUserId: string, currentUserId: string): Promise<ChronikProfileStats> {
        const isOwnProfile = profileUserId === currentUserId;

        const entryCountQuery = this.entryRepo
            .createQueryBuilder("entry")
            .where("entry.authorId = :userId", { userId: profileUserId });

        if (!isOwnProfile) {
            entryCountQuery.andWhere("entry.visibility = :vis", { vis: "public" });
        }

        const [entryCount, followerCount, followingCount, isFollowingRow] = await Promise.all([
            entryCountQuery.getCount(),
            this.followingRepo.count({ where: { followingId: profileUserId } }),
            this.followingRepo.count({ where: { followerId: profileUserId } }),
            this.followingRepo.findOne({
                where: { followerId: currentUserId, followingId: profileUserId }
            })
        ]);

        return {
            entryCount,
            followerCount,
            followingCount,
            isFollowing: isFollowingRow !== null
        };
    }

    private mapEntryToDto(
        entry: ChronikEntryEntity,
        currentUserId: string,
        likedEntryIds: Set<string>,
        hiddenEntryIds: Set<string>
    ): ChronikEntryDto {
        return {
            id: entry.id,
            authorId: entry.authorId,
            authorUsername: entry.author?.username ?? "",
            authorDisplayName: entry.author?.displayName ?? "",
            authorAvatar: entry.author?.avatarUrl ?? null,
            type: entry.type,
            content: entry.content,
            imageUrl: entry.imageUrl,
            linkUrl: entry.linkUrl,
            linkTitle: entry.linkTitle,
            linkDescription: entry.linkDescription,
            linkImageUrl: entry.linkImageUrl,
            linkDomain: entry.linkDomain,
            visibility: entry.visibility,
            likeCount: entry.likeCount,
            commentCount: entry.commentCount,
            isLiked: likedEntryIds.has(entry.id),
            isHidden: hiddenEntryIds.has(entry.id),
            canDelete: entry.authorId === currentUserId,
            createdAt: entry.createdAt.toISOString()
        };
    }

    private mapCommentToDto(
        comment: ChronikCommentEntity,
        currentUserId: string,
        likedCommentIds: Set<string>,
        replies: ChronikCommentDto[]
    ): ChronikCommentDto {
        return {
            id: comment.id,
            entryId: comment.entryId,
            authorId: comment.authorId,
            authorUsername: comment.author?.username ?? "",
            authorDisplayName: comment.author?.displayName ?? "",
            authorAvatar: comment.author?.avatarUrl ?? null,
            content: comment.content,
            parentId: comment.parentId,
            likeCount: comment.likeCount,
            isLiked: likedCommentIds.has(comment.id),
            canDelete: comment.authorId === currentUserId,
            createdAt: comment.createdAt.toISOString(),
            replies
        };
    }
}
