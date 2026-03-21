import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { ActivityService, EnrichedActivity } from "./activity.service";
import { ActivityEntity, ActivityType } from "./entities/activity.entity";

const mockActivityRepo = (): Partial<Record<keyof Repository<ActivityEntity>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockUserRepo = (): Partial<Record<keyof Repository<UserEntity>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn()
});

describe("ActivityService", () => {
    let service: ActivityService;
    let activityRepo: ReturnType<typeof mockActivityRepo>;
    let userRepo: ReturnType<typeof mockUserRepo>;

    beforeEach(async () => {
        jest.clearAllMocks();
        activityRepo = mockActivityRepo();
        userRepo = mockUserRepo();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActivityService,
                { provide: getRepositoryToken(ActivityEntity), useValue: activityRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo }
            ]
        }).compile();

        service = module.get<ActivityService>(ActivityService);
    });

    describe("create", () => {
        it("should create and save an activity with all fields", async () => {
            const activityData = {
                userId: "user-1",
                type: "thread_created" as ActivityType,
                title: "New Thread",
                description: "A description",
                link: "/threads/1",
                metadata: { key: "value" }
            };

            const createdEntity = { ...activityData, id: "activity-1" };
            activityRepo.create!.mockReturnValue(createdEntity);
            activityRepo.save!.mockResolvedValue(createdEntity);

            await service.create(
                activityData.userId,
                activityData.type,
                activityData.title,
                activityData.description,
                activityData.link,
                activityData.metadata
            );

            expect(activityRepo.create).toHaveBeenCalledWith({
                userId: "user-1",
                type: "thread_created",
                title: "New Thread",
                description: "A description",
                link: "/threads/1",
                metadata: { key: "value" }
            });
            expect(activityRepo.save).toHaveBeenCalledWith(createdEntity);
        });

        it("should default optional fields to null", async () => {
            const createdEntity = { id: "activity-1" };
            activityRepo.create!.mockReturnValue(createdEntity);
            activityRepo.save!.mockResolvedValue(createdEntity);

            await service.create("user-1", "post_created", "New Post");

            expect(activityRepo.create).toHaveBeenCalledWith({
                userId: "user-1",
                type: "post_created",
                title: "New Post",
                description: null,
                link: null,
                metadata: null
            });
        });
    });

    describe("getGlobalFeed", () => {
        it("should return enriched activities ordered by createdAt DESC", async () => {
            const now = new Date();
            const activities: Partial<ActivityEntity>[] = [
                {
                    id: "a-1",
                    userId: "user-1",
                    type: "thread_created",
                    title: "Thread",
                    description: null,
                    link: null,
                    metadata: null,
                    createdAt: now
                }
            ];

            activityRepo.find!.mockResolvedValue(activities);

            const mockQb = {
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([
                    {
                        id: "user-1",
                        username: "testuser",
                        displayName: "Test User",
                        avatarUrl: "avatar.png"
                    }
                ])
            };
            userRepo.createQueryBuilder!.mockReturnValue(mockQb);

            const result = await service.getGlobalFeed(20, 0);

            expect(activityRepo.find).toHaveBeenCalledWith({
                order: { createdAt: "DESC" },
                take: 20,
                skip: 0
            });
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual<EnrichedActivity>({
                id: "a-1",
                userId: "user-1",
                username: "testuser",
                displayName: "Test User",
                avatarUrl: "avatar.png",
                type: "thread_created",
                title: "Thread",
                description: null,
                link: null,
                metadata: null,
                createdAt: now.toISOString()
            });
        });

        it("should return empty array when no activities", async () => {
            activityRepo.find!.mockResolvedValue([]);

            const result = await service.getGlobalFeed();

            expect(result).toEqual([]);
            expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
        });
    });

    describe("getUserFeed", () => {
        it("should filter activities by userId", async () => {
            activityRepo.find!.mockResolvedValue([]);

            const result = await service.getUserFeed("user-1", 10, 5);

            expect(activityRepo.find).toHaveBeenCalledWith({
                where: { userId: "user-1" },
                order: { createdAt: "DESC" },
                take: 10,
                skip: 5
            });
            expect(result).toEqual([]);
        });
    });

    describe("enrichActivities (via getGlobalFeed)", () => {
        it("should handle missing users gracefully", async () => {
            const now = new Date();
            const activities: Partial<ActivityEntity>[] = [
                {
                    id: "a-1",
                    userId: "user-missing",
                    type: "thread_created",
                    title: "Thread",
                    description: null,
                    link: null,
                    metadata: null,
                    createdAt: now
                }
            ];

            activityRepo.find!.mockResolvedValue(activities);

            const mockQb = {
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([])
            };
            userRepo.createQueryBuilder!.mockReturnValue(mockQb);

            const result = await service.getGlobalFeed();

            expect(result[0].username).toBe("unknown");
            expect(result[0].displayName).toBe("Unknown");
            expect(result[0].avatarUrl).toBeNull();
        });

        it("should use displayName when available, fallback to username", async () => {
            const now = new Date();
            const activities: Partial<ActivityEntity>[] = [
                {
                    id: "a-1",
                    userId: "user-1",
                    type: "post_created",
                    title: "Post",
                    description: null,
                    link: null,
                    metadata: null,
                    createdAt: now
                }
            ];

            activityRepo.find!.mockResolvedValue(activities);

            const mockQb = {
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([
                    {
                        id: "user-1",
                        username: "testuser",
                        displayName: undefined,
                        avatarUrl: null
                    }
                ])
            };
            userRepo.createQueryBuilder!.mockReturnValue(mockQb);

            const result = await service.getGlobalFeed();

            expect(result[0].displayName).toBe("testuser");
        });
    });
});
