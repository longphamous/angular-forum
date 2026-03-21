import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { LexiconService } from "./lexicon.service";
import { LexiconArticleEntity } from "./entities/lexicon-article.entity";
import { LexiconArticleVersionEntity } from "./entities/lexicon-article-version.entity";
import { LexiconCategoryEntity } from "./entities/lexicon-category.entity";
import { LexiconCommentEntity } from "./entities/lexicon-comment.entity";
import { LexiconReportEntity } from "./entities/lexicon-report.entity";
import { LexiconTermsEntity } from "./entities/lexicon-terms.entity";

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
    maximum: jest.fn()
});

describe("LexiconService", () => {
    let service: LexiconService;
    let categoryRepo: ReturnType<typeof createMockRepo<LexiconCategoryEntity>>;
    let articleRepo: ReturnType<typeof createMockRepo<LexiconArticleEntity>>;
    let versionRepo: ReturnType<typeof createMockRepo<LexiconArticleVersionEntity>>;
    let commentRepo: ReturnType<typeof createMockRepo<LexiconCommentEntity>>;
    let reportRepo: ReturnType<typeof createMockRepo<LexiconReportEntity>>;
    let termsRepo: ReturnType<typeof createMockRepo<LexiconTermsEntity>>;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;

    const now = new Date("2026-03-01T10:00:00Z");

    const makeCategory = (overrides: Partial<LexiconCategoryEntity> = {}): Partial<LexiconCategoryEntity> => ({
        id: "cat-1",
        name: "General",
        slug: "general",
        description: "General category",
        parentId: null,
        position: 0,
        isActive: true,
        customFields: [],
        ...overrides
    });

    const makeArticle = (overrides: Partial<LexiconArticleEntity> = {}): Partial<LexiconArticleEntity> => ({
        id: "article-1",
        title: "Test Article",
        slug: "test-article-123",
        content: "Article content",
        excerpt: null,
        language: "de",
        categoryId: "cat-1",
        category: undefined,
        authorId: "user-1",
        status: "draft",
        tags: [],
        customFieldValues: {},
        coverImageUrl: null,
        viewCount: 0,
        isLocked: false,
        allowComments: true,
        linkedArticleId: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    const makeComment = (overrides: Partial<LexiconCommentEntity> = {}): Partial<LexiconCommentEntity> => ({
        id: "comment-1",
        articleId: "article-1",
        authorId: "user-1",
        content: "Great article",
        parentId: null,
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        categoryRepo = createMockRepo<LexiconCategoryEntity>();
        articleRepo = createMockRepo<LexiconArticleEntity>();
        versionRepo = createMockRepo<LexiconArticleVersionEntity>();
        commentRepo = createMockRepo<LexiconCommentEntity>();
        reportRepo = createMockRepo<LexiconReportEntity>();
        termsRepo = createMockRepo<LexiconTermsEntity>();
        userRepo = createMockRepo<UserEntity>();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LexiconService,
                { provide: getRepositoryToken(LexiconCategoryEntity), useValue: categoryRepo },
                { provide: getRepositoryToken(LexiconArticleEntity), useValue: articleRepo },
                { provide: getRepositoryToken(LexiconArticleVersionEntity), useValue: versionRepo },
                { provide: getRepositoryToken(LexiconCommentEntity), useValue: commentRepo },
                { provide: getRepositoryToken(LexiconReportEntity), useValue: reportRepo },
                { provide: getRepositoryToken(LexiconTermsEntity), useValue: termsRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo }
            ]
        }).compile();

        service = module.get<LexiconService>(LexiconService);
    });

    describe("getCategories", () => {
        it("should return active categories with article counts", async () => {
            const categories = [makeCategory({ id: "cat-1" }), makeCategory({ id: "cat-2", name: "Tech" })];
            categoryRepo.find!.mockResolvedValue(categories);
            articleRepo.count!.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

            const result = await service.getCategories();

            expect(categoryRepo.find).toHaveBeenCalledWith({
                where: { isActive: true },
                order: { position: "ASC", name: "ASC" }
            });
            expect(result).toHaveLength(2);
        });
    });

    describe("getCategoryById", () => {
        it("should return category by id", async () => {
            categoryRepo.findOne!.mockResolvedValue(makeCategory());

            const result = await service.getCategoryById("cat-1");

            expect(result.name).toBe("General");
        });

        it("should throw NotFoundException when category not found", async () => {
            categoryRepo.findOne!.mockResolvedValue(null);

            await expect(service.getCategoryById("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("createCategory", () => {
        it("should create and save a category with generated slug", async () => {
            const cat = makeCategory();
            categoryRepo.create!.mockReturnValue(cat);
            categoryRepo.save!.mockResolvedValue(cat);

            const result = await service.createCategory({ name: "General" });

            expect(categoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: "General" })
            );
            expect(result).toBeDefined();
        });
    });

    describe("updateCategory", () => {
        it("should update category fields", async () => {
            const cat = makeCategory();
            categoryRepo.findOne!.mockResolvedValue(cat);
            categoryRepo.save!.mockImplementation((c) => Promise.resolve(c));

            const result = await service.updateCategory("cat-1", { name: "Updated" });

            expect(cat.name).toBe("Updated");
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when category not found", async () => {
            categoryRepo.findOne!.mockResolvedValue(null);

            await expect(service.updateCategory("missing", { name: "X" })).rejects.toThrow(NotFoundException);
        });
    });

    describe("deleteCategory", () => {
        it("should delete category with no articles", async () => {
            const cat = makeCategory();
            categoryRepo.findOne!.mockResolvedValue(cat);
            articleRepo.count!.mockResolvedValue(0);
            categoryRepo.remove!.mockResolvedValue(cat);

            await service.deleteCategory("cat-1");

            expect(categoryRepo.remove).toHaveBeenCalledWith(cat);
        });

        it("should throw NotFoundException when category not found", async () => {
            categoryRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteCategory("missing")).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when category has articles", async () => {
            categoryRepo.findOne!.mockResolvedValue(makeCategory());
            articleRepo.count!.mockResolvedValue(5);

            await expect(service.deleteCategory("cat-1")).rejects.toThrow(ForbiddenException);
        });
    });

    describe("createArticle", () => {
        it("should create article with version", async () => {
            categoryRepo.findOne!.mockResolvedValue(makeCategory());
            const article = makeArticle();
            articleRepo.create!.mockReturnValue(article);
            articleRepo.save!.mockResolvedValue(article);

            const versionQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null)
            };
            versionRepo.createQueryBuilder!.mockReturnValue(versionQb);
            versionRepo.create!.mockReturnValue({});
            versionRepo.save!.mockResolvedValue({});

            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "Author", username: "author", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);
            versionRepo.count!.mockResolvedValue(1);

            const result = await service.createArticle("user-1", {
                title: "Test Article",
                content: "Content",
                categoryId: "cat-1"
            });

            expect(articleRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Test Article",
                    authorId: "user-1",
                    categoryId: "cat-1"
                })
            );
            expect(result).toBeDefined();
        });

        it("should validate required custom fields", async () => {
            const cat = makeCategory({
                customFields: [{ key: "source", label: "Source", type: "text", required: true }]
            });
            categoryRepo.findOne!.mockResolvedValue(cat);

            await expect(
                service.createArticle("user-1", {
                    title: "Test",
                    content: "Content",
                    categoryId: "cat-1",
                    customFieldValues: {}
                })
            ).rejects.toThrow(BadRequestException);
        });

        it("should set publishedAt when status is published", async () => {
            categoryRepo.findOne!.mockResolvedValue(makeCategory());
            const article = makeArticle({ status: "published", publishedAt: now });
            articleRepo.create!.mockReturnValue(article);
            articleRepo.save!.mockResolvedValue(article);

            const versionQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null)
            };
            versionRepo.createQueryBuilder!.mockReturnValue(versionQb);
            versionRepo.create!.mockReturnValue({});
            versionRepo.save!.mockResolvedValue({});
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "A", username: "a", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);
            versionRepo.count!.mockResolvedValue(1);

            await service.createArticle("user-1", {
                title: "Published",
                content: "Content",
                categoryId: "cat-1",
                status: "published"
            });

            expect(articleRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ publishedAt: expect.any(Date) })
            );
        });
    });

    describe("updateArticle", () => {
        it("should update article fields", async () => {
            const article = makeArticle({ authorId: "user-1" });
            articleRepo.findOne!.mockResolvedValue(article);
            articleRepo.save!.mockImplementation((a) => Promise.resolve(a));
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "A", username: "a", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);
            versionRepo.count!.mockResolvedValue(1);
            categoryRepo.findOne!.mockResolvedValue(makeCategory());

            const versionQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null)
            };
            versionRepo.createQueryBuilder!.mockReturnValue(versionQb);
            versionRepo.create!.mockReturnValue({});
            versionRepo.save!.mockResolvedValue({});

            const result = await service.updateArticle("article-1", "user-1", false, {
                content: "Updated content"
            });

            expect(article.content).toBe("Updated content");
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when article not found", async () => {
            articleRepo.findOne!.mockResolvedValue(null);

            await expect(
                service.updateArticle("missing", "user-1", false, { content: "x" })
            ).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-owner non-admin edits", async () => {
            articleRepo.findOne!.mockResolvedValue(makeArticle({ authorId: "user-1" }));

            await expect(
                service.updateArticle("article-1", "user-2", false, { content: "x" })
            ).rejects.toThrow(ForbiddenException);
        });

        it("should throw ForbiddenException when article is locked and user is not admin", async () => {
            articleRepo.findOne!.mockResolvedValue(makeArticle({ authorId: "user-1", isLocked: true }));

            await expect(
                service.updateArticle("article-1", "user-1", false, { content: "x" })
            ).rejects.toThrow(ForbiddenException);
        });

        it("should allow admin to update locked article", async () => {
            const article = makeArticle({ authorId: "user-1", isLocked: true });
            articleRepo.findOne!.mockResolvedValue(article);
            articleRepo.save!.mockImplementation((a) => Promise.resolve(a));
            userRepo.findOne!.mockResolvedValue({ id: "admin", displayName: "Admin", username: "admin", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);
            versionRepo.count!.mockResolvedValue(1);
            categoryRepo.findOne!.mockResolvedValue(makeCategory());

            const versionQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null)
            };
            versionRepo.createQueryBuilder!.mockReturnValue(versionQb);
            versionRepo.create!.mockReturnValue({});
            versionRepo.save!.mockResolvedValue({});

            await expect(
                service.updateArticle("article-1", "admin", true, { content: "admin edit" })
            ).resolves.toBeDefined();
        });
    });

    describe("deleteArticle", () => {
        it("should soft remove article when owner deletes", async () => {
            const article = makeArticle({ authorId: "user-1" });
            articleRepo.findOne!.mockResolvedValue(article);
            articleRepo.softRemove!.mockResolvedValue(article);

            await service.deleteArticle("article-1", "user-1", false);

            expect(articleRepo.softRemove).toHaveBeenCalledWith(article);
        });

        it("should throw NotFoundException when article not found", async () => {
            articleRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteArticle("missing", "user-1", false)).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-owner non-admin deletes", async () => {
            articleRepo.findOne!.mockResolvedValue(makeArticle({ authorId: "user-1" }));

            await expect(service.deleteArticle("article-1", "user-2", false)).rejects.toThrow(ForbiddenException);
        });

        it("should allow admin to delete any article", async () => {
            const article = makeArticle({ authorId: "user-1" });
            articleRepo.findOne!.mockResolvedValue(article);
            articleRepo.softRemove!.mockResolvedValue(article);

            await service.deleteArticle("article-1", "user-2", true);

            expect(articleRepo.softRemove).toHaveBeenCalledWith(article);
        });
    });

    describe("toggleLock", () => {
        it("should toggle the lock state", async () => {
            const article = makeArticle({ isLocked: false });
            articleRepo.findOne!.mockResolvedValue(article);
            articleRepo.save!.mockImplementation((a) => Promise.resolve(a));

            const result = await service.toggleLock("article-1");

            expect(article.isLocked).toBe(true);
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when article not found", async () => {
            articleRepo.findOne!.mockResolvedValue(null);

            await expect(service.toggleLock("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("addComment", () => {
        it("should add a comment to an article", async () => {
            const article = makeArticle({ allowComments: true });
            articleRepo.findOne!.mockResolvedValue(article);
            const comment = makeComment();
            commentRepo.create!.mockReturnValue(comment);
            commentRepo.save!.mockResolvedValue(comment);
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "Author", username: "author", avatarUrl: null });

            const result = await service.addComment("article-1", "user-1", { content: "Great article" });

            expect(result.content).toBe("Great article");
        });

        it("should throw NotFoundException when article not found", async () => {
            articleRepo.findOne!.mockResolvedValue(null);

            await expect(
                service.addComment("missing", "user-1", { content: "x" })
            ).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when comments are disabled", async () => {
            articleRepo.findOne!.mockResolvedValue(makeArticle({ allowComments: false }));

            await expect(
                service.addComment("article-1", "user-1", { content: "x" })
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe("deleteComment", () => {
        it("should delete comment when owner deletes", async () => {
            const comment = makeComment({ authorId: "user-1" });
            commentRepo.findOne!.mockResolvedValue(comment);
            commentRepo.remove!.mockResolvedValue(comment);

            await service.deleteComment("comment-1", "user-1", false);

            expect(commentRepo.remove).toHaveBeenCalledWith(comment);
        });

        it("should throw ForbiddenException when non-owner non-admin deletes", async () => {
            commentRepo.findOne!.mockResolvedValue(makeComment({ authorId: "user-1" }));

            await expect(service.deleteComment("comment-1", "user-2", false)).rejects.toThrow(ForbiddenException);
        });

        it("should allow admin to delete any comment", async () => {
            const comment = makeComment({ authorId: "user-1" });
            commentRepo.findOne!.mockResolvedValue(comment);
            commentRepo.remove!.mockResolvedValue(comment);

            await service.deleteComment("comment-1", "user-2", true);

            expect(commentRepo.remove).toHaveBeenCalledWith(comment);
        });
    });

    describe("reportArticle", () => {
        it("should create a report for an article", async () => {
            articleRepo.findOne!.mockResolvedValue(makeArticle());
            const report = { id: "report-1", articleId: "article-1", reporterId: "user-1", reason: "spam" };
            reportRepo.create!.mockReturnValue(report);
            reportRepo.save!.mockResolvedValue(report);

            const result = await service.reportArticle("article-1", "user-1", "spam");

            expect(result.reason).toBe("spam");
        });

        it("should throw NotFoundException when article not found", async () => {
            articleRepo.findOne!.mockResolvedValue(null);

            await expect(service.reportArticle("missing", "user-1", "spam")).rejects.toThrow(NotFoundException);
        });
    });

    describe("resolveReport", () => {
        it("should resolve a report", async () => {
            const report = { id: "report-1", status: "open", resolvedBy: null, resolvedAt: null };
            reportRepo.findOne!.mockResolvedValue(report);
            reportRepo.save!.mockImplementation((r) => Promise.resolve(r));

            const result = await service.resolveReport("report-1", "admin-1", { status: "resolved" });

            expect(report.status).toBe("resolved");
            expect(report.resolvedBy).toBe("admin-1");
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when report not found", async () => {
            reportRepo.findOne!.mockResolvedValue(null);

            await expect(
                service.resolveReport("missing", "admin-1", { status: "resolved" })
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe("getTerms", () => {
        it("should return terms for a language", async () => {
            const terms = { language: "de", content: "Terms content" };
            termsRepo.findOne!.mockResolvedValue(terms);

            const result = await service.getTerms("de");

            expect(result).toEqual(terms);
        });

        it("should return null when no terms exist", async () => {
            termsRepo.findOne!.mockResolvedValue(null);

            const result = await service.getTerms("en");

            expect(result).toBeNull();
        });
    });

    describe("updateTerms", () => {
        it("should update existing terms", async () => {
            const terms = { language: "de", content: "Old", updatedBy: "old-user" };
            termsRepo.findOne!.mockResolvedValue(terms);
            termsRepo.save!.mockImplementation((t) => Promise.resolve(t));

            const result = await service.updateTerms("de", { content: "New terms" }, "admin-1");

            expect(terms.content).toBe("New terms");
            expect(terms.updatedBy).toBe("admin-1");
            expect(result).toBeDefined();
        });

        it("should create new terms when none exist", async () => {
            termsRepo.findOne!.mockResolvedValue(null);
            const created = { language: "en", content: "New terms", updatedBy: "admin-1" };
            termsRepo.create!.mockReturnValue(created);
            termsRepo.save!.mockResolvedValue(created);

            const result = await service.updateTerms("en", { content: "New terms" }, "admin-1");

            expect(termsRepo.create).toHaveBeenCalled();
            expect(result.content).toBe("New terms");
        });
    });

    describe("detectTerms", () => {
        it("should detect matching article titles in text", async () => {
            articleRepo.find!.mockResolvedValue([
                { id: "a1", title: "Angular", slug: "angular" },
                { id: "a2", title: "NestJS", slug: "nestjs" }
            ]);

            const result = await service.detectTerms("I love using Angular and React");

            expect(result).toHaveLength(1);
            expect(result[0].term).toBe("Angular");
        });

        it("should return empty array when no matches", async () => {
            articleRepo.find!.mockResolvedValue([
                { id: "a1", title: "Angular", slug: "angular" }
            ]);

            const result = await service.detectTerms("No matches here");

            expect(result).toEqual([]);
        });
    });
});
