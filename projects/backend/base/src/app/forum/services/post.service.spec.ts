import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { CreditService } from "../../credit/credit.service";
import { GamificationService } from "../../gamification/gamification.service";
import { UserXpData } from "../../gamification/level.config";
import { PushService } from "../../push/push.service";
import { UserEntity, UserRole } from "../../user/entities/user.entity";
import { ForumEntity } from "../entities/forum.entity";
import { ForumPostEntity } from "../entities/post.entity";
import { ForumPostReactionEntity } from "../entities/post-reaction.entity";
import { ForumThreadEntity } from "../entities/thread.entity";
import { PostService } from "./post.service";

// ─── Mock helpers ────────────────────────────────────────────────────────────

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    softDelete: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockGamificationService = {
    getUserXpDataBatch: jest.fn(),
    awardXp: jest.fn()
};

const mockCreditService = {
    getBalances: jest.fn(),
    addCredits: jest.fn()
};

const mockPushService = {
    sendToThread: jest.fn()
};

// ─── Factories ───────────────────────────────────────────────────────────────

const now = new Date("2026-01-15T12:00:00.000Z");

const makePost = (overrides: Partial<ForumPostEntity> = {}): ForumPostEntity =>
    ({
        id: "post-1",
        threadId: "thread-1",
        authorId: "user-1",
        content: "<p>Hello</p>",
        isFirstPost: false,
        isBestAnswer: false,
        isHighlighted: false,
        highlightedBy: undefined,
        knowledgeSource: undefined,
        isEdited: false,
        editedAt: undefined,
        editCount: 0,
        editReason: undefined,
        editHistory: [],
        reactionCount: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides
    }) as ForumPostEntity;

const makeUser = (overrides: Partial<UserEntity> = {}): Partial<UserEntity> => ({
    id: "user-1",
    displayName: "TestUser",
    role: "member" as UserRole,
    avatarUrl: undefined,
    signature: undefined,
    gender: "male",
    profileFieldSettings: undefined,
    ...overrides
});

const makeThread = (overrides: Partial<ForumThreadEntity> = {}): ForumThreadEntity =>
    ({
        id: "thread-1",
        forumId: "forum-1",
        authorId: "user-1",
        title: "Test Thread",
        slug: "test-thread",
        isPinned: false,
        isLocked: false,
        isSticky: false,
        viewCount: 0,
        replyCount: 5,
        bestAnswerPostId: undefined,
        createdAt: now,
        updatedAt: now,
        ...overrides
    }) as ForumThreadEntity;

const makeForum = (overrides: Partial<ForumEntity> = {}): ForumEntity =>
    ({
        id: "forum-1",
        categoryId: "cat-1",
        name: "General",
        slug: "general",
        postCount: 10,
        threadCount: 3,
        createdAt: now,
        updatedAt: now,
        ...overrides
    }) as ForumEntity;

const makeReaction = (overrides: Partial<ForumPostReactionEntity> = {}): ForumPostReactionEntity =>
    ({
        id: "reaction-1",
        postId: "post-1",
        userId: "user-2",
        reactionType: "like",
        createdAt: now,
        ...overrides
    }) as ForumPostReactionEntity;

// ─── Test suite ──────────────────────────────────────────────────────────────

