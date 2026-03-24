import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { ClipEntity } from "./entities/clip.entity";
import { ClipLikeEntity } from "./entities/clip-like.entity";
import { ClipViewEventEntity } from "./entities/clip-view-event.entity";

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface TrackViewDto {
    watchDurationMs?: number;
    completionPercent?: number;
    source?: string;
}

export interface ClipStatsResponse {
    clipId: string;
    title: string;
    totalViews: number;
    uniqueViewers: number;
    avgWatchDurationMs: number;
    avgCompletionPercent: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    likeRate: number;
    commentRate: number;
    shareRate: number;
    engagementScore: number;
    viewsBySource: Record<string, number>;
    viewsOverTime: { date: string; views: number }[];
    createdAt: string;
}

export interface AuthorStatsResponse {
    authorId: string;
    authorName: string;
    totalClips: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgCompletionPercent: number;
    avgEngagementScore: number;
    topClips: { clipId: string; title: string; viewCount: number; engagementScore: number }[];
}

export interface TrendingClipResponse {
    clipId: string;
    title: string;
    authorName: string;
    thumbnailUrl: string | null;
    trendingScore: number;
    recentViews: number;
    recentLikes: number;
    viewCount: number;
    likeCount: number;
}

export interface RecommendationSignals {
    clipId: string;
    engagementScore: number;
    avgCompletionPercent: number;
    likeRate: number;
    commentRate: number;
    shareRate: number;
    trendingScore: number;
    tags: string[];
    duration: number;
    ageHours: number;
}

@Injectable()
export class ClipStatsService {
    private readonly logger = new Logger(ClipStatsService.name);

    constructor(
        @InjectRepository(ClipViewEventEntity)
        private readonly viewEventRepo: Repository<ClipViewEventEntity>,
        @InjectRepository(ClipEntity)
        private readonly clipRepo: Repository<ClipEntity>,
        @InjectRepository(ClipLikeEntity)
        private readonly likeRepo: Repository<ClipLikeEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) {}

    // ── Track view event ─────────────────────────────────────────

    async trackView(clipId: string, userId: string | undefined, dto: TrackViewDto): Promise<{ tracked: boolean }> {
        const clip = await this.clipRepo.findOneBy({ id: clipId });
        if (!clip) throw new NotFoundException("Clip not found");

        const event = this.viewEventRepo.create({
            clipId,
            userId: userId || undefined,
            watchDurationMs: Math.max(0, dto.watchDurationMs ?? 0),
            completionPercent: Math.min(100, Math.max(0, dto.completionPercent ?? 0)),
            source: dto.source ?? "feed"
        });

        await this.viewEventRepo.save(event);

        await this.clipRepo.increment({ id: clipId }, "viewCount", 1);

        return { tracked: true };
    }

    // ── Single clip stats ────────────────────────────────────────

