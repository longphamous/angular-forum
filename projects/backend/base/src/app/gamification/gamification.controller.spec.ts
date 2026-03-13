import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpEventEntity } from "./entities/xp-event.entity";

const mockUserXpRepo = { findOneBy: jest.fn(), find: jest.fn(), findBy: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockXpEventRepo = { create: jest.fn(), save: jest.fn() };

describe("GamificationController", () => {
    let controller: GamificationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamificationController],
            providers: [
                GamificationService,
                { provide: getRepositoryToken(UserXpEntity), useValue: mockUserXpRepo },
                { provide: getRepositoryToken(XpEventEntity), useValue: mockXpEventRepo }
            ]
        }).compile();

        controller = module.get<GamificationController>(GamificationController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getUserProgress", () => {
        it("should return progress for a user", async () => {
            mockUserXpRepo.findOneBy.mockResolvedValue({ userId: "u1", xp: 150, level: 2 });
            const result = await controller.getUserProgress("u1");
            expect(result).toHaveProperty("level");
            expect(result).toHaveProperty("xp");
            expect(result).toHaveProperty("levelName");
        });
    });
});
