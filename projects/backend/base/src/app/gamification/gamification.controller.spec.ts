import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

describe("GamificationController", () => {
    let controller: GamificationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamificationController],
            providers: [GamificationService]
        }).compile();

        controller = module.get<GamificationController>(GamificationController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getAllAchievements", () => {
        it("should return an array of achievements", () => {
            const result = controller.getAllAchievements();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty("id");
            expect(result[0]).toHaveProperty("points");
        });
    });

    describe("getAchievementById", () => {
        it("should return a single achievement", () => {
            const result = controller.getAchievementById("first-post");
            expect(result.id).toBe("first-post");
            expect(result.name).toBe("First Steps");
        });

        it("should throw NotFoundException for unknown id", () => {
            expect(() => controller.getAchievementById("unknown")).toThrow(NotFoundException);
        });
    });

    describe("getLeaderboard", () => {
        it("should return leaderboard entries", () => {
            const result = controller.getLeaderboard();
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty("rank");
            expect(result[0]).toHaveProperty("points");
        });

        it("should respect the limit parameter", () => {
            const result = controller.getLeaderboard(2);
            expect(result.length).toBe(2);
        });
    });

    describe("getUserProgress", () => {
        it("should return progress for a valid user", () => {
            const result = controller.getUserProgress("u1");
            expect(result.userId).toBe("u1");
            expect(result).toHaveProperty("level");
            expect(result).toHaveProperty("currentPoints");
            expect(result).toHaveProperty("pointsToNextLevel");
        });

        it("should throw NotFoundException for unknown user", () => {
            expect(() => controller.getUserProgress("unknown")).toThrow(NotFoundException);
        });
    });
});
