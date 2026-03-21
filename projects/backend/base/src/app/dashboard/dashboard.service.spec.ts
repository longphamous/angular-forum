import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";

import { DashboardService } from "./dashboard.service";

const ANIME_DB_CONNECTION = "anime-db";

describe("DashboardService", () => {
    let service: DashboardService;
    let db: { query: jest.Mock };
    let animeDb: { query: jest.Mock };

    beforeEach(async () => {
        jest.clearAllMocks();
        db = { query: jest.fn() };
        animeDb = { query: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: getDataSourceToken(), useValue: db },
                { provide: getDataSourceToken(ANIME_DB_CONNECTION), useValue: animeDb }
            ]
        }).compile();

        service = module.get<DashboardService>(DashboardService);
    });

    describe("getStats", () => {
        it("should return combined stats from forum and anime databases", async () => {
            db.query.mockResolvedValue([{ user_count: "150", thread_count: "42", post_count: "300" }]);
            animeDb.query.mockResolvedValue([{ anime_count: "500" }]);

            const result = await service.getStats();

            expect(result).toEqual({
                animeCount: 500,
                postCount: 300,
                threadCount: 42,
                userCount: 150
            });
        });

        it("should handle zero counts", async () => {
            db.query.mockResolvedValue([{ user_count: "0", thread_count: "0", post_count: "0" }]);
            animeDb.query.mockResolvedValue([{ anime_count: "0" }]);

            const result = await service.getStats();

            expect(result.userCount).toBe(0);
            expect(result.animeCount).toBe(0);
        });
    });

    describe("getRecentThreads", () => {
        it("should return recent threads with formatted data", async () => {
            db.query.mockResolvedValue([
                {
                    id: "thread-1",
                    title: "Test Thread",
                    reply_count: "5",
                    last_post_at: "2026-03-01T10:00:00Z",
                    forum_name: "General",
                    author_name: "User One"
                }
            ]);

            const result = await service.getRecentThreads(10);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                authorName: "User One",
                forumName: "General",
                id: "thread-1",
                lastPostAt: "2026-03-01T10:00:00Z",
                replyCount: 5,
                title: "Test Thread"
            });
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [10]);
        });

        it("should use default limit of 10", async () => {
            db.query.mockResolvedValue([]);

            await service.getRecentThreads();

            expect(db.query).toHaveBeenCalledWith(expect.any(String), [10]);
        });

        it("should handle null last_post_at", async () => {
            db.query.mockResolvedValue([
                {
                    id: "thread-1",
                    title: "New Thread",
                    reply_count: "0",
                    last_post_at: null,
                    forum_name: "General",
                    author_name: "User"
                }
            ]);

            const result = await service.getRecentThreads();

            expect(result[0].lastPostAt).toBe(new Date(0).toISOString());
        });
    });

    describe("getTopPosters", () => {
        it("should return top posters with formatted data", async () => {
            db.query.mockResolvedValue([
                {
                    user_id: "user-1",
                    username: "topuser",
                    display_name: "Top User",
                    post_count: "99"
                }
            ]);

            const result = await service.getTopPosters(5);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                displayName: "Top User",
                postCount: 99,
                userId: "user-1",
                username: "topuser"
            });
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [5]);
        });

        it("should use default limit of 10", async () => {
            db.query.mockResolvedValue([]);

            await service.getTopPosters();

            expect(db.query).toHaveBeenCalledWith(expect.any(String), [10]);
        });

        it("should return empty array when no posters", async () => {
            db.query.mockResolvedValue([]);

            const result = await service.getTopPosters();

            expect(result).toEqual([]);
        });
    });
});
