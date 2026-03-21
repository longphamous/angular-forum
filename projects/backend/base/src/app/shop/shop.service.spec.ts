import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { CreditService } from "../credit/credit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ShopItemEntity } from "./entities/shop-item.entity";
import { UserInventoryEntity } from "./entities/user-inventory.entity";
import { ShopService } from "./shop.service";

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
    createQueryBuilder: jest.fn()
});

const mockCreditService = (): Partial<Record<keyof CreditService, jest.Mock>> => ({
    deductCredits: jest.fn()
});

const mockNotificationsService = (): Partial<Record<keyof NotificationsService, jest.Mock>> => ({
    create: jest.fn()
});

describe("ShopService", () => {
    let service: ShopService;
    let itemRepo: ReturnType<typeof createMockRepo<ShopItemEntity>>;
    let inventoryRepo: ReturnType<typeof createMockRepo<UserInventoryEntity>>;
    let creditService: ReturnType<typeof mockCreditService>;
    let notificationsService: ReturnType<typeof mockNotificationsService>;

    const now = new Date("2026-03-01T10:00:00Z");

    const makeItem = (overrides: Partial<ShopItemEntity> = {}): Partial<ShopItemEntity> => ({
        id: "item-1",
        name: "Cool Badge",
        description: "A cool badge",
        price: 100,
        imageUrl: null,
        icon: null,
        category: "badges",
        isActive: true,
        stock: null,
        maxPerUser: null,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    const makeInventory = (overrides: Partial<UserInventoryEntity> = {}): Partial<UserInventoryEntity> => ({
        id: "inv-1",
        userId: "user-1",
        itemId: "item-1",
        quantity: 1,
        purchasedAt: now,
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        itemRepo = createMockRepo<ShopItemEntity>();
        inventoryRepo = createMockRepo<UserInventoryEntity>();
        creditService = mockCreditService();
        notificationsService = mockNotificationsService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ShopService,
                { provide: getRepositoryToken(ShopItemEntity), useValue: itemRepo },
                { provide: getRepositoryToken(UserInventoryEntity), useValue: inventoryRepo },
                { provide: CreditService, useValue: creditService },
                { provide: NotificationsService, useValue: notificationsService }
            ]
        }).compile();

        service = module.get<ShopService>(ShopService);
    });

    describe("findActive", () => {
        it("should return active shop items", async () => {
            const items = [makeItem(), makeItem({ id: "item-2", name: "Rare Badge" })];
            itemRepo.find!.mockResolvedValue(items);

            const result = await service.findActive();

            expect(result).toHaveLength(2);
            expect(itemRepo.find).toHaveBeenCalledWith({
                where: { isActive: true },
                order: { sortOrder: "ASC", createdAt: "ASC" }
            });
        });
    });

    describe("findAll", () => {
        it("should return all items including inactive", async () => {
            const items = [makeItem(), makeItem({ id: "item-2", isActive: false })];
            itemRepo.find!.mockResolvedValue(items);

            const result = await service.findAll();

            expect(result).toHaveLength(2);
            expect(itemRepo.find).toHaveBeenCalledWith({
                order: { sortOrder: "ASC", createdAt: "ASC" }
            });
        });
    });

    describe("create", () => {
        it("should create a new shop item", async () => {
            const item = makeItem();
            itemRepo.create!.mockReturnValue(item);
            itemRepo.save!.mockResolvedValue(item);

            const result = await service.create({ name: "Cool Badge", price: 100 });

            expect(itemRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Cool Badge", price: 100 })
            );
            expect(result.name).toBe("Cool Badge");
        });
    });

    describe("update", () => {
        it("should update an existing item", async () => {
            const item = makeItem();
            itemRepo.findOneBy!.mockResolvedValue(item);
            itemRepo.save!.mockImplementation((i) => Promise.resolve(i));

            const result = await service.update("item-1", { name: "Updated Badge", price: 200 });

            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when item not found", async () => {
            itemRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.update("missing", { name: "X" })).rejects.toThrow(NotFoundException);
        });
    });

    describe("delete", () => {
        it("should remove the item", async () => {
            const item = makeItem();
            itemRepo.findOneBy!.mockResolvedValue(item);
            itemRepo.remove!.mockResolvedValue(item);

            await service.delete("item-1");

            expect(itemRepo.remove).toHaveBeenCalledWith(item);
        });

        it("should throw NotFoundException when item not found", async () => {
            itemRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.delete("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("purchaseItem", () => {
        it("should purchase an item and create inventory entry", async () => {
            const item = makeItem({ stock: null, maxPerUser: null });
            itemRepo.findOneBy!.mockResolvedValue(item);
            creditService.deductCredits!.mockResolvedValue(undefined);
            notificationsService.create!.mockResolvedValue(undefined);
            inventoryRepo.findOne!.mockResolvedValue(null);
            const entry = makeInventory();
            inventoryRepo.create!.mockReturnValue(entry);
            inventoryRepo.save!.mockResolvedValue(entry);

            const result = await service.purchaseItem("user-1", "item-1");

            expect(creditService.deductCredits).toHaveBeenCalledWith("user-1", 100, "purchase", "Shop purchase: Cool Badge");
            expect(notificationsService.create).toHaveBeenCalled();
            expect(result.itemId).toBe("item-1");
        });

        it("should increment quantity when item already owned", async () => {
            const item = makeItem();
            itemRepo.findOneBy!.mockResolvedValue(item);
            creditService.deductCredits!.mockResolvedValue(undefined);
            notificationsService.create!.mockResolvedValue(undefined);
            const existing = makeInventory({ quantity: 1 });
            inventoryRepo.findOne!.mockResolvedValue(existing);
            inventoryRepo.save!.mockImplementation((e) => Promise.resolve(e));

            const result = await service.purchaseItem("user-1", "item-1");

            expect(existing.quantity).toBe(2);
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when item not found or inactive", async () => {
            itemRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.purchaseItem("user-1", "missing")).rejects.toThrow(NotFoundException);
        });

        it("should throw BadRequestException when item is out of stock", async () => {
            itemRepo.findOneBy!.mockResolvedValue(makeItem({ stock: 0 }));

            await expect(service.purchaseItem("user-1", "item-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw BadRequestException when max per user reached", async () => {
            itemRepo.findOneBy!.mockResolvedValue(makeItem({ maxPerUser: 1 }));
            inventoryRepo.count!.mockResolvedValue(1);

            await expect(service.purchaseItem("user-1", "item-1")).rejects.toThrow(BadRequestException);
        });

        it("should decrement stock after purchase", async () => {
            const item = makeItem({ stock: 5 });
            itemRepo.findOneBy!.mockResolvedValue(item);
            creditService.deductCredits!.mockResolvedValue(undefined);
            notificationsService.create!.mockResolvedValue(undefined);
            inventoryRepo.findOne!.mockResolvedValue(null);
            const entry = makeInventory();
            inventoryRepo.create!.mockReturnValue(entry);
            inventoryRepo.save!.mockResolvedValue(entry);
            itemRepo.save!.mockResolvedValue(item);

            await service.purchaseItem("user-1", "item-1");

            expect(item.stock).toBe(4);
            expect(itemRepo.save).toHaveBeenCalledWith(item);
        });
    });

    describe("getUserInventory", () => {
        it("should return user inventory with item details", async () => {
            const entries = [makeInventory()];
            inventoryRepo.find!.mockResolvedValue(entries);
            itemRepo.findByIds!.mockResolvedValue([makeItem()]);

            const result = await service.getUserInventory("user-1");

            expect(result).toHaveLength(1);
            expect(result[0].item.name).toBe("Cool Badge");
        });

        it("should return empty array when no inventory", async () => {
            inventoryRepo.find!.mockResolvedValue([]);

            const result = await service.getUserInventory("user-1");

            expect(result).toEqual([]);
        });
    });

    describe("getAllInventory", () => {
        it("should return all inventory entries", async () => {
            const entries = [makeInventory(), makeInventory({ id: "inv-2", userId: "user-2" })];
            inventoryRepo.find!.mockResolvedValue(entries);
            itemRepo.findByIds!.mockResolvedValue([makeItem()]);

            const result = await service.getAllInventory();

            expect(result).toHaveLength(2);
        });
    });
});
