import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { ForumEntity } from "../forum/entities/forum.entity";
import { ForumPostEntity } from "../forum/entities/post.entity";
import { ForumThreadEntity } from "../forum/entities/thread.entity";
import { GamificationService } from "../gamification/gamification.service";
import { UserEntity } from "../user/entities/user.entity";
import { FeaturedThreadEntity } from "./entities/featured-thread.entity";
import { FeedService } from "./feed.service";

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    findByIds: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    maximum: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockGamificationService = (): Partial<Record<keyof GamificationService, jest.Mock>> => ({
    getUserXpData: jest.fn(),
    getUserXpDataBatch: jest.fn()
});

describe("FeedService", () => {
    let service: FeedService;
    let featuredRepo: ReturnType<typeof createMockRepo<FeaturedThreadEntity>>;
    let threadRepo: ReturnType<typeof createMockRepo<ForumThreadEntity>>;
    let postRepo: ReturnType<typeof createMockRepo<ForumPostEntity>>;
    let forumRepo: ReturnType<typeof createMockRepo<ForumEntity>>;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;
    let gamificationService: ReturnType<typeof mockGamificationService>;

    const now = new Date("2026-03-01T10:00:00Z");

    const makeFeatured = (overrides: Partial<FeaturedThreadEntity> = {}): Partial<FeaturedThreadEntity> => ({
        id: "feat-1",
        threadId: "thread-1",
        position: 0,
        isActive: true,
        ...overrides
    });

    const makeThread = (overrides: Partial<ForumThreadEntity> = {}): Partial<ForumThreadEntity> => ({
        id: "thread-1",
        title: "Test Thread",
        slug: "test-thread",
        forumId: "forum-1",
        authorId: "user-1",
        viewCount: 100,
        replyCount: 10,
        isPinned: false,
        isLocked: false,
        tags: ["test"],
        forum: { id: "forum-1", name: "General" } as ForumEntity,
        createdAt: now,
        lastPostAt: now,
        ...overrides
    });

    const makeUser = (overrides: Partial<UserEntity> = {}): Partial<UserEntity> => ({
        id: "user-1",
        displayName: "Test User",
        avatarUrl: "avatar.png",
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        featuredRepo = createMockRepo<FeaturedThreadEntity>();
        threadRepo = createMockRepo<ForumThreadEntity>();
        postRepo = createMockRepo<ForumPostEntity>();
        forumRepo = createMockRepo<ForumEntity>();
        userRepo = createMockRepo<UserEntity>();
        gamificationService = mockGamificationService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeedService,
                { provide: getRepositoryToken(FeaturedThreadEntity), useValue: featuredRepo },
                { provide: getRepositoryToken(ForumThreadEntity), useValue: threadRepo },
                { provide: getRepositoryToken(ForumPostEntity), useValue: postRepo },
                { provide: getRepositoryToken(ForumEntity), useValue: forumRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo },
                { provide: GamificationService, useValue: gamificationService }
            ]
        }).compile();

        service = module.get<FeedService>(FeedService);
    });

    describe("getFeatured", () => {
        it("should return featured threads with author info", async () => {
            featuredRepo.find!.mockResolvedValue([makeFeatured()]);
            threadRepo.find!.mockResolvedValue([makeThread()]);
            userRepo.find!.mockResolvedValue([makeUser()]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(
                new Map([
                    ["user-1", { xp: 50, level: 2, levelName: "Anfänger", xpToNextLevel: 150, xpProgressPercent: 33 }]
                ])
            );

            const result = await service.getFeatured();

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Test Thread");
            expect(result[0].authorName).toBe("Test User");
            expect(result[0].authorLevel).toBe(2);
        });

        it("should return empty array when no featured threads", async () => {
            featuredRepo.find!.mockResolvedValue([]);

            const result = await service.getFeatured();

            expect(result).toEqual([]);
        });

        it("should filter out featured entries without matching threads", async () => {
            featuredRepo.find!.mockResolvedValue([makeFeatured({ threadId: "missing-thread" })]);
            threadRepo.find!.mockResolvedValue([]);
            userRepo.find!.mockResolvedValue([]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            const result = await service.getFeatured();

            expect(result).toEqual([]);
        });
    });

    describe("getHotFeed", () => {
        it("should return paginated hot feed with default sort", async () => {
            const mockQb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[makeThread()], 1])
            };
            threadRepo.createQueryBuilder!.mockReturnValue(mockQb);
            postRepo.find!.mockResolvedValue([
                { threadId: "thread-1", content: "<p>Hello world</p>", isFirstPost: true }
            ]);
            userRepo.find!.mockResolvedValue([makeUser()]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            const result = await service.getHotFeed(1, 10, "hot");

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it("should sort by 'new' when requested", async () => {
            const mockQb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0])
            };
            threadRepo.createQueryBuilder!.mockReturnValue(mockQb);
            postRepo.find!.mockResolvedValue([]);
            userRepo.find!.mockResolvedValue([]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            const result = await service.getHotFeed(1, 10, "new");

            expect(result.data).toEqual([]);
            expect(mockQb.orderBy).toHaveBeenCalledWith("t.createdAt", "DESC");
        });

        it("should sort by 'top' when requested", async () => {
            const mockQb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0])
            };
            threadRepo.createQueryBuilder!.mockReturnValue(mockQb);
            postRepo.find!.mockResolvedValue([]);
            userRepo.find!.mockResolvedValue([]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            await service.getHotFeed(1, 10, "top");

            expect(mockQb.orderBy).toHaveBeenCalledWith("t.replyCount", "DESC");
        });
    });

    describe("addFeatured", () => {
        it("should add a featured thread", async () => {
            threadRepo.findOne!.mockResolvedValue(makeThread());
            featuredRepo.maximum!.mockResolvedValue(2);
            const featured = makeFeatured({ position: 3 });
            featuredRepo.create!.mockReturnValue(featured);
            featuredRepo.save!.mockResolvedValue(featured);
            userRepo.find!.mockResolvedValue([makeUser()]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            const result = await service.addFeatured({ threadId: "thread-1" });

            expect(result.threadId).toBe("thread-1");
        });

        it("should throw NotFoundException when thread not found", async () => {
            threadRepo.findOne!.mockResolvedValue(null);

            await expect(service.addFeatured({ threadId: "missing" })).rejects.toThrow(NotFoundException);
        });

        it("should use provided position", async () => {
            threadRepo.findOne!.mockResolvedValue(makeThread());
            featuredRepo.maximum!.mockResolvedValue(5);
            const featured = makeFeatured({ position: 1 });
            featuredRepo.create!.mockReturnValue(featured);
            featuredRepo.save!.mockResolvedValue(featured);
            userRepo.find!.mockResolvedValue([makeUser()]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            await service.addFeatured({ threadId: "thread-1", position: 1 });

            expect(featuredRepo.create).toHaveBeenCalledWith(expect.objectContaining({ position: 1 }));
        });
    });

    describe("updateFeatured", () => {
        it("should update featured entry", async () => {
            const featured = makeFeatured();
            featuredRepo.findOneBy!.mockResolvedValue(featured);
            featuredRepo.save!.mockImplementation((f) => Promise.resolve(f));
            threadRepo.findOne!.mockResolvedValue(makeThread());
            userRepo.find!.mockResolvedValue([makeUser()]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            const result = await service.updateFeatured("feat-1", { position: 5, isActive: false });

            expect(featured.position).toBe(5);
            expect(featured.isActive).toBe(false);
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when featured entry not found", async () => {
            featuredRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.updateFeatured("missing", { position: 1 })).rejects.toThrow(NotFoundException);
        });
    });

    describe("removeFeatured", () => {
        it("should remove featured entry", async () => {
            const featured = makeFeatured();
            featuredRepo.findOneBy!.mockResolvedValue(featured);
            featuredRepo.remove!.mockResolvedValue(featured);

            await service.removeFeatured("feat-1");

            expect(featuredRepo.remove).toHaveBeenCalledWith(featured);
        });

        it("should throw NotFoundException when featured entry not found", async () => {
            featuredRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.removeFeatured("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("searchThreads", () => {
        it("should search threads by title", async () => {
            const mockQb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([makeThread()])
            };
            threadRepo.createQueryBuilder!.mockReturnValue(mockQb);

            const result = await service.searchThreads("test");

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Test Thread");
            expect(result[0].forumName).toBe("General");
        });

        it("should return empty array when no matches", async () => {
            const mockQb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([])
            };
            threadRepo.createQueryBuilder!.mockReturnValue(mockQb);

            const result = await service.searchThreads("nonexistent");

            expect(result).toEqual([]);
        });
    });

    describe("getAdminFeatured", () => {
        it("should return all featured threads including inactive", async () => {
            featuredRepo.find!.mockResolvedValue([
                makeFeatured(),
                makeFeatured({ id: "feat-2", isActive: false, threadId: "thread-1" })
            ]);
            threadRepo.find!.mockResolvedValue([makeThread()]);
            userRepo.find!.mockResolvedValue([makeUser()]);
            gamificationService.getUserXpDataBatch!.mockResolvedValue(new Map());

            const result = await service.getAdminFeatured();

            expect(result).toHaveLength(2);
        });

        it("should return empty when no featured", async () => {
            featuredRepo.find!.mockResolvedValue([]);

            const result = await service.getAdminFeatured();

            expect(result).toEqual([]);
        });
    });
});
