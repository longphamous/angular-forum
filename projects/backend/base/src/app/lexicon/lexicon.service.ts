import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { GamificationService } from "../gamification/gamification.service";
import { MediaService } from "../media/media.service";
import { UserEntity } from "../user/entities/user.entity";
import {
    ArticleQueryDto,
    CreateArticleDto,
    CreateCategoryDto,
    CreateCommentDto,
    ModerateArticleDto,
    ResolveReportDto,
    UpdateArticleDto,
    UpdateTermsDto
} from "./dto/lexicon.dto";
import { LexiconArticleEntity, LexiconArticleStatus } from "./entities/lexicon-article.entity";
import { LexiconArticleVersionEntity } from "./entities/lexicon-article-version.entity";
import { LexiconCategoryEntity } from "./entities/lexicon-category.entity";
import { LexiconCommentEntity } from "./entities/lexicon-comment.entity";
import { LexiconReportEntity } from "./entities/lexicon-report.entity";
import { LexiconTermsEntity } from "./entities/lexicon-terms.entity";

export interface EnrichedComment {
    id: string;
    articleId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: EnrichedComment[];
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class LexiconService {
    constructor(
        @InjectRepository(LexiconCategoryEntity)
        private readonly categoryRepo: Repository<LexiconCategoryEntity>,
        @InjectRepository(LexiconArticleEntity)
        private readonly articleRepo: Repository<LexiconArticleEntity>,
        @InjectRepository(LexiconArticleVersionEntity)
        private readonly versionRepo: Repository<LexiconArticleVersionEntity>,
        @InjectRepository(LexiconCommentEntity)
        private readonly commentRepo: Repository<LexiconCommentEntity>,
        @InjectRepository(LexiconReportEntity)
        private readonly reportRepo: Repository<LexiconReportEntity>,
        @InjectRepository(LexiconTermsEntity)
        private readonly termsRepo: Repository<LexiconTermsEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService,
        private readonly mediaService: MediaService
    ) {}

    // ── Categories ──────────────────────────────────────────────

    async getCategories(): Promise<object[]> {
        const cats = await this.categoryRepo.find({ where: { isActive: true }, order: { position: "ASC", name: "ASC" } });
        return Promise.all(
            cats.map(async (c) => {
                const articleCount = await this.articleRepo.count({
                    where: { categoryId: c.id, status: "published" }
                });
                return { ...c, articleCount };
            })
        );
    }

    async getCategoryById(id: string): Promise<LexiconCategoryEntity> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        return cat;
    }

    async createCategory(dto: CreateCategoryDto): Promise<LexiconCategoryEntity> {
        const slug = this.generateSlug(dto.name);
        const cat = this.categoryRepo.create({
            name: dto.name,
            slug,
            description: dto.description ?? null,
            parentId: dto.parentId ?? null,
            position: dto.position ?? 0,
            customFields: dto.customFields ?? []
        });
        return this.categoryRepo.save(cat);
    }

