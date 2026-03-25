import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";

import { ActivityService } from "../activity/activity.service";
import { GamificationService } from "../gamification/gamification.service";
import { MediaService } from "../media/media.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity } from "../user/entities/user.entity";
import { ClipEntity } from "./entities/clip.entity";
import { ClipCommentEntity } from "./entities/clip-comment.entity";
import { ClipFollowEntity } from "./entities/clip-follow.entity";
import { ClipLikeEntity } from "./entities/clip-like.entity";

export interface CreateClipDto {
    title: string;
    description?: string;
    videoUrl: string;
    videoMediaId?: string;
    thumbnailUrl?: string;
    thumbnailMediaId?: string;
    tags?: string[];
    duration?: number;
    isPublished?: boolean;
}

export interface UpdateClipDto {
    title?: string;
    description?: string;
    videoUrl?: string;
    videoMediaId?: string;
    thumbnailUrl?: string;
    thumbnailMediaId?: string;
    tags?: string[];
    duration?: number;
    isPublished?: boolean;
}

export interface CreateCommentDto {
    content: string;
    parentId?: string;
}

export interface EnrichedClip {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | undefined;
    title: string;
    description: string | undefined;
    videoUrl: string;
    thumbnailUrl: string | undefined;
    tags: string[];
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    duration: number;
    isPublished: boolean;
    isLiked: boolean;
    isFollowing: boolean;
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EnrichedComment {
    id: string;
    clipId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | undefined;
    content: string;
    parentId: string | undefined;
    replies: EnrichedComment[];
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class ClipsService {
    constructor(
        @InjectRepository(ClipEntity)
        private readonly clipRepo: Repository<ClipEntity>,
        @InjectRepository(ClipCommentEntity)
        private readonly commentRepo: Repository<ClipCommentEntity>,
        @InjectRepository(ClipLikeEntity)
        private readonly likeRepo: Repository<ClipLikeEntity>,
        @InjectRepository(ClipFollowEntity)
        private readonly followRepo: Repository<ClipFollowEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService,
        private readonly mediaService: MediaService,
        private readonly activityService: ActivityService,
        private readonly notificationsService: NotificationsService
    ) {}

    async getFeed(
        userId: string | undefined,
        page: number,
        limit: number
    ): Promise<{ data: EnrichedClip[]; total: number }> {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(50, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;

        const query = this.clipRepo
            .createQueryBuilder("clip")
            .where("clip.is_published = :published", { published: true })
            .orderBy("clip.view_count * 0.1 + clip.like_count * 2 + clip.comment_count * 3", "DESC")
            .addOrderBy("clip.created_at", "DESC")
            .skip(skip)
            .take(safeLimit);

        const [clips, total] = await query.getManyAndCount();

        const enriched = await Promise.all(clips.map((clip) => this.enrichClip(clip, userId)));

        return { data: enriched, total };
    }

    async getClipById(id: string, userId: string | undefined): Promise<EnrichedClip> {
        const clip = await this.clipRepo.findOne({ where: { id } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }
        return this.enrichClip(clip, userId);
    }

    async getClipsByUser(
        authorId: string,
        userId: string | undefined,
        page: number,
        limit: number
    ): Promise<{ data: EnrichedClip[]; total: number }> {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(50, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;

        const isOwner = userId === authorId;

        const where: Record<string, unknown> = { authorId };
        if (!isOwner) {
            where["isPublished"] = true;
        }

        const [clips, total] = await this.clipRepo.findAndCount({
            where,
            order: { createdAt: "DESC" },
            skip,
            take: safeLimit
        });

        const enriched = await Promise.all(clips.map((clip) => this.enrichClip(clip, userId)));

        return { data: enriched, total };
    }

    async createClip(authorId: string, dto: CreateClipDto): Promise<EnrichedClip> {
        const clip = this.clipRepo.create({
            authorId,
            title: dto.title,
            description: dto.description,
            videoUrl: dto.videoUrl,
            thumbnailUrl: dto.thumbnailUrl,
            tags: dto.tags ?? [],
            duration: dto.duration ?? 0,
            isPublished: dto.isPublished ?? false
        });

        if (dto.videoMediaId) {
            const asset = await this.mediaService.findById(dto.videoMediaId);
            clip.videoUrl = asset.url;
            clip.videoMediaId = dto.videoMediaId;
        }
        if (dto.thumbnailMediaId) {
            const asset = await this.mediaService.findById(dto.thumbnailMediaId);
            clip.thumbnailUrl = asset.url;
            clip.thumbnailMediaId = dto.thumbnailMediaId;
        }

        const saved = await this.clipRepo.save(clip);
        void this.gamificationService.awardXp(authorId, "create_clip", saved.id);
        void this.activityService.create(authorId, "clip_uploaded", `Neuer Clip: "${saved.title}"`, undefined, `/clips`);
        return this.enrichClip(saved, authorId);
    }

    async updateClip(id: string, userId: string, isAdmin: boolean, dto: UpdateClipDto): Promise<EnrichedClip> {
        const clip = await this.clipRepo.findOne({ where: { id } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }
        if (clip.authorId !== userId && !isAdmin) {
            throw new ForbiddenException("You are not allowed to update this clip");
        }

        Object.assign(clip, dto);
        const saved = await this.clipRepo.save(clip);
        return this.enrichClip(saved, userId);
    }

    async deleteClip(id: string, userId: string, isAdmin: boolean): Promise<{ deleted: boolean }> {
        const clip = await this.clipRepo.findOne({ where: { id } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }
        if (clip.authorId !== userId && !isAdmin) {
            throw new ForbiddenException("You are not allowed to delete this clip");
        }

        await this.likeRepo.delete({ clipId: id });
        await this.commentRepo.delete({ clipId: id });
        await this.clipRepo.remove(clip);

        return { deleted: true };
    }

    async toggleLike(clipId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
        const clip = await this.clipRepo.findOne({ where: { id: clipId } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }

        const existing = await this.likeRepo.findOne({ where: { clipId, userId } });

        if (existing) {
            await this.likeRepo.remove(existing);
            clip.likeCount = Math.max(0, clip.likeCount - 1);
            await this.clipRepo.save(clip);
            return { liked: false, likeCount: clip.likeCount };
        }

        const like = this.likeRepo.create({ clipId, userId });
        await this.likeRepo.save(like);
        clip.likeCount += 1;
        await this.clipRepo.save(clip);

        // Notify clip author about the like (unless self-like)
        if (clip.authorId !== userId) {
            void this.notificationsService.create(
                clip.authorId,
                "clip_liked",
                "Clip geliked",
                `Jemand hat deinen Clip "${clip.title}" geliked.`,
                `/clips`
            );
        }

        return { liked: true, likeCount: clip.likeCount };
    }

    async incrementView(clipId: string): Promise<{ viewCount: number }> {
        const clip = await this.clipRepo.findOne({ where: { id: clipId } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }

        clip.viewCount += 1;
        await this.clipRepo.save(clip);
        return { viewCount: clip.viewCount };
    }

    async incrementShare(clipId: string): Promise<{ shareCount: number }> {
        const clip = await this.clipRepo.findOne({ where: { id: clipId } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }

        clip.shareCount += 1;
        await this.clipRepo.save(clip);
        return { shareCount: clip.shareCount };
    }

    async getComments(clipId: string): Promise<EnrichedComment[]> {
        const comments = await this.commentRepo.find({
            where: { clipId },
            order: { createdAt: "ASC" }
        });

        const authorIds = [...new Set(comments.map((c) => c.authorId))];
        const authors = authorIds.length > 0 ? await this.userRepo.find({ where: { id: In(authorIds) } }) : [];
        const authorMap = new Map(authors.map((a) => [a.id, a]));

        const enrichComment = (comment: ClipCommentEntity): EnrichedComment => {
            const author = authorMap.get(comment.authorId);
            return {
                id: comment.id,
                clipId: comment.clipId,
                authorId: comment.authorId,
                authorName: author?.displayName ?? "Unknown",
                authorAvatar: author?.avatarUrl,
                content: comment.content,
                parentId: comment.parentId,
                replies: [],
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString()
            };
        };

        const topLevel: EnrichedComment[] = [];
        const replyMap = new Map<string, EnrichedComment[]>();

        for (const comment of comments) {
            const enriched = enrichComment(comment);
            if (!comment.parentId) {
                topLevel.push(enriched);
            } else {
                const existing = replyMap.get(comment.parentId) ?? [];
                existing.push(enriched);
                replyMap.set(comment.parentId, existing);
            }
        }

        for (const item of topLevel) {
            item.replies = replyMap.get(item.id) ?? [];
        }

        return topLevel;
    }

    async addComment(clipId: string, userId: string, dto: CreateCommentDto): Promise<EnrichedComment> {
        const clip = await this.clipRepo.findOne({ where: { id: clipId } });
        if (!clip) {
            throw new NotFoundException("Clip not found");
        }

        const comment = this.commentRepo.create({
            clipId,
            authorId: userId,
            content: dto.content,
            parentId: dto.parentId
        });

        const saved = await this.commentRepo.save(comment);

        clip.commentCount += 1;
        await this.clipRepo.save(clip);

        // Notify clip author about the comment (unless self-comment)
        if (clip.authorId !== userId) {
            void this.notificationsService.create(
                clip.authorId,
                "clip_commented",
                "Neuer Kommentar",
                `Jemand hat deinen Clip "${clip.title}" kommentiert.`,
                `/clips`
            );
        }

        const author = await this.userRepo.findOne({ where: { id: userId } });

        return {
            id: saved.id,
            clipId: saved.clipId,
            authorId: saved.authorId,
            authorName: author?.displayName ?? "Unknown",
            authorAvatar: author?.avatarUrl,
            content: saved.content,
            parentId: saved.parentId,
            replies: [],
            createdAt: saved.createdAt.toISOString(),
            updatedAt: saved.updatedAt.toISOString()
        };
    }

    async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<{ deleted: boolean }> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) {
            throw new NotFoundException("Comment not found");
        }
        if (comment.authorId !== userId && !isAdmin) {
            throw new ForbiddenException("You are not allowed to delete this comment");
        }

        // Delete child replies first
        await this.commentRepo.delete({ parentId: id });
        await this.commentRepo.remove(comment);

        const clip = await this.clipRepo.findOne({ where: { id: comment.clipId } });
        if (clip) {
            clip.commentCount = Math.max(0, clip.commentCount - 1);
            await this.clipRepo.save(clip);
        }

        return { deleted: true };
    }

    async toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
        if (followerId === followingId) {
            throw new ForbiddenException("You cannot follow yourself");
        }

        const existing = await this.followRepo.findOne({
            where: { followerId, followingId }
        });

        if (existing) {
            await this.followRepo.remove(existing);
            return { following: false };
        }

        const follow = this.followRepo.create({ followerId, followingId });
        await this.followRepo.save(follow);
        return { following: true };
    }

    private async enrichClip(clip: ClipEntity, userId: string | undefined): Promise<EnrichedClip> {
        const author = await this.userRepo.findOne({ where: { id: clip.authorId } });

        let isLiked = false;
        let isFollowing = false;
        const isOwner = userId === clip.authorId;

        if (userId) {
            const like = await this.likeRepo.findOne({
                where: { clipId: clip.id, userId }
            });
            isLiked = !!like;

            if (!isOwner) {
                const follow = await this.followRepo.findOne({
                    where: { followerId: userId, followingId: clip.authorId }
                });
                isFollowing = !!follow;
            }
        }

        return {
            id: clip.id,
            authorId: clip.authorId,
            authorName: author?.displayName ?? "Unknown",
            authorAvatar: author?.avatarUrl,
            title: clip.title,
            description: clip.description,
            videoUrl: clip.videoUrl,
            thumbnailUrl: clip.thumbnailUrl,
            tags: clip.tags,
            viewCount: clip.viewCount,
            likeCount: clip.likeCount,
            commentCount: clip.commentCount,
            shareCount: clip.shareCount,
            duration: clip.duration,
            isPublished: clip.isPublished,
            isLiked,
            isFollowing,
            isOwner,
            createdAt: clip.createdAt.toISOString(),
            updatedAt: clip.updatedAt.toISOString()
        };
    }
}