describe("PostService", () => {
    let service: PostService;
    let postRepo: ReturnType<typeof createMockRepo>;
    let reactionRepo: ReturnType<typeof createMockRepo>;
    let threadRepo: ReturnType<typeof createMockRepo>;
    let forumRepo: ReturnType<typeof createMockRepo>;
    let userRepo: ReturnType<typeof createMockRepo>;

    beforeEach(async () => {
        postRepo = createMockRepo();
        reactionRepo = createMockRepo();
        threadRepo = createMockRepo();
        forumRepo = createMockRepo();
        userRepo = createMockRepo();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                { provide: getRepositoryToken(ForumPostEntity), useValue: postRepo },
                { provide: getRepositoryToken(ForumPostReactionEntity), useValue: reactionRepo },
                { provide: getRepositoryToken(ForumThreadEntity), useValue: threadRepo },
                { provide: getRepositoryToken(ForumEntity), useValue: forumRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo },
                { provide: GamificationService, useValue: mockGamificationService },
                { provide: CreditService, useValue: mockCreditService },
                { provide: PushService, useValue: mockPushService }
            ]
        }).compile();

        service = module.get<PostService>(PostService);

        jest.clearAllMocks();
    });

    // ── findByThread ─────────────────────────────────────────────────────────

    function setupFindByThread(user: Partial<UserEntity>, post?: ForumPostEntity): void {
        const postEntity = post ?? makePost();
        postRepo.findAndCount!.mockResolvedValue([[postEntity], 1]);
        userRepo.find!.mockResolvedValue([user]);
        postRepo.query!.mockResolvedValue([{ author_id: postEntity.authorId, count: "5" }]);
        mockGamificationService.getUserXpDataBatch.mockResolvedValue(
            new Map<string, UserXpData>([[postEntity.authorId, { xp: 100, level: 3, levelName: "Veteran", xpToNextLevel: 200, xpProgressPercent: 50 }]])
        );
        mockCreditService.getBalances.mockResolvedValue(new Map<string, number>([[postEntity.authorId, 42]]));
    }

    it("should return paginated posts for findByThread", async () => {
        const post = makePost();
        const user = makeUser();
        setupFindByThread(user, post);

        const result = await service.findByThread("thread-1", { page: 1, limit: 10 });

        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe("post-1");
        expect(result.data[0].authorName).toBe("TestUser");
        expect(postRepo.findAndCount).toHaveBeenCalledWith({
            where: { threadId: "thread-1" },
            order: { createdAt: "ASC" },
            skip: 0,
            take: 10
        });
    });

    it("should show gender by default when profileFieldSettings is undefined", async () => {
        const user = makeUser({ gender: "male", profileFieldSettings: undefined });
        setupFindByThread(user);

        const result = await service.findByThread("thread-1", { page: 1, limit: 20 }, "viewer-1");

        expect(result.data[0].authorGender).toBe("male");
    });

    it("should show gender when visibility is set to 'everyone'", async () => {
        const user = makeUser({ gender: "female", profileFieldSettings: { gender: "everyone" } });
        setupFindByThread(user);

        const result = await service.findByThread("thread-1", { page: 1, limit: 20 }, "viewer-1");

        expect(result.data[0].authorGender).toBe("female");
    });

    it("should hide gender when visibility is set to 'nobody'", async () => {
        const user = makeUser({ gender: "male", profileFieldSettings: { gender: "nobody" } });
        setupFindByThread(user);

        const result = await service.findByThread("thread-1", { page: 1, limit: 20 }, "viewer-1");

        expect(result.data[0].authorGender).toBeUndefined();
    });

    it("should show gender for 'members' visibility when viewer is authenticated", async () => {
        const user = makeUser({ gender: "male", profileFieldSettings: { gender: "members" } });
        setupFindByThread(user);

        const result = await service.findByThread("thread-1", { page: 1, limit: 20 }, "viewer-1");

        expect(result.data[0].authorGender).toBe("male");
    });

    it("should hide gender for 'members' visibility when viewer is not authenticated", async () => {
        const user = makeUser({ gender: "male", profileFieldSettings: { gender: "members" } });
        setupFindByThread(user);

        const result = await service.findByThread("thread-1", { page: 1, limit: 20 });

        expect(result.data[0].authorGender).toBeUndefined();
    });

    // ── create ───────────────────────────────────────────────────────────────

    it("should create a post and update thread/forum counters", async () => {
        const post = makePost();
        threadRepo.findOneBy!.mockResolvedValue(makeThread());
        postRepo.create!.mockReturnValue(post);
        postRepo.save!.mockResolvedValue(post);
        threadRepo.increment!.mockResolvedValue(undefined);
        threadRepo.update!.mockResolvedValue(undefined);
        forumRepo.increment!.mockResolvedValue(undefined);
        forumRepo.update!.mockResolvedValue(undefined);
        mockGamificationService.awardXp.mockResolvedValue(undefined);
        mockCreditService.addCredits.mockResolvedValue(undefined);
        userRepo.findOneBy!.mockResolvedValue(makeUser());
        mockPushService.sendToThread.mockReturnValue(undefined);

        const result = await service.create("thread-1", "user-1", { content: "<p>Hello</p>" });

        expect(result.id).toBe("post-1");
        expect(postRepo.create).toHaveBeenCalled();
        expect(postRepo.save).toHaveBeenCalledWith(post);
        expect(threadRepo.increment).toHaveBeenCalledWith({ id: "thread-1" }, "replyCount", 1);
        expect(forumRepo.increment).toHaveBeenCalledWith({ id: "forum-1" }, "postCount", 1);
    });

    // ── update ───────────────────────────────────────────────────────────────

    it("should update post content and save edit history", async () => {
        const post = makePost({ content: "<p>Original</p>" });
        postRepo.findOneBy!.mockResolvedValue(post);
        postRepo.save!.mockImplementation(async (entity: ForumPostEntity) => entity);

        const result = await service.update("post-1", { content: "<p>Updated</p>", editReason: "typo" }, "user-1", "member");

        expect(result.content).toBe("<p>Updated</p>");
        expect(post.isEdited).toBe(true);
        expect(post.editCount).toBe(1);
        expect(post.editHistory).toHaveLength(1);
        expect(post.editHistory[0].content).toBe("<p>Original</p>");
        expect(post.editHistory[0].editedBy).toBe("user-1");
        expect(post.editHistory[0].reason).toBe("typo");
    });

    it("should throw ForbiddenException when non-owner non-mod tries to update", async () => {
        const post = makePost({ authorId: "user-1" });
        postRepo.findOneBy!.mockResolvedValue(post);

        await expect(service.update("post-1", { content: "<p>Hacked</p>" }, "user-999", "member")).rejects.toThrow(
            ForbiddenException
        );
    });

    // ── remove ───────────────────────────────────────────────────────────────

    it("should soft delete a post and update counters", async () => {
        const post = makePost();
        const thread = makeThread({ replyCount: 5 });
        const forum = makeForum({ postCount: 10 });

        postRepo.findOneBy!.mockResolvedValue(post);
        postRepo.softDelete!.mockResolvedValue(undefined);
        threadRepo.findOneBy!.mockResolvedValueOnce(thread).mockResolvedValueOnce(thread);
        threadRepo.update!.mockResolvedValue(undefined);
        forumRepo.findOneBy!.mockResolvedValue(forum);
        forumRepo.update!.mockResolvedValue(undefined);

        await service.remove("post-1", "user-1", "member");

        expect(postRepo.softDelete).toHaveBeenCalledWith("post-1");
        expect(threadRepo.update).toHaveBeenCalledWith("thread-1", { replyCount: 4 });
        expect(forumRepo.update).toHaveBeenCalledWith("forum-1", { postCount: 9 });
    });

    // ── react ────────────────────────────────────────────────────────────────

    it("should create a new reaction and increment reaction count", async () => {
        const post = makePost({ reactionCount: 0 });
        const reaction = makeReaction();

        postRepo.findOneBy!.mockResolvedValue(post);
        reactionRepo.findOneBy!.mockResolvedValue(null);
        reactionRepo.create!.mockReturnValue(reaction);
        reactionRepo.save!.mockResolvedValue(reaction);
        postRepo.increment!.mockResolvedValue(undefined);
        mockGamificationService.awardXp.mockResolvedValue(undefined);
        mockCreditService.addCredits.mockResolvedValue(undefined);

        const result = await service.react("post-1", "user-2", { reactionType: "like" });

        expect(result.reactionType).toBe("like");
        expect(reactionRepo.create).toHaveBeenCalledWith({ postId: "post-1", userId: "user-2", reactionType: "like" });
        expect(postRepo.increment).toHaveBeenCalledWith({ id: "post-1" }, "reactionCount", 1);
    });

    // ── unreact ──────────────────────────────────────────────────────────────

    it("should remove a reaction and decrement reaction count", async () => {
        const reaction = makeReaction();
        const post = makePost({ reactionCount: 3 });

        reactionRepo.findOneBy!.mockResolvedValue(reaction);
        reactionRepo.remove!.mockResolvedValue(undefined);
        postRepo.findOneBy!.mockResolvedValue(post);
        postRepo.update!.mockResolvedValue(undefined);

        await service.unreact("post-1", "user-2");

        expect(reactionRepo.remove).toHaveBeenCalledWith(reaction);
        expect(postRepo.update).toHaveBeenCalledWith("post-1", { reactionCount: 2 });
    });

    // ── markBestAnswer ───────────────────────────────────────────────────────

    it("should mark a post as best answer", async () => {
        const thread = makeThread({ authorId: "user-1", bestAnswerPostId: undefined });
        const post = makePost({ isFirstPost: false, isBestAnswer: false });

        threadRepo.findOneBy!.mockResolvedValue(thread);
        postRepo.findOneBy!.mockResolvedValue(post);
        postRepo.update!.mockResolvedValue(undefined);
        threadRepo.update!.mockResolvedValue(undefined);

        const result = await service.markBestAnswer("thread-1", "post-1", "user-1");

        expect(result.isBestAnswer).toBe(true);
        expect(threadRepo.update).toHaveBeenCalledWith("thread-1", { bestAnswerPostId: "post-1" });
        expect(postRepo.update).toHaveBeenCalledWith({ id: "post-1" }, { isBestAnswer: true });
    });

    it("should throw ForbiddenException when non-thread-author tries to mark best answer", async () => {
        const thread = makeThread({ authorId: "user-1" });
        threadRepo.findOneBy!.mockResolvedValue(thread);

        await expect(service.markBestAnswer("thread-1", "post-1", "user-999")).rejects.toThrow(ForbiddenException);
    });

    // ── toggleHighlight ──────────────────────────────────────────────────────

    it("should toggle highlight flag for admin", async () => {
        const post = makePost({ isHighlighted: false });
        postRepo.findOneBy!.mockResolvedValue(post);
        postRepo.save!.mockImplementation(async (entity: ForumPostEntity) => entity);

        const result = await service.toggleHighlight("post-1", "admin-1", "admin");

        expect(result.isHighlighted).toBe(true);
        expect(result.highlightedBy).toBe("admin-1");
    });

    it("should throw ForbiddenException when non-admin/mod tries to toggle highlight", async () => {
        await expect(service.toggleHighlight("post-1", "user-1", "member")).rejects.toThrow(ForbiddenException);
    });
});