    async updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<LexiconCategoryEntity> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        if (dto.name !== undefined) {
            cat.name = dto.name;
            cat.slug = this.generateSlug(dto.name);
        }
        if (dto.description !== undefined) cat.description = dto.description ?? null;
        if (dto.parentId !== undefined) cat.parentId = dto.parentId ?? null;
        if (dto.position !== undefined) cat.position = dto.position;
        if (dto.customFields !== undefined) cat.customFields = dto.customFields;
        return this.categoryRepo.save(cat);
    }

    async deleteCategory(id: string): Promise<void> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        const articleCount = await this.articleRepo.count({ where: { categoryId: id } });
        if (articleCount > 0) {
            throw new ForbiddenException("Cannot delete category with existing articles");
        }
        await this.categoryRepo.remove(cat);
    }

    // ── Articles ────────────────────────────────────────────────

    async getArticles(
        query: ArticleQueryDto,
        userId: string,
        isAdmin: boolean
    ): Promise<{ data: object[]; total: number }> {
        const qb = this.articleRepo.createQueryBuilder("a").leftJoinAndSelect("a.category", "c");

        const validStatuses: LexiconArticleStatus[] = ["draft", "pending", "published", "rejected", "archived"];
        if (!isAdmin) {
            if (userId) {
                qb.where("(a.status = 'published' OR a.author_id = :userId)", { userId });
            } else {
                qb.where("a.status = 'published'");
            }
        } else if (query.status && validStatuses.includes(query.status)) {
            qb.where("a.status = :status", { status: query.status });
        }

        if (query.categoryId) qb.andWhere("a.category_id = :categoryId", { categoryId: query.categoryId });
        if (query.language) qb.andWhere("a.language = :language", { language: query.language });
        if (query.authorId) qb.andWhere("a.author_id = :authorId", { authorId: query.authorId });
        if (query.tag) qb.andWhere("a.tags @> :tag", { tag: JSON.stringify([query.tag]) });
        if (query.search) {
            qb.andWhere("(a.title ILIKE :search OR a.content ILIKE :search OR a.excerpt ILIKE :search)", {
                search: `%${query.search}%`
            });
        }

        const total = await qb.getCount();

        const limit = Math.min(query.limit ?? 20, 100);
        const page = query.page ?? 0;
        qb.orderBy("a.publishedAt", "DESC", "NULLS LAST")
            .addOrderBy("a.createdAt", "DESC")
            .skip(page * limit)
            .take(limit);

        const articles = await qb.getMany();
        const data = await Promise.all(articles.map((a) => this.enrichArticle(a, userId)));
        return { data, total };
    }

    async getArticleBySlug(slug: string, userId: string, isAdmin: boolean): Promise<object> {
        const qb = this.articleRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.category", "c")
            .where("a.slug = :slug", { slug });

        if (!isAdmin) {
            if (userId) {
                qb.andWhere("(a.status = 'published' OR a.author_id = :userId)", { userId });
            } else {
                qb.andWhere("a.status = 'published'");
            }
        }

        const article = await qb.getOne();
        if (!article) throw new NotFoundException("Article not found");

        await this.articleRepo.increment({ id: article.id }, "viewCount", 1);
        article.viewCount++;

        const comments = await this.commentRepo.find({ where: { articleId: article.id }, order: { createdAt: "ASC" } });
        const enrichedComments = await Promise.all(comments.map((c) => this.enrichComment(c)));
        const topLevel = enrichedComments.filter((c) => !c.parentId);
        const byParent = new Map<string, EnrichedComment[]>();
        enrichedComments
            .filter((c) => c.parentId)
            .forEach((c) => {
                const arr = byParent.get(c.parentId as string) ?? [];
                arr.push(c);
                byParent.set(c.parentId as string, arr);
            });
        const nestedComments = topLevel.map((c) => ({ ...c, replies: byParent.get(c.id) ?? [] }));

        const enriched = await this.enrichArticle(article, userId);

        let linkedArticleSlug: string | null = null;
        if (article.linkedArticleId) {
            const linked = await this.articleRepo.findOne({ where: { id: article.linkedArticleId } });
            if (linked) linkedArticleSlug = linked.slug;
        }

        return { ...enriched, linkedArticleSlug, comments: nestedComments };
    }

    async createArticle(userId: string, dto: CreateArticleDto): Promise<object> {
        await this.validateCustomFields(dto.categoryId, dto.customFieldValues ?? {});

        const slug = this.generateSlug(dto.title);
        const article = this.articleRepo.create({
            title: dto.title,
            slug,
            content: dto.content,
            excerpt: dto.excerpt ?? null,
            language: dto.language ?? "de",
            categoryId: dto.categoryId,
            authorId: userId,
            status: dto.status ?? "draft",
            tags: dto.tags ?? [],
            customFieldValues: dto.customFieldValues ?? {},
            linkedArticleId: dto.linkedArticleId ?? null,
            coverImageUrl: dto.coverImageUrl ?? null,
            allowComments: dto.allowComments ?? true,
            publishedAt: dto.status === "published" ? new Date() : null
        });

        if (dto.coverImageMediaId) {
            const asset = await this.mediaService.findById(dto.coverImageMediaId);
            article.coverImageUrl = asset.url;
            article.coverImageMediaId = dto.coverImageMediaId;
        }

        const saved = await this.articleRepo.save(article);
        void this.gamificationService.awardXp(userId, "create_lexicon_article", saved.id);

        await this.createVersion(saved, userId, dto.changeSummary ?? "Initial version");

        return this.enrichArticle(saved, userId);
    }

    async updateArticle(id: string, userId: string, isAdmin: boolean, dto: UpdateArticleDto): Promise<object> {
        const article = await this.articleRepo.findOne({ where: { id }, relations: ["category"] });
        if (!article) throw new NotFoundException("Article not found");
        if (!isAdmin && article.authorId !== userId) throw new ForbiddenException("Access denied");
        if (article.isLocked && !isAdmin) throw new ForbiddenException("Article is locked");

        if (dto.title !== undefined) {
            article.title = dto.title;
            if (dto.title !== article.title) article.slug = this.generateSlug(dto.title);
        }
        if (dto.content !== undefined) article.content = dto.content;
        if (dto.excerpt !== undefined) article.excerpt = dto.excerpt ?? null;
        if (dto.language !== undefined) article.language = dto.language;
        if (dto.categoryId !== undefined) article.categoryId = dto.categoryId;
        if (dto.tags !== undefined) article.tags = dto.tags;
        if (dto.customFieldValues !== undefined) article.customFieldValues = dto.customFieldValues;

        const effectiveCategoryId = dto.categoryId ?? article.categoryId;
        const effectiveCustomFieldValues = dto.customFieldValues ?? article.customFieldValues;
        if (dto.customFieldValues !== undefined || dto.categoryId !== undefined) {
            await this.validateCustomFields(effectiveCategoryId, effectiveCustomFieldValues);
        }

        if (dto.linkedArticleId !== undefined) article.linkedArticleId = dto.linkedArticleId ?? null;
        if (dto.coverImageUrl !== undefined) article.coverImageUrl = dto.coverImageUrl ?? null;
        if (dto.allowComments !== undefined) article.allowComments = dto.allowComments;

        if (dto.coverImageMediaId) {
            const asset = await this.mediaService.findById(dto.coverImageMediaId);
            article.coverImageUrl = asset.url;
            article.coverImageMediaId = dto.coverImageMediaId;
        }
        if (dto.status !== undefined) {
            if (article.status !== "published" && dto.status === "published") article.publishedAt = new Date();
            article.status = dto.status;
        }

        const saved = await this.articleRepo.save(article);
        await this.createVersion(saved, userId, dto.changeSummary ?? null);

        return this.enrichArticle(saved, userId);
    }

    async deleteArticle(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const article = await this.articleRepo.findOne({ where: { id } });
        if (!article) throw new NotFoundException("Article not found");
        if (!isAdmin && article.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.articleRepo.softRemove(article);
    }

    async toggleLock(id: string): Promise<object> {
        const article = await this.articleRepo.findOne({ where: { id } });
        if (!article) throw new NotFoundException("Article not found");
        article.isLocked = !article.isLocked;
        const saved = await this.articleRepo.save(article);
        return { id: saved.id, isLocked: saved.isLocked };
    }

    // ── Versions ────────────────────────────────────────────────

    async getVersions(articleId: string): Promise<object[]> {
        const versions = await this.versionRepo.find({
            where: { articleId },
            order: { versionNumber: "DESC" }
        });
        return Promise.all(
            versions.map(async (v) => {
                const author = await this.userRepo.findOne({ where: { id: v.authorId } });
                return {
                    id: v.id,
                    versionNumber: v.versionNumber,
                    title: v.title,
                    authorId: v.authorId,
                    authorName: author?.displayName ?? author?.username ?? "Unknown",
                    changeSummary: v.changeSummary,
                    isProtected: v.isProtected,
                    createdAt: v.createdAt.toISOString()
                };
            })
        );
    }

    async getVersion(articleId: string, versionNumber: number): Promise<object> {
        const version = await this.versionRepo.findOne({ where: { articleId, versionNumber } });
        if (!version) throw new NotFoundException("Version not found");
        const author = await this.userRepo.findOne({ where: { id: version.authorId } });
        return {
            id: version.id,
            versionNumber: version.versionNumber,
            title: version.title,
            content: version.content,
            customFieldValues: version.customFieldValues,
            authorId: version.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            changeSummary: version.changeSummary,
            isProtected: version.isProtected,
            createdAt: version.createdAt.toISOString()
        };
    }

    async restoreVersion(
        articleId: string,
        versionNumber: number,
        userId: string,
        isAdmin: boolean
    ): Promise<object> {
        const article = await this.articleRepo.findOne({ where: { id: articleId } });
        if (!article) throw new NotFoundException("Article not found");
        if (!isAdmin && article.authorId !== userId) throw new ForbiddenException("Access denied");
        if (article.isLocked && !isAdmin) throw new ForbiddenException("Article is locked");

        const version = await this.versionRepo.findOne({ where: { articleId, versionNumber } });
        if (!version) throw new NotFoundException("Version not found");

        article.title = version.title;
        article.content = version.content;
        article.customFieldValues = version.customFieldValues;
        const saved = await this.articleRepo.save(article);

        await this.createVersion(saved, userId, `Restored from version ${versionNumber}`);

        return this.enrichArticle(saved, userId);
    }

    async protectVersion(articleId: string, versionNumber: number): Promise<object> {
        const version = await this.versionRepo.findOne({ where: { articleId, versionNumber } });
        if (!version) throw new NotFoundException("Version not found");
        version.isProtected = !version.isProtected;
        const saved = await this.versionRepo.save(version);
        return { id: saved.id, versionNumber: saved.versionNumber, isProtected: saved.isProtected };
    }

    // ── Comments ────────────────────────────────────────────────

    async getComments(articleId: string): Promise<EnrichedComment[]> {
        const comments = await this.commentRepo.find({
            where: { articleId },
            order: { createdAt: "ASC" }
        });
        return Promise.all(comments.map((c) => this.enrichComment(c)));
    }

    async addComment(articleId: string, userId: string, dto: CreateCommentDto): Promise<EnrichedComment> {
        const article = await this.articleRepo.findOne({ where: { id: articleId } });
        if (!article) throw new NotFoundException("Article not found");
        if (!article.allowComments) throw new ForbiddenException("Comments are disabled");

        const comment = this.commentRepo.create({
            articleId,
            authorId: userId,
            content: dto.content,
            parentId: dto.parentId ?? null
        });
        const saved = await this.commentRepo.save(comment);
        return this.enrichComment(saved);
    }

    async updateComment(id: string, userId: string, isAdmin: boolean, content: string): Promise<EnrichedComment> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        comment.content = content;
        const saved = await this.commentRepo.save(comment);
        return this.enrichComment(saved);
    }

    async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.commentRepo.remove(comment);
    }

    // ── Moderation ──────────────────────────────────────────────

    async getPendingArticles(query: ArticleQueryDto): Promise<{ data: object[]; total: number }> {
        const qb = this.articleRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.category", "c")
            .where("a.status = 'pending'");

        if (query.categoryId) qb.andWhere("a.category_id = :categoryId", { categoryId: query.categoryId });
        if (query.language) qb.andWhere("a.language = :language", { language: query.language });

        const total = await qb.getCount();
        const limit = query.limit ?? 20;
        const page = query.page ?? 0;
        qb.orderBy("a.createdAt", "ASC").skip(page * limit).take(limit);

        const articles = await qb.getMany();
        const data = await Promise.all(articles.map((a) => this.enrichArticle(a, "")));
        return { data, total };
    }

    async approveArticle(id: string, userId: string): Promise<object> {
        const article = await this.articleRepo.findOne({ where: { id } });
        if (!article) throw new NotFoundException("Article not found");
        article.status = "published";
        article.publishedAt = new Date();
        const saved = await this.articleRepo.save(article);
        return this.enrichArticle(saved, userId);
    }

    async rejectArticle(id: string, userId: string, dto: ModerateArticleDto): Promise<object> {
        const article = await this.articleRepo.findOne({ where: { id } });
        if (!article) throw new NotFoundException("Article not found");
        article.status = "rejected";
        const saved = await this.articleRepo.save(article);
        return this.enrichArticle(saved, userId);
    }

    async reportArticle(articleId: string, userId: string, reason: string): Promise<LexiconReportEntity> {
        const article = await this.articleRepo.findOne({ where: { id: articleId } });
        if (!article) throw new NotFoundException("Article not found");
        const report = this.reportRepo.create({ articleId, reporterId: userId, reason });
        return this.reportRepo.save(report);
    }

    async getReports(): Promise<object[]> {
        const reports = await this.reportRepo.find({
            where: { status: "open" },
            order: { createdAt: "ASC" }
        });
        return Promise.all(
            reports.map(async (r) => {
                const reporter = await this.userRepo.findOne({ where: { id: r.reporterId } });
                const article = await this.articleRepo.findOne({ where: { id: r.articleId } });
                return {
                    id: r.id,
                    articleId: r.articleId,
                    articleTitle: article?.title ?? "Deleted",
                    articleSlug: article?.slug ?? null,
                    reporterId: r.reporterId,
                    reporterName: reporter?.displayName ?? reporter?.username ?? "Unknown",
                    reason: r.reason,
                    status: r.status,
                    createdAt: r.createdAt.toISOString()
                };
            })
        );
    }

    async resolveReport(id: string, userId: string, dto: ResolveReportDto): Promise<LexiconReportEntity> {
        const report = await this.reportRepo.findOne({ where: { id } });
        if (!report) throw new NotFoundException("Report not found");
        report.status = dto.status;
        report.resolvedBy = userId;
        report.resolvedAt = new Date();
        return this.reportRepo.save(report);
    }

    // ── Terms of Use ────────────────────────────────────────────

    async getTerms(language: string): Promise<LexiconTermsEntity | null> {
        return this.termsRepo.findOne({ where: { language } });
    }

    async updateTerms(language: string, dto: UpdateTermsDto, userId: string): Promise<LexiconTermsEntity> {
        let terms = await this.termsRepo.findOne({ where: { language } });
        if (terms) {
            terms.content = dto.content;
            terms.updatedBy = userId;
        } else {
            terms = this.termsRepo.create({ language, content: dto.content, updatedBy: userId });
        }
        return this.termsRepo.save(terms);
    }

    // ── System-wide Linking ─────────────────────────────────────

    async detectTerms(text: string): Promise<{ term: string; slug: string; articleId: string }[]> {
        const articles = await this.articleRepo.find({
            where: { status: "published" },
            select: ["id", "title", "slug"]
        });

        const matches: { term: string; slug: string; articleId: string }[] = [];
        const lowerText = text.toLowerCase();

        for (const article of articles) {
            const lowerTitle = article.title.toLowerCase();
            if (lowerText.includes(lowerTitle)) {
                matches.push({ term: article.title, slug: article.slug, articleId: article.id });
            }
        }

        return matches;
    }

    // ── Search ──────────────────────────────────────────────────

    async search(
        searchQuery: string,
        language: string | undefined,
        userId: string,
        isAdmin: boolean
    ): Promise<object[]> {
        const qb = this.articleRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.category", "c")
            .where("(a.title ILIKE :q OR a.content ILIKE :q OR a.excerpt ILIKE :q)", {
                q: `%${searchQuery}%`
            });

        if (!isAdmin) {
            if (userId) {
                qb.andWhere("(a.status = 'published' OR a.author_id = :userId)", { userId });
            } else {
                qb.andWhere("a.status = 'published'");
            }
        }
        if (language) qb.andWhere("a.language = :language", { language });

        qb.orderBy("a.viewCount", "DESC").take(50);

        const articles = await qb.getMany();
        return Promise.all(articles.map((a) => this.enrichArticle(a, userId)));
    }

    // ── Private helpers ─────────────────────────────────────────

    private async createVersion(article: LexiconArticleEntity, authorId: string, changeSummary: string | null): Promise<void> {
        const lastVersion = await this.versionRepo
            .createQueryBuilder("v")
            .where("v.article_id = :articleId", { articleId: article.id })
            .orderBy("v.versionNumber", "DESC")
            .getOne();

        const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

        const version = this.versionRepo.create({
            articleId: article.id,
            versionNumber,
            title: article.title,
            content: article.content,
            customFieldValues: article.customFieldValues,
            authorId,
            changeSummary
        });
        await this.versionRepo.save(version);
    }

    private async enrichArticle(article: LexiconArticleEntity, userId: string): Promise<object> {
        const [author, commentCount, versionCount, contributors] = await Promise.all([
            this.userRepo.findOne({ where: { id: article.authorId } }),
            this.commentRepo.count({ where: { articleId: article.id } }),
            this.versionRepo.count({ where: { articleId: article.id } }),
            this.getContributors(article.id)
        ]);
        const category =
            article.category ?? (article.categoryId ? await this.categoryRepo.findOne({ where: { id: article.categoryId } }) : null);

        return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            language: article.language,
            categoryId: article.categoryId,
            categoryName: category?.name ?? null,
            authorId: article.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            status: article.status,
            tags: article.tags,
            customFieldValues: article.customFieldValues,
            coverImageUrl: article.coverImageUrl,
            viewCount: article.viewCount,
            commentCount,
            versionCount,
            isLocked: article.isLocked,
            allowComments: article.allowComments,
            linkedArticleId: article.linkedArticleId,
            isOwner: article.authorId === userId,
            contributors,
            publishedAt: article.publishedAt?.toISOString() ?? null,
            createdAt: article.createdAt.toISOString(),
            updatedAt: article.updatedAt.toISOString()
        };
    }

    private async getContributors(
        articleId: string
    ): Promise<{ id: string; displayName: string; avatarUrl: string | null; versionCount: number }[]> {
        const rows = await this.versionRepo
            .createQueryBuilder("v")
            .select("v.author_id", "authorId")
            .addSelect("COUNT(*)::int", "versionCount")
            .where("v.article_id = :articleId", { articleId })
            .groupBy("v.author_id")
            .orderBy('"versionCount"', "DESC")
            .getRawMany<{ authorId: string; versionCount: number }>();

        if (rows.length === 0) return [];

        const userIds = rows.map((r) => r.authorId);
        const users = await this.userRepo.find({
            where: { id: In(userIds) },
            select: ["id", "displayName", "avatarUrl"]
        });
        const usersById = new Map(users.map((u) => [u.id, u]));

        return rows.map((r) => {
            const user = usersById.get(r.authorId);
            return {
                id: r.authorId,
                displayName: user?.displayName ?? "Unknown",
                avatarUrl: user?.avatarUrl ?? null,
                versionCount: r.versionCount
            };
        });
    }

    private async enrichComment(comment: LexiconCommentEntity): Promise<EnrichedComment> {
        const author = await this.userRepo.findOne({ where: { id: comment.authorId } });
        return {
            id: comment.id,
            articleId: comment.articleId,
            authorId: comment.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            content: comment.content,
            parentId: comment.parentId,
            replies: [],
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        };
    }

    private async validateCustomFields(categoryId: string, customFieldValues: Record<string, unknown>): Promise<void> {
        const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
        if (!category) return;

        const requiredFields = (category.customFields ?? []).filter((f) => f.required);
        const missingFields = requiredFields.filter((field) => {
            const value = customFieldValues[field.key];
            if (value === undefined || value === null || value === "") return true;
            if (typeof value === "string" && !value.trim()) return true;
            return false;
        });

        if (missingFields.length > 0) {
            const labels = missingFields.map((f) => f.label).join(", ");
            throw new BadRequestException(`Missing required custom fields: ${labels}`);
        }
    }

    private generateSlug(title: string): string {
        const base = title
            .toLowerCase()
            .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return `${base}-${Date.now()}`;
    }
}