    async getClipStats(clipId: string): Promise<ClipStatsResponse> {
        const clip = await this.clipRepo.findOneBy({ id: clipId });
        if (!clip) throw new NotFoundException("Clip not found");

        const [viewAggregates, uniqueViewers, viewsBySource, viewsOverTime] = await Promise.all([
            this.viewEventRepo
                .createQueryBuilder("v")
                .select("COUNT(*)", "totalViews")
                .addSelect("COALESCE(AVG(v.watch_duration_ms), 0)", "avgWatchDurationMs")
                .addSelect("COALESCE(AVG(v.completion_percent), 0)", "avgCompletionPercent")
                .where("v.clip_id = :clipId", { clipId })
                .getRawOne<{ totalViews: string; avgWatchDurationMs: string; avgCompletionPercent: string }>(),

            this.viewEventRepo
                .createQueryBuilder("v")
                .select("COUNT(DISTINCT v.user_id)", "count")
                .where("v.clip_id = :clipId", { clipId })
                .andWhere("v.user_id IS NOT NULL")
                .getRawOne<{ count: string }>(),

            this.viewEventRepo
                .createQueryBuilder("v")
                .select("v.source", "source")
                .addSelect("COUNT(*)", "count")
                .where("v.clip_id = :clipId", { clipId })
                .groupBy("v.source")
                .getRawMany<{ source: string; count: string }>(),

            this.viewEventRepo
                .createQueryBuilder("v")
                .select("DATE(v.created_at)", "date")
                .addSelect("COUNT(*)", "views")
                .where("v.clip_id = :clipId", { clipId })
                .andWhere("v.created_at >= NOW() - INTERVAL '30 days'")
                .groupBy("DATE(v.created_at)")
                .orderBy("DATE(v.created_at)", "ASC")
                .getRawMany<{ date: string; views: string }>()
        ]);

        const totalViews = Math.max(Number(viewAggregates?.totalViews ?? 0), clip.viewCount);
        const likeRate = totalViews > 0 ? clip.likeCount / totalViews : 0;
        const commentRate = totalViews > 0 ? clip.commentCount / totalViews : 0;
        const shareRate = totalViews > 0 ? clip.shareCount / totalViews : 0;
        const avgCompletion = Number(viewAggregates?.avgCompletionPercent ?? 0);
        const engagementScore = this.computeEngagementScore(totalViews, clip.likeCount, clip.commentCount, clip.shareCount, avgCompletion);

        const sourceMap: Record<string, number> = {};
        for (const row of viewsBySource) {
            sourceMap[row.source] = Number(row.count);
        }

        return {
            clipId,
            title: clip.title,
            totalViews,
            uniqueViewers: Number(uniqueViewers?.count ?? 0),
            avgWatchDurationMs: Math.round(Number(viewAggregates?.avgWatchDurationMs ?? 0)),
            avgCompletionPercent: Math.round(avgCompletion),
            likeCount: clip.likeCount,
            commentCount: clip.commentCount,
            shareCount: clip.shareCount,
            likeRate: Math.round(likeRate * 10000) / 100,
            commentRate: Math.round(commentRate * 10000) / 100,
            shareRate: Math.round(shareRate * 10000) / 100,
            engagementScore: Math.round(engagementScore * 100) / 100,
            viewsBySource: sourceMap,
            viewsOverTime: viewsOverTime.map((r) => ({ date: r.date, views: Number(r.views) })),
            createdAt: clip.createdAt.toISOString()
        };
    }

    // ── Author stats ─────────────────────────────────────────────

    async getAuthorStats(authorId: string): Promise<AuthorStatsResponse> {
        const user = await this.userRepo.findOneBy({ id: authorId });
        if (!user) throw new NotFoundException("User not found");

        const clips = await this.clipRepo.find({ where: { authorId, isPublished: true } });
        if (clips.length === 0) {
            return {
                authorId,
                authorName: user.displayName,
                totalClips: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalShares: 0,
                avgCompletionPercent: 0,
                avgEngagementScore: 0,
                topClips: []
            };
        }

        const clipIds = clips.map((c) => c.id);
        const avgCompletion = await this.viewEventRepo
            .createQueryBuilder("v")
            .select("COALESCE(AVG(v.completion_percent), 0)", "avg")
            .where("v.clip_id IN (:...clipIds)", { clipIds })
            .getRawOne<{ avg: string }>();

        const totalViews = clips.reduce((sum, c) => sum + c.viewCount, 0);
        const totalLikes = clips.reduce((sum, c) => sum + c.likeCount, 0);
        const totalComments = clips.reduce((sum, c) => sum + c.commentCount, 0);
        const totalShares = clips.reduce((sum, c) => sum + c.shareCount, 0);
        const avgComp = Number(avgCompletion?.avg ?? 0);

        const scored = clips.map((c) => ({
            clipId: c.id,
            title: c.title,
            viewCount: c.viewCount,
            engagementScore: this.computeEngagementScore(c.viewCount, c.likeCount, c.commentCount, c.shareCount, avgComp)
        }));
        scored.sort((a, b) => b.engagementScore - a.engagementScore);

        const avgEngagement = scored.reduce((sum, s) => sum + s.engagementScore, 0) / scored.length;

        return {
            authorId,
            authorName: user.displayName,
            totalClips: clips.length,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            avgCompletionPercent: Math.round(avgComp),
            avgEngagementScore: Math.round(avgEngagement * 100) / 100,
            topClips: scored.slice(0, 10).map((s) => ({
                clipId: s.clipId,
                title: s.title,
                viewCount: s.viewCount,
                engagementScore: Math.round(s.engagementScore * 100) / 100
            }))
        };
    }

    // ── Trending clips ───────────────────────────────────────────

