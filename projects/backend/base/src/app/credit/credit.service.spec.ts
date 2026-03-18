import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";

import { CreditService } from "./credit.service";
import { UserWalletEntity } from "./entities/user-wallet.entity";
import { WalletTransactionEntity } from "./entities/wallet-transaction.entity";

const mockWalletRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findBy: jest.fn(),
    findAndCount: jest.fn()
};

const mockTxRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn()
};

const mockDataSource = {
    query: jest.fn()
};

function makeWallet(userId: string, balance: number): UserWalletEntity {
    return Object.assign(new UserWalletEntity(), {
        id: `wallet-${userId}`,
        userId,
        balance,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

function makeTx(overrides: Partial<WalletTransactionEntity> = {}): WalletTransactionEntity {
    return Object.assign(new WalletTransactionEntity(), {
        id: "tx-1",
        fromUserId: null,
        toUserId: "user-1",
        amount: 10,
        type: "deposit",
        description: "Test",
        createdAt: new Date(),
        ...overrides
    });
}

describe("CreditService", () => {
    let service: CreditService;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Default: wallet not found → create new one
        mockWalletRepo.findOneBy.mockResolvedValue(null);
        mockWalletRepo.create.mockImplementation((data: Partial<UserWalletEntity>) =>
            makeWallet(data.userId!, data.balance ?? 0)
        );
        mockWalletRepo.save.mockImplementation((w: UserWalletEntity | UserWalletEntity[]) =>
            Promise.resolve(Array.isArray(w) ? w : w)
        );
        mockTxRepo.create.mockImplementation((data: Partial<WalletTransactionEntity>) => makeTx(data));
        mockTxRepo.save.mockImplementation((tx: WalletTransactionEntity) => Promise.resolve(tx));

        // Suppress onModuleInit SQL during tests
        mockDataSource.query.mockResolvedValue([]);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreditService,
                { provide: getRepositoryToken(UserWalletEntity), useValue: mockWalletRepo },
                { provide: getRepositoryToken(WalletTransactionEntity), useValue: mockTxRepo },
                { provide: getDataSourceToken(), useValue: mockDataSource }
            ]
        }).compile();

        service = module.get<CreditService>(CreditService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    // ─── Coin config ───────────────────────────────────────────────────────────

    describe("getCoinConfig", () => {
        it("should return a deep copy of the default config", () => {
            const config = service.getCoinConfig();
            expect(config.enabled).toBe(true);
            expect(config.threadCreate.amount).toBe(5);
            expect(config.postReply.amount).toBe(2);
        });

        it("should not allow external mutation of the internal config", () => {
            const config = service.getCoinConfig();
            config.threadCreate.amount = 999;
            expect(service.getCoinConfig().threadCreate.amount).toBe(5);
        });
    });

    describe("updateCoinConfig", () => {
        it("should merge partial updates into the config", () => {
            service.updateCoinConfig({ enabled: false });
            expect(service.getCoinConfig().enabled).toBe(false);
        });
    });

    // ─── Deposit ───────────────────────────────────────────────────────────────

    describe("deposit", () => {
        it("should increase wallet balance and record a deposit transaction", async () => {
            const wallet = makeWallet("user-1", 50);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            const result = await service.deposit("user-1", 20, "Test deposit");

            expect(wallet.balance).toBe(70);
            expect(mockWalletRepo.save).toHaveBeenCalledWith(wallet);
            expect(result.type).toBe("deposit");
            expect(result.amount).toBe(20);
        });

        it("should throw BadRequestException for non-positive amount", async () => {
            await expect(service.deposit("user-1", 0)).rejects.toThrow(BadRequestException);
            await expect(service.deposit("user-1", -5)).rejects.toThrow(BadRequestException);
        });

        it("should throw BadRequestException for non-integer amount", async () => {
            await expect(service.deposit("user-1", 1.5)).rejects.toThrow(BadRequestException);
        });
    });

    // ─── Withdraw ──────────────────────────────────────────────────────────────

    describe("withdraw", () => {
        it("should decrease wallet balance and record a withdrawal", async () => {
            const wallet = makeWallet("user-1", 100);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            const result = await service.withdraw("user-1", 30);

            expect(wallet.balance).toBe(70);
            expect(result.type).toBe("withdrawal");
        });

        it("should throw BadRequestException when balance is insufficient", async () => {
            const wallet = makeWallet("user-1", 10);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            await expect(service.withdraw("user-1", 50)).rejects.toThrow(BadRequestException);
        });
    });

    // ─── Transfer ──────────────────────────────────────────────────────────────

    describe("transfer", () => {
        it("should move funds from sender to receiver", async () => {
            const sender = makeWallet("sender-1", 100);
            const receiver = makeWallet("receiver-1", 20);
            mockWalletRepo.findOneBy.mockResolvedValueOnce(sender).mockResolvedValueOnce(receiver);

            const result = await service.transfer("sender-1", "receiver-1", 40, "Test transfer");

            expect(sender.balance).toBe(60);
            expect(receiver.balance).toBe(60);
            expect(result.type).toBe("transfer");
            expect(result.amount).toBe(40);
        });

        it("should throw BadRequestException when transferring to yourself", async () => {
            await expect(service.transfer("user-1", "user-1", 10)).rejects.toThrow(BadRequestException);
        });

        it("should throw BadRequestException when sender has insufficient balance", async () => {
            const sender = makeWallet("sender-1", 5);
            mockWalletRepo.findOneBy.mockResolvedValueOnce(sender);

            await expect(service.transfer("sender-1", "receiver-1", 10)).rejects.toThrow(BadRequestException);
        });
    });

    // ─── Reward ────────────────────────────────────────────────────────────────

    describe("reward", () => {
        it("should increase balance and record a reward transaction", async () => {
            const wallet = makeWallet("user-1", 0);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            const result = await service.reward("user-1", 10);

            expect(wallet.balance).toBe(10);
            expect(result.type).toBe("reward");
        });
    });

    // ─── Admin transfer ────────────────────────────────────────────────────────

    describe("adminTransfer", () => {
        it("should reward user and record transaction when type is reward", async () => {
            const wallet = makeWallet("user-1", 0);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            const result = await service.adminTransfer("admin-1", {
                toUserId: "user-1",
                amount: 50,
                type: "reward",
                description: "Admin reward"
            });

            expect(wallet.balance).toBe(50);
            expect(result.amount).toBe(50);
        });

        it("should deduct from user wallet when type is penalty", async () => {
            const wallet = makeWallet("user-1", 100);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            await service.adminTransfer("admin-1", {
                toUserId: "user-1",
                amount: 30,
                type: "penalty",
                description: "Penalty"
            });

            expect(wallet.balance).toBe(70);
        });

        it("should floor balance at 0 when penalty exceeds balance", async () => {
            const wallet = makeWallet("user-1", 10);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            await service.adminTransfer("admin-1", {
                toUserId: "user-1",
                amount: 100,
                type: "penalty",
                description: "Big penalty"
            });

            expect(wallet.balance).toBe(0);
        });
    });

    // ─── Get wallet ────────────────────────────────────────────────────────────

    describe("getWallet", () => {
        it("should return a WalletDto for an existing wallet", async () => {
            const wallet = makeWallet("user-1", 42);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            const result = await service.getWallet("user-1");

            expect(result.userId).toBe("user-1");
            expect(result.balance).toBe(42);
            expect(result.createdAt).toBeDefined();
        });

        it("should create a wallet if none exists and return it", async () => {
            mockWalletRepo.findOneBy.mockResolvedValue(null);
            const newWallet = makeWallet("new-user", 0);
            mockWalletRepo.save.mockResolvedValue(newWallet);

            const result = await service.getWallet("new-user");

            expect(mockWalletRepo.create).toHaveBeenCalledWith({ userId: "new-user", balance: 0 });
            expect(result.balance).toBe(0);
        });
    });

    // ─── Transactions ──────────────────────────────────────────────────────────

    describe("getTransactions", () => {
        it("should return paginated transactions", async () => {
            const tx = makeTx({ toUserId: "user-1" });
            mockTxRepo.findAndCount.mockResolvedValue([[tx], 1]);

            const result = await service.getTransactions("user-1", 1, 20);

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });
    });

    // ─── Leaderboard ───────────────────────────────────────────────────────────

    describe("getLeaderboard", () => {
        it("should return the top users by balance", async () => {
            mockDataSource.query.mockResolvedValue([
                { user_id: "u1", display_name: "Alice", username: "alice", balance: 500 },
                { user_id: "u2", display_name: "Bob", username: "bob", balance: 300 }
            ]);

            const result = await service.getLeaderboard(5);

            expect(result).toHaveLength(2);
            expect(result[0].userId).toBe("u1");
            expect(result[0].balance).toBe(500);
        });
    });

    // ─── Get balances ──────────────────────────────────────────────────────────

    describe("getBalances", () => {
        it("should return an empty map for an empty input", async () => {
            const result = await service.getBalances([]);
            expect(result.size).toBe(0);
        });

        it("should return a map of userId to balance", async () => {
            mockWalletRepo.findBy.mockResolvedValue([makeWallet("u1", 100), makeWallet("u2", 200)]);

            const result = await service.getBalances(["u1", "u2"]);

            expect(result.get("u1")).toBe(100);
            expect(result.get("u2")).toBe(200);
        });
    });

    // ─── Recalculate ───────────────────────────────────────────────────────────

    describe("recalculateAll", () => {
        it("should return disabled message when coin earning is globally off", async () => {
            service.updateCoinConfig({ enabled: false });

            const result = await service.recalculateAll();

            expect(result.usersProcessed).toBe(0);
            expect(result.message).toContain("disabled");
        });

        it("should process users and update wallet balances", async () => {
            service.updateCoinConfig({ enabled: true });

            mockDataSource.query.mockResolvedValue([
                {
                    user_id: "u1",
                    post_count: "10",
                    thread_count: "2",
                    reactions_received: "5",
                    reactions_given: "3",
                    blog_post_count: "1",
                    gallery_count: "4"
                }
            ]);

            const wallet = makeWallet("u1", 0);
            mockWalletRepo.findOneBy.mockResolvedValue(wallet);

            const result = await service.recalculateAll();

            expect(result.usersProcessed).toBe(1);
            expect(result.totalCoinsAwarded).toBeGreaterThan(0);
        });

        it("should handle SQL errors gracefully and return failure message", async () => {
            service.updateCoinConfig({ enabled: true });
            mockDataSource.query.mockRejectedValue(new Error("DB error"));

            const result = await service.recalculateAll();

            expect(result.usersProcessed).toBe(0);
            expect(result.message).toContain("failed");
        });
    });
});
