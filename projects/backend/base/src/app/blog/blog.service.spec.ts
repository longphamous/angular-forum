import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { ActivityService } from "../activity/activity.service";
import { UserEntity } from "../user/entities/user.entity";
import { BlogService, CreateCategoryDto, CreatePostDto } from "./blog.service";
import { BlogCategoryEntity } from "./entities/blog-category.entity";
import { BlogCommentEntity } from "./entities/blog-comment.entity";
import { BlogPostEntity } from "./entities/blog-post.entity";

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockActivityService = (): Partial<Record<keyof ActivityService, jest.Mock>> => ({
    create: jest.fn()
});

describe("BlogService", () => {
    let service: BlogService;
    let postRepo: ReturnType<typeof createMockRepo<BlogPostEntity>>;
    let categoryRepo: ReturnType<typeof createMockRepo<BlogCategoryEntity>>;
    let commentRepo: ReturnType<typeof createMockRepo<BlogCommentEntity>>;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;
    let activityService: ReturnType<typeof mockActivityService>;

    const now = new Date("2026-02-01T10:00:00Z");

    const makePost = (overrides: Partial<BlogPostEntity> = {}): Partial<BlogPostEntity> => ({
        id: "post-1",
        title: "Test Post",
        slug: "test-post-123",
        content: "Post content",
        excerpt: null,
        type: "personal",
        status: "draft",
        authorId: "user-1",
        categoryId: null,
        category: null,
        coverImageUrl: null,
        tags: [],
        viewCount: 0,
        allowComments: true,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    const makeCategory = (overrides: Partial<BlogCategoryEntity> = {}): Partial<BlogCategoryEntity> => ({
        id: "cat-1",
        name: "General",
        slug: "general",
        description: "General category",
        color: "#333",
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        postRepo = createMockRepo<BlogPostEntity>();
        categoryRepo = createMockRepo<BlogCategoryEntity>();
        commentRepo = createMockRepo<BlogCommentEntity>();
        userRepo = createMockRepo<UserEntity>();
        activityService = mockActivityService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogService,
                { provide: getRepositoryToken(BlogPostEntity), useValue: postRepo },
                { provide: getRepositoryToken(BlogCategoryEntity), useValue: categoryRepo },
                { provide: getRepositoryToken(BlogCommentEntity), useValue: commentRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo },
                { provide: ActivityService, useValue: activityService }
            ]
        }).compile();

        service = module.get<BlogService>(BlogService);
    });

    describe("createPost", () => {
        it("should create a draft post with generated slug", async () => {
            const dto: CreatePostDto = {
                title: "My First Post",
                content: "Hello world"
            };

            const createdPost = makePost({
                title: "My First Post",
                content: "Hello world",
                status: "draft"
            });
            const savedPost = { ...createdPost, id: "post-new" };

            postRepo.create!.mockReturnValue(createdPost);
            postRepo.save!.mockResolvedValue(savedPost);
            userRepo.findOne!.mockResolvedValue({
                id: "user-1",
                displayName: "Author",
                username: "author",
                avatarUrl: null
            });
            commentRepo.count!.mockResolvedValue(0);
            categoryRepo.findOne!.mockResolvedValue(null);

            const result = await service.createPost("user-1", dto);

            expect(postRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "My First Post",
                    content: "Hello world",
                    status: "draft",
                    authorId: "user-1",
                    type: "personal",
                    allowComments: true,
                    publishedAt: null
                })
            );
            expect(postRepo.save).toHaveBeenCalled();
            expect(activityService.create).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it("should create activity when post is published", async () => {
            const dto: CreatePostDto = {
                title: "Published Post",
                content: "Content",
                status: "published"
            };

            const savedPost = makePost({
                id: "post-pub",
                title: "Published Post",
                slug: "published-post-123",
                content: "Content",
                status: "published",
                excerpt: null,
                publishedAt: now
            });

            postRepo.create!.mockReturnValue(savedPost);
            postRepo.save!.mockResolvedValue(savedPost);
            userRepo.findOne!.mockResolvedValue({
                id: "user-1",
                displayName: "Author",
                username: "author",
                avatarUrl: null
            });
            commentRepo.count!.mockResolvedValue(0);
            categoryRepo.findOne!.mockResolvedValue(null);

            await service.createPost("user-1", dto);

            expect(activityService.create).toHaveBeenCalledWith(
                "user-1",
                "blog_published",
                "Published Post",
                undefined,
                `/blog/published-post-123`
            );
        });

        it("should set publishedAt when status is published", async () => {
            const dto: CreatePostDto = {
                title: "Pub Post",
                content: "Content",
                status: "published"
            };

            postRepo.create!.mockImplementation((data) => ({ ...data, createdAt: now, updatedAt: now }));
            postRepo.save!.mockImplementation((data) => Promise.resolve({ ...data, id: "post-x" }));
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "A", username: "a", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);

            await service.createPost("user-1", dto);

            expect(postRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    publishedAt: expect.any(Date)
                })
            );
        });
    });

    describe("updatePost", () => {
        it("should update post fields", async () => {
            const post = makePost({ authorId: "user-1" });
            postRepo.findOne!.mockResolvedValue(post);
            postRepo.save!.mockImplementation((p) => Promise.resolve(p));
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "A", username: "a", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);

            const result = await service.updatePost("post-1", "user-1", false, { content: "Updated content" });

            expect(post.content).toBe("Updated content");
            expect(postRepo.save).toHaveBeenCalledWith(post);
            expect(result).toBeDefined();
        });

        it("should regenerate slug when title changes", async () => {
            const post = makePost({ authorId: "user-1", title: "Old Title", slug: "old-title-123" });
            postRepo.findOne!.mockResolvedValue(post);
            postRepo.save!.mockImplementation((p) => Promise.resolve(p));
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "A", username: "a", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);

            await service.updatePost("post-1", "user-1", false, { title: "New Title" });

            expect(post.title).toBe("New Title");
            expect(post.slug).not.toBe("old-title-123");
            expect(post.slug).toContain("new-title");
        });

        it("should throw NotFoundException when post not found", async () => {
            postRepo.findOne!.mockResolvedValue(null);

            await expect(service.updatePost("missing", "user-1", false, { content: "x" })).rejects.toThrow(
                NotFoundException
            );
        });

        it("should throw ForbiddenException when non-owner non-admin edits", async () => {
            const post = makePost({ authorId: "user-1" });
            postRepo.findOne!.mockResolvedValue(post);

            await expect(service.updatePost("post-1", "user-2", false, { content: "x" })).rejects.toThrow(
                ForbiddenException
            );
        });

        it("should allow admin to update any post", async () => {
            const post = makePost({ authorId: "user-1" });
            postRepo.findOne!.mockResolvedValue(post);
            postRepo.save!.mockImplementation((p) => Promise.resolve(p));
            userRepo.findOne!.mockResolvedValue({ id: "user-2", displayName: "Admin", username: "admin", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);

            await expect(service.updatePost("post-1", "user-2", true, { content: "admin edit" })).resolves.toBeDefined();
        });

        it("should set publishedAt when transitioning to published status", async () => {
            const post = makePost({ authorId: "user-1", status: "draft", publishedAt: null });
            postRepo.findOne!.mockResolvedValue(post);
            postRepo.save!.mockImplementation((p) => Promise.resolve(p));
            userRepo.findOne!.mockResolvedValue({ id: "user-1", displayName: "A", username: "a", avatarUrl: null });
            commentRepo.count!.mockResolvedValue(0);

            await service.updatePost("post-1", "user-1", false, { status: "published" });

            expect(post.publishedAt).toBeInstanceOf(Date);
            expect(post.status).toBe("published");
        });
    });

    describe("deletePost", () => {
        it("should remove the post when owner deletes", async () => {
            const post = makePost({ authorId: "user-1" });
            postRepo.findOne!.mockResolvedValue(post);
            postRepo.remove!.mockResolvedValue(post);

            await service.deletePost("post-1", "user-1", false);

            expect(postRepo.remove).toHaveBeenCalledWith(post);
        });

        it("should allow admin to delete any post", async () => {
            const post = makePost({ authorId: "user-1" });
            postRepo.findOne!.mockResolvedValue(post);
            postRepo.remove!.mockResolvedValue(post);

            await service.deletePost("post-1", "user-2", true);

            expect(postRepo.remove).toHaveBeenCalledWith(post);
        });

        it("should throw NotFoundException when post not found", async () => {
            postRepo.findOne!.mockResolvedValue(null);

            await expect(service.deletePost("missing", "user-1", false)).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-owner non-admin deletes", async () => {
            const post = makePost({ authorId: "user-1" });
            postRepo.findOne!.mockResolvedValue(post);

            await expect(service.deletePost("post-1", "user-2", false)).rejects.toThrow(ForbiddenException);
        });
    });

    describe("getCategories", () => {
        it("should return all categories with post counts", async () => {
            const categories = [makeCategory({ id: "cat-1" }), makeCategory({ id: "cat-2", name: "Tech" })];
            categoryRepo.find!.mockResolvedValue(categories);
            postRepo.count!.mockResolvedValueOnce(3).mockResolvedValueOnce(7);

            const result = await service.getCategories();

            expect(categoryRepo.find).toHaveBeenCalledWith({ order: { name: "ASC" } });
            expect(result).toHaveLength(2);
            expect((result[0] as { postCount: number }).postCount).toBe(3);
            expect((result[1] as { postCount: number }).postCount).toBe(7);
        });
    });

    describe("createCategory", () => {
        it("should create and save a category", async () => {
            const dto: CreateCategoryDto = { name: "News", slug: "news" };
            const entity = makeCategory({ name: "News", slug: "news" });

            categoryRepo.create!.mockReturnValue(entity);
            categoryRepo.save!.mockResolvedValue(entity);

            const result = await service.createCategory(dto);

            expect(categoryRepo.create).toHaveBeenCalledWith(dto);
            expect(categoryRepo.save).toHaveBeenCalledWith(entity);
            expect(result).toEqual(entity);
        });
    });

    describe("updateCategory", () => {
        it("should update an existing category", async () => {
            const entity = makeCategory();
            categoryRepo.findOne!.mockResolvedValue(entity);
            categoryRepo.save!.mockImplementation((c) => Promise.resolve(c));

            const result = await service.updateCategory("cat-1", { name: "Updated" });

            expect(entity.name).toBe("Updated");
            expect(categoryRepo.save).toHaveBeenCalledWith(entity);
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when category not found", async () => {
            categoryRepo.findOne!.mockResolvedValue(null);

            await expect(service.updateCategory("missing", { name: "X" })).rejects.toThrow(NotFoundException);
        });
    });

    describe("deleteCategory", () => {
        it("should nullify posts and remove category", async () => {
            const entity = makeCategory();
            categoryRepo.findOne!.mockResolvedValue(entity);

            const mockQb = {
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 2 })
            };
            postRepo.createQueryBuilder!.mockReturnValue(mockQb);
            categoryRepo.remove!.mockResolvedValue(entity);

            await service.deleteCategory("cat-1");

            expect(postRepo.createQueryBuilder).toHaveBeenCalled();
            expect(mockQb.update).toHaveBeenCalled();
            expect(mockQb.set).toHaveBeenCalledWith({ categoryId: expect.any(Function) });
            expect(mockQb.where).toHaveBeenCalledWith("categoryId = :id", { id: "cat-1" });
            expect(mockQb.execute).toHaveBeenCalled();
            expect(categoryRepo.remove).toHaveBeenCalledWith(entity);
        });

        it("should throw NotFoundException when category not found", async () => {
            categoryRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteCategory("missing")).rejects.toThrow(NotFoundException);
        });
    });
});
