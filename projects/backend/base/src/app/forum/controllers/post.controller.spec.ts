import { Test, TestingModule } from "@nestjs/testing";

import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { PaginatedResult, PostDto } from "../models/forum.model";
import { PostService } from "../services/post.service";
import { PostController } from "./post.controller";

const mockPostService: Partial<jest.Mocked<PostService>> = {
    findByThread: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    react: jest.fn(),
    unreact: jest.fn(),
    getMyReactions: jest.fn(),
    markBestAnswer: jest.fn(),
    toggleHighlight: jest.fn()
};

const authUser: AuthenticatedUser = { userId: "user-1", username: "alice", role: "member" };
const now = new Date().toISOString();

const makePostDto = (overrides: Partial<PostDto> = {}): PostDto => ({
    id: "post-1",
    threadId: "thread-1",
    authorId: "user-1",
    authorName: "Alice",
    authorRole: "member",
    authorPostCount: 5,
    authorLevel: 1,
    authorLevelName: "Neuling",
    content: "<p>Hello</p>",
    isFirstPost: false,
    isBestAnswer: false,
    isHighlighted: false,
    isEdited: false,
    editCount: 0,
    reactionCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
});

describe("PostController", () => {
    let controller: PostController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PostController],
            providers: [{ provide: PostService, useValue: mockPostService }]
        }).compile();

        controller = module.get<PostController>(PostController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    // ─── findByThread ───────────────────────────────────────────────────────────

    describe("findByThread", () => {
        it("should pass viewerId from authenticated user to the service", async () => {
            const result: PaginatedResult<PostDto> = { data: [makePostDto()], total: 1, page: 1, limit: 20 };
            (mockPostService.findByThread as jest.Mock).mockResolvedValue(result);

            await controller.findByThread("thread-1", { page: 1, limit: 20 }, authUser);

            expect(mockPostService.findByThread).toHaveBeenCalledWith("thread-1", { page: 1, limit: 20 }, "user-1");
        });

        it("should pass undefined viewerId when user is not authenticated", async () => {
            const result: PaginatedResult<PostDto> = { data: [], total: 0, page: 1, limit: 20 };
            (mockPostService.findByThread as jest.Mock).mockResolvedValue(result);

            await controller.findByThread("thread-1", { page: 1, limit: 20 }, undefined);

            expect(mockPostService.findByThread).toHaveBeenCalledWith("thread-1", { page: 1, limit: 20 }, undefined);
        });
    });

    // ─── findById ───────────────────────────────────────────────────────────────

    describe("findById", () => {
        it("should delegate to postService.findById", async () => {
            const post = makePostDto();
            (mockPostService.findById as jest.Mock).mockResolvedValue(post);

            const result = await controller.findById("post-1");

            expect(mockPostService.findById).toHaveBeenCalledWith("post-1");
            expect(result.id).toBe("post-1");
        });
    });

    // ─── create ─────────────────────────────────────────────────────────────────

    describe("create", () => {
        it("should pass threadId, user and dto to the service", async () => {
            const post = makePostDto();
            (mockPostService.create as jest.Mock).mockResolvedValue(post);

            const result = await controller.create("thread-1", { content: "Hello" }, authUser);

            expect(mockPostService.create).toHaveBeenCalledWith("thread-1", "user-1", { content: "Hello" });
            expect(result).toEqual(post);
        });
    });

    // ─── update ─────────────────────────────────────────────────────────────────

    describe("update", () => {
        it("should pass id, dto, userId and role to the service", async () => {
            const post = makePostDto({ isEdited: true });
            (mockPostService.update as jest.Mock).mockResolvedValue(post);

            const result = await controller.update("post-1", { content: "Updated" }, authUser);

            expect(mockPostService.update).toHaveBeenCalledWith("post-1", { content: "Updated" }, "user-1", "member");
            expect(result.isEdited).toBe(true);
        });
    });

    // ─── remove ─────────────────────────────────────────────────────────────────

    describe("remove", () => {
        it("should delegate to postService.remove and return success", async () => {
            (mockPostService.remove as jest.Mock).mockResolvedValue(undefined);

            const result = await controller.remove("post-1", authUser);

            expect(mockPostService.remove).toHaveBeenCalledWith("post-1", "user-1", "member");
            expect(result).toEqual({ success: true });
        });
    });

    // ─── markBestAnswer ─────────────────────────────────────────────────────────

    describe("markBestAnswer", () => {
        it("should delegate to postService.markBestAnswer", async () => {
            const post = makePostDto({ isBestAnswer: true });
            (mockPostService.markBestAnswer as jest.Mock).mockResolvedValue(post);

            const result = await controller.markBestAnswer("thread-1", "post-1", authUser);

            expect(mockPostService.markBestAnswer).toHaveBeenCalledWith("thread-1", "post-1", "user-1");
            expect(result.isBestAnswer).toBe(true);
        });
    });

    // ─── toggleHighlight ────────────────────────────────────────────────────────

    describe("toggleHighlight", () => {
        it("should delegate to postService.toggleHighlight", async () => {
            const post = makePostDto({ isHighlighted: true });
            (mockPostService.toggleHighlight as jest.Mock).mockResolvedValue(post);

            const result = await controller.toggleHighlight("post-1", authUser);

            expect(mockPostService.toggleHighlight).toHaveBeenCalledWith("post-1", "user-1", "member");
            expect(result.isHighlighted).toBe(true);
        });
    });

    // ─── react ──────────────────────────────────────────────────────────────────

    describe("react", () => {
        it("should delegate to postService.react", async () => {
            const reaction = { id: "r-1", postId: "post-1", userId: "user-1", reactionType: "like", createdAt: now };
            (mockPostService.react as jest.Mock).mockResolvedValue(reaction);

            const result = await controller.react("post-1", { reactionType: "like" }, authUser);

            expect(mockPostService.react).toHaveBeenCalledWith("post-1", "user-1", { reactionType: "like" });
            expect(result).toEqual(reaction);
        });
    });

    // ─── unreact ────────────────────────────────────────────────────────────────

    describe("unreact", () => {
        it("should delegate to postService.unreact and return success", async () => {
            (mockPostService.unreact as jest.Mock).mockResolvedValue(undefined);

            const result = await controller.unreact("post-1", authUser);

            expect(mockPostService.unreact).toHaveBeenCalledWith("post-1", "user-1");
            expect(result).toEqual({ success: true });
        });
    });

    // ─── getMyReactions ─────────────────────────────────────────────────────────

    describe("getMyReactions", () => {
        it("should delegate to postService.getMyReactions", async () => {
            (mockPostService.getMyReactions as jest.Mock).mockResolvedValue(["post-1", "post-2"]);

            const result = await controller.getMyReactions("thread-1", authUser);

            expect(mockPostService.getMyReactions).toHaveBeenCalledWith("thread-1", "user-1");
            expect(result).toEqual(["post-1", "post-2"]);
        });
    });
});