    async getTrending(limit = 10): Promise<TrendingClipResponse[]> {
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const recentViews = await this.viewEventRepo
            .createQueryBuilder("v")
            .select("v.clip_id", "clipId")
            .addSelect("COUNT(*)", "recentViews")
            .where("v.created_at >= :since", { since })
            .groupBy("v.clip_id")
            .orderBy("COUNT(*)", "DESC")
            .limit(limit * 2)
            .getRawMany<{ clipId: string; recentViews: string }>();

        if (recentViews.length === 0) return [];

        const clipIds = recentViews.map((r) => r.clipId);
        const recentLikes = await this.likeRepo
            .createQueryBuilder("l")
            .select("l.clip_id", "clipId")
            .addSelect("COUNT(*)", "count")
            .where("l.clip_id IN (:...clipIds)", { clipIds })
            .andWhere("l.created_at >= :since", { since })
            .groupBy("l.clip_id")
            .getRawMany<{ clipId: string; count: string }>();

        const likeMap = new Map(recentLikes.map((r) => [r.clipId, Number(r.count)]));

        const clips = await this.clipRepo
            .createQueryBuilder("c")
            .where("c.id IN (:...clipIds)", { clipIds })
            .andWhere("c.is_published = true")
            .getMany();

        const clipMap = new Map(clips.map((c) => [c.id, c]));
        const authorIds = [...new Set(clips.map((c) => c.authorId))];
        const users = await this.userRepo.createQueryBuilder("u").where("u.id IN (:...authorIds)", { authorIds }).getMany();
        const userMap = new Map(users.map((u) => [u.id, u]));

        const trending: TrendingClipResponse[] = [];
        for (const row of recentViews) {
            const clip = clipMap.get(row.clipId);
            if (!clip) continue;
            const author = userMap.get(clip.authorId);
            const rv = Number(row.recentViews);
            const rl = likeMap.get(row.clipId) ?? 0;
            const trendingScore = rv * 1 + rl * 5;

            trending.push({
                clipId: clip.id,
                title: clip.title,
                authorName: author?.displayName ?? "Unknown",
                thumbnailUrl: clip.thumbnailUrl ?? null,
                trendingScore,
                recentViews: rv,
                recentLikes: rl,
                viewCount: clip.viewCount,
                likeCount: clip.likeCount
            });
        }

        trending.sort((a, b) => b.trendingScore - a.trendingScore);
        return trending.slice(0, limit);
    }

    // ── Recommendation signals ───────────────────────────────────

    async getRecommendationSignals(clipId: string): Promise<RecommendationSignals> {
        const clip = await this.clipRepo.findOneBy({ id: clipId });
        if (!clip) throw new NotFoundException("Clip not found");

        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const [avgCompletion, recentViews] = await Promise.all([
            this.viewEventRepo
                .createQueryBuilder("v")
                .select("COALESCE(AVG(v.completion_percent), 0)", "avg")
                .where("v.clip_id = :clipId", { clipId })
                .getRawOne<{ avg: string }>(),

            this.viewEventRepo
                .createQueryBuilder("v")
                .select("COUNT(*)", "count")
                .where("v.clip_id = :clipId", { clipId })
                .andWhere("v.created_at >= :since", { since })
                .getRawOne<{ count: string }>()
        ]);

        const totalViews = Math.max(clip.viewCount, 1);
        const avgComp = Number(avgCompletion?.avg ?? 0);
        const likeRate = clip.likeCount / totalViews;
        const commentRate = clip.commentCount / totalViews;
        const shareRate = clip.shareCount / totalViews;
        const engagementScore = this.computeEngagementScore(totalViews, clip.likeCount, clip.commentCount, clip.shareCount, avgComp);
        const rv = Number(recentViews?.count ?? 0);
        const trendingScore = rv * 1 + clip.likeCount * 0.5;
        const ageHours = (Date.now() - clip.createdAt.getTime()) / (1000 * 60 * 60);

        return {
            clipId,
            engagementScore: Math.round(engagementScore * 100) / 100,
            avgCompletionPercent: Math.round(avgComp),
            likeRate: Math.round(likeRate * 10000) / 100,
            commentRate: Math.round(commentRate * 10000) / 100,
            shareRate: Math.round(shareRate * 10000) / 100,
            trendingScore: Math.round(trendingScore * 100) / 100,
            tags: clip.tags,
            duration: clip.duration,
            ageHours: Math.round(ageHours * 10) / 10
        };
    }

    // ── Engagement score formula ─────────────────────────────────

    private computeEngagementScore(views: number, likes: number, comments: number, shares: number, avgCompletionPercent: number): number {
        const v = Math.max(views, 1);
        const likeWeight = 2;
        const commentWeight = 3;
        const shareWeight = 4;
        const completionWeight = 0.5;

        return (likes * likeWeight + comments * commentWeight + shares * shareWeight) / v * 100 + (avgCompletionPercent * completionWeight);
    }
}
