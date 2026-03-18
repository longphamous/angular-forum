import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { ForumEntity } from "../forum/entities/forum.entity";
import { ForumPostEntity } from "../forum/entities/post.entity";
import { ForumThreadEntity } from "../forum/entities/thread.entity";
import { GamificationService } from "../gamification/gamification.service";
import { UserXpData } from "../gamification/level.config";
import { UserEntity } from "../user/entities/user.entity";
import { FeaturedThreadEntity } from "./entities/featured-thread.entity";
import {
    AddFeaturedDto,
    FeaturedThreadDto,
    FeedSort,
    HotThreadDto,
    PaginatedFeedDto,
    ThreadSearchResultDto,
    UpdateFeaturedDto
} from "./models/feed.model";

interface AuthorInfo {
    displayName: string;
    avatarUrl?: string;
    xpData?: UserXpData;
}

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(FeaturedThreadEntity)
        private readonly featuredRepo: Repository<FeaturedThreadEntity>,
        @InjectRepository(ForumThreadEntity)
        private readonly threadRepo: Repository<ForumThreadEntity>,
        @InjectRepository(ForumPostEntity)
        private readonly postRepo: Repository<ForumPostEntity>,
        @InjectRepository(ForumEntity)
        private readonly forumRepo: Repository<ForumEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService
    ) {}

    // ─── Public ───────────────────────────────────────────────────────────────

    async getFeatured(): Promise<FeaturedThreadDto[]> {
        const featured = await this.featuredRepo.find({
            where: { isActive: true },
            order: { position: "ASC" }
        });
        if (!featured.length) return [];

        const threadIds = featured.map((f) => f.threadId);
        const threads = await this.threadRepo.find({ where: { id: In(threadIds) }, relations: ["forum"] });
        const threadMap = new Map(threads.map((t) => [t.id, t]));

        const authorIds = [...new Set(threads.map((t) => t.authorId))];
        const authorMap = await this.loadAuthorMap(authorIds);

        return featured
            .filter((f) => threadMap.has(f.threadId))
            .map((f) => {
                const t = threadMap.get(f.threadId)!;
                const author = authorMap.get(t.authorId);
                return this.toFeaturedDto(f, t, author);
            });
    }

    async getHotFeed(page: number, limit: number, sort: FeedSort): Promise<PaginatedFeedDto> {
        const skip = (page - 1) * limit;

        const qb = this.threadRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.forum", "f")
            .where("t.deleted_at IS NULL");

        switch (sort) {
            case "new":
                qb.orderBy("t.createdAt", "DESC");
                break;
            case "top":
                qb.orderBy("t.replyCount", "DESC").addOrderBy("t.viewCount", "DESC");
                break;
            case "hot":
            default:
                qb.addSelect("t.view_count + t.reply_count * 3", "hot_score").orderBy("hot_score", "DESC");
                break;
        }

        qb.skip(skip).take(limit);

        const [threads, total] = await qb.getManyAndCount();

        const threadIds = threads.map((t) => t.id);
        const [authorIds, firstPosts] = await Promise.all([
            Promise.resolve([...new Set(threads.map((t) => t.authorId))]),
            threadIds.length
                ? this.postRepo.find({
                      where: { threadId: In(threadIds), isFirstPost: true },
                      select: ["threadId", "content"]
                  })
                : Promise.resolve([])
        ]);
        const authorMap = await this.loadAuthorMap(authorIds);
        const postMap = new Map(firstPosts.map((p) => [p.threadId, p]));

        const data = threads.map((t) => {
            const author = authorMap.get(t.authorId);
            const post = postMap.get(t.id);
            return this.toHotDto(t, author, post);
        });

        return { data, total, page, limit };
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    async getAdminFeatured(): Promise<FeaturedThreadDto[]> {
        const featured = await this.featuredRepo.find({ order: { position: "ASC" } });
        if (!featured.length) return [];

        const threadIds = featured.map((f) => f.threadId);
        const threads = await this.threadRepo.find({ where: { id: In(threadIds) }, relations: ["forum"] });
        const threadMap = new Map(threads.map((t) => [t.id, t]));

        const authorIds = [...new Set(threads.map((t) => t.authorId))];
        const authorMap = await this.loadAuthorMap(authorIds);

        return featured
            .filter((f) => threadMap.has(f.threadId))
            .map((f) => {
                const t = threadMap.get(f.threadId)!;
                const author = authorMap.get(t.authorId);
                return this.toFeaturedDto(f, t, author);
            });
    }

    async addFeatured(dto: AddFeaturedDto): Promise<FeaturedThreadDto> {
        const thread = await this.threadRepo.findOne({ where: { id: dto.threadId }, relations: ["forum"] });
        if (!thread) throw new NotFoundException(`Thread "${dto.threadId}" not found`);

        const maxPosition = await this.featuredRepo.maximum("position");
        const position = dto.position ?? (maxPosition ?? -1) + 1;

        const entity = this.featuredRepo.create({ threadId: dto.threadId, position, isActive: true });
        const saved = await this.featuredRepo.save(entity);

        const authorMap = await this.loadAuthorMap([thread.authorId]);
        return this.toFeaturedDto(saved, thread, authorMap.get(thread.authorId));
    }

    async updateFeatured(id: string, dto: UpdateFeaturedDto): Promise<FeaturedThreadDto> {
        const entity = await this.featuredRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Featured entry "${id}" not found`);

        if (dto.position !== undefined) entity.position = dto.position;
        if (dto.isActive !== undefined) entity.isActive = dto.isActive;

        const saved = await this.featuredRepo.save(entity);
        const thread = await this.threadRepo.findOne({ where: { id: saved.threadId }, relations: ["forum"] });
        if (!thread) throw new NotFoundException(`Thread "${saved.threadId}" not found`);

        const authorMap = await this.loadAuthorMap([thread.authorId]);
        return this.toFeaturedDto(saved, thread, authorMap.get(thread.authorId));
    }

    async removeFeatured(id: string): Promise<void> {
        const entity = await this.featuredRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Featured entry "${id}" not found`);
        await this.featuredRepo.remove(entity);
    }

    async searchThreads(q: string, limit = 20): Promise<ThreadSearchResultDto[]> {
        const threads = await this.threadRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.forum", "f")
            .where("t.deleted_at IS NULL")
            .andWhere("LOWER(t.title) LIKE :q", { q: `%${q.toLowerCase()}%` })
            .orderBy("t.createdAt", "DESC")
            .take(limit)
            .getMany();

        return threads.map((t) => ({
            id: t.id,
            title: t.title,
            forumName: t.forum?.name ?? "—",
            viewCount: t.viewCount,
            replyCount: t.replyCount
        }));
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private async loadAuthorMap(authorIds: string[]): Promise<Map<string, AuthorInfo>> {
        if (!authorIds.length) return new Map();

        const [users, xpMap] = await Promise.all([
            this.userRepo.find({ where: { id: In(authorIds) }, select: ["id", "displayName", "avatarUrl"] }),
            this.gamificationService.getUserXpDataBatch(authorIds)
        ]);
        return new Map(
            users.map((u) => [u.id, { displayName: u.displayName, avatarUrl: u.avatarUrl, xpData: xpMap.get(u.id) }])
        );
    }

    private toFeaturedDto(f: FeaturedThreadEntity, t: ForumThreadEntity, author?: AuthorInfo): FeaturedThreadDto {
        return {
            id: f.id,
            threadId: t.id,
            position: f.position,
            isActive: f.isActive,
            title: t.title,
            slug: t.slug,
            tags: t.tags ?? [],
            viewCount: t.viewCount,
            replyCount: t.replyCount,
            authorId: t.authorId,
            authorName: author?.displayName ?? t.authorId.slice(0, 8),
            authorAvatarUrl: author?.avatarUrl,
            authorLevel: author?.xpData?.level ?? 1,
            authorLevelName: author?.xpData?.levelName ?? "Neuling",
            forumId: t.forumId,
            forumName: t.forum?.name ?? "—",
            createdAt: t.createdAt.toISOString(),
            lastPostAt: t.lastPostAt?.toISOString()
        };
    }

    private toHotDto(t: ForumThreadEntity, author?: AuthorInfo, firstPost?: ForumPostEntity): HotThreadDto {
        const hotScore = t.viewCount + t.replyCount * 3;
        return {
            id: t.id,
            forumId: t.forumId,
            forumName: t.forum?.name ?? "—",
            title: t.title,
            slug: t.slug,
            tags: t.tags ?? [],
            isPinned: t.isPinned,
            isLocked: t.isLocked,
            authorId: t.authorId,
            authorName: author?.displayName ?? t.authorId.slice(0, 8),
            authorAvatarUrl: author?.avatarUrl,
            authorLevel: author?.xpData?.level ?? 1,
            authorLevelName: author?.xpData?.levelName ?? "Neuling",
            viewCount: t.viewCount,
            replyCount: t.replyCount,
            hotScore,
            excerpt: firstPost ? this.toExcerpt(firstPost.content) : undefined,
            previewImageUrl: firstPost ? this.extractFirstImage(firstPost.content) : undefined,
            createdAt: t.createdAt.toISOString(),
            lastPostAt: t.lastPostAt?.toISOString()
        };
    }

    private toExcerpt(html: string, maxLength = 220): string {
        const text = html
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, " ")
            .trim();
        return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + "…" : text;
    }

    private extractFirstImage(html: string): string | undefined {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        return match?.[1];
    }
}
