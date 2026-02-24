import { Test, TestingModule } from "@nestjs/testing";

import { AppService } from "./app.service";

describe("AppService", () => {
    let service: AppService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AppService]
        }).compile();

        service = module.get<AppService>(AppService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("getData", () => {
        it("should return a welcome message", () => {
            expect(service.getData()).toEqual({
                message: "Welcome to Aniverse Base API!"
            });
        });
    });

    describe("getHealth", () => {
        it("should return health status ok with a timestamp", () => {
            const result = service.getHealth();
            expect(result.status).toBe("ok");
            expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
        });
    });
});
