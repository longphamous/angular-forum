import { Test, TestingModule } from "@nestjs/testing";

import { AuthenticatedUser } from "../auth/models/jwt.model";
import { CreditController } from "./credit.controller";
import {
    AdminTransferDto,
    CoinEarnConfig,
    CreditService,
    PaginatedTransactions,
    RecalculateReport,
    TransactionDto,
    WalletDto,
    WalletLeaderboardEntry
} from "./credit.service";

const mockCreditService: Partial<jest.Mocked<CreditService>> = {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    transfer: jest.fn(),
    getLeaderboard: jest.fn(),
    deposit: jest.fn(),
    reward: jest.fn(),
    getCoinConfig: jest.fn(),
    updateCoinConfig: jest.fn(),
    adminTransfer: jest.fn(),
    getAllWallets: jest.fn(),
    getAllTransactions: jest.fn(),
    recalculateAll: jest.fn()
};

const authUser: AuthenticatedUser = { userId: "user-1", username: "alice", role: "member" };
const adminUser: AuthenticatedUser = { userId: "admin-1", username: "admin", role: "admin" };

const walletDto: WalletDto = {
    id: "wallet-1",
    userId: "user-1",
    balance: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const txDto: TransactionDto = {
    id: "tx-1",
    fromUserId: null,
    toUserId: "user-1",
    amount: 50,
    type: "deposit",
    description: "Test",
    createdAt: new Date().toISOString()
};

const paginatedTx: PaginatedTransactions = { data: [txDto], total: 1, page: 1, limit: 20 };

describe("CreditController", () => {
    let controller: CreditController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CreditController],
            providers: [{ provide: CreditService, useValue: mockCreditService }]
        }).compile();

        controller = module.get<CreditController>(CreditController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    // ─── Own wallet endpoints ──────────────────────────────────────────────────

    describe("getMyWallet", () => {
        it("should delegate to creditService.getWallet with the caller's userId", async () => {
            (mockCreditService.getWallet as jest.Mock).mockResolvedValue(walletDto);

            const result = await controller.getMyWallet(authUser);

            expect(mockCreditService.getWallet).toHaveBeenCalledWith("user-1");
            expect(result).toEqual(walletDto);
        });
    });

    describe("getMyTransactions", () => {
        it("should use default page=1 and limit=20 when query params are absent", async () => {
            (mockCreditService.getTransactions as jest.Mock).mockResolvedValue(paginatedTx);

            const result = await controller.getMyTransactions(authUser);

            expect(mockCreditService.getTransactions).toHaveBeenCalledWith("user-1", 1, 20);
            expect(result).toEqual(paginatedTx);
        });

        it("should parse page and limit from query params", async () => {
            (mockCreditService.getTransactions as jest.Mock).mockResolvedValue(paginatedTx);

            await controller.getMyTransactions(authUser, "2", "10");

            expect(mockCreditService.getTransactions).toHaveBeenCalledWith("user-1", 2, 10);
        });
    });

    describe("transfer", () => {
        it("should call creditService.transfer with caller's userId and body", async () => {
            (mockCreditService.transfer as jest.Mock).mockResolvedValue(txDto);

            const result = await controller.transfer(authUser, {
                toUserId: "user-2",
                amount: 50,
                description: "Gift"
            });

            expect(mockCreditService.transfer).toHaveBeenCalledWith("user-1", "user-2", 50, "Gift");
            expect(result).toEqual(txDto);
        });
    });

    // ─── Public leaderboard ───────────────────────────────────────────────────

    describe("getLeaderboard", () => {
        it("should return leaderboard with default limit of 5", async () => {
            const leaderboard: WalletLeaderboardEntry[] = [
                { userId: "u1", displayName: "Alice", username: "alice", balance: 500 }
            ];
            (mockCreditService.getLeaderboard as jest.Mock).mockResolvedValue(leaderboard);

            const result = await controller.getLeaderboard();

            expect(mockCreditService.getLeaderboard).toHaveBeenCalledWith(5);
            expect(result).toEqual(leaderboard);
        });

        it("should parse limit from query param", async () => {
            (mockCreditService.getLeaderboard as jest.Mock).mockResolvedValue([]);

            await controller.getLeaderboard("10");

            expect(mockCreditService.getLeaderboard).toHaveBeenCalledWith(10);
        });
    });

    // ─── Admin endpoints ───────────────────────────────────────────────────────

    describe("deposit", () => {
        it("should delegate to creditService.deposit", async () => {
            (mockCreditService.deposit as jest.Mock).mockResolvedValue(txDto);

            const result = await controller.deposit({ userId: "user-1", amount: 100, description: "Top up" });

            expect(mockCreditService.deposit).toHaveBeenCalledWith("user-1", 100, "Top up");
            expect(result).toEqual(txDto);
        });
    });

    describe("reward", () => {
        it("should delegate to creditService.reward", async () => {
            (mockCreditService.reward as jest.Mock).mockResolvedValue(txDto);

            const result = await controller.reward({ userId: "user-1", amount: 25 });

            expect(mockCreditService.reward).toHaveBeenCalledWith("user-1", 25, undefined);
            expect(result).toEqual(txDto);
        });
    });

    describe("getCoinConfig", () => {
        it("should return the current coin config", () => {
            const config = { enabled: true } as CoinEarnConfig;
            (mockCreditService.getCoinConfig as jest.Mock).mockReturnValue(config);

            const result = controller.getCoinConfig();

            expect(result).toEqual(config);
        });
    });

    describe("updateCoinConfig", () => {
        it("should merge and return the updated coin config", () => {
            const updated = { enabled: false } as CoinEarnConfig;
            (mockCreditService.updateCoinConfig as jest.Mock).mockReturnValue(updated);

            const result = controller.updateCoinConfig({ enabled: false });

            expect(mockCreditService.updateCoinConfig).toHaveBeenCalledWith({ enabled: false });
            expect(result).toEqual(updated);
        });
    });

    describe("adminTransfer", () => {
        it("should delegate to creditService.adminTransfer with admin's userId", async () => {
            (mockCreditService.adminTransfer as jest.Mock).mockResolvedValue(txDto);

            const dto: AdminTransferDto = {
                toUserId: "user-1",
                amount: 200,
                type: "reward",
                description: "Bonus"
            };

            const result = await controller.adminTransfer(adminUser, dto);

            expect(mockCreditService.adminTransfer).toHaveBeenCalledWith("admin-1", dto);
            expect(result).toEqual(txDto);
        });
    });

    describe("getAllWallets", () => {
        it("should use default limit of 50 when not specified", async () => {
            (mockCreditService.getAllWallets as jest.Mock).mockResolvedValue([]);

            await controller.getAllWallets();

            expect(mockCreditService.getAllWallets).toHaveBeenCalledWith(50);
        });

        it("should parse limit from query param", async () => {
            (mockCreditService.getAllWallets as jest.Mock).mockResolvedValue([]);

            await controller.getAllWallets("20");

            expect(mockCreditService.getAllWallets).toHaveBeenCalledWith(20);
        });
    });

    describe("getAllTransactions", () => {
        it("should use default pagination when not specified", async () => {
            (mockCreditService.getAllTransactions as jest.Mock).mockResolvedValue(paginatedTx);

            await controller.getAllTransactions();

            expect(mockCreditService.getAllTransactions).toHaveBeenCalledWith(1, 20);
        });
    });

    describe("recalculateAll", () => {
        it("should delegate to creditService.recalculateAll and return the report", async () => {
            const report: RecalculateReport = {
                usersProcessed: 5,
                totalCoinsAwarded: 100,
                durationMs: 42,
                message: "Done"
            };
            (mockCreditService.recalculateAll as jest.Mock).mockResolvedValue(report);

            const result = await controller.recalculateAll();

            expect(result).toEqual(report);
        });
    });
});
