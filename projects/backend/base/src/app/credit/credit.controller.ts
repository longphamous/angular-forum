import { Body, Controller, Get, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import {
    AdminTransferDto,
    AdminWalletEntry,
    CoinEarnConfig,
    CreditService,
    PaginatedTransactions,
    RecalculateReport,
    TransactionDto,
    WalletDto,
    WalletLeaderboardEntry
} from "./credit.service";

@ApiTags("Credit")
@ApiBearerAuth("JWT")
@Controller("credit")
export class CreditController {
    constructor(private readonly creditService: CreditService) {}

    // ─── Own wallet (any authenticated user) ──────────────────────────────────

    /**
     * GET /credit/wallet
     * Returns the caller's wallet.
     */
    @Get("wallet")
    getMyWallet(@CurrentUser() user: AuthenticatedUser): Promise<WalletDto> {
        return this.creditService.getWallet(user.userId);
    }

    /**
     * GET /credit/transactions?page=1&limit=20
     * Returns the caller's transaction history (paginated).
     */
    @Get("transactions")
    getMyTransactions(
        @CurrentUser() user: AuthenticatedUser,
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ): Promise<PaginatedTransactions> {
        return this.creditService.getTransactions(
            user.userId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20
        );
    }

    /**
     * POST /credit/transfer
     * Transfer credits from the caller to another user.
     *
     * Body: { toUserId: string; amount: number; description?: string }
     */
    @Post("transfer")
    transfer(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { toUserId: string; amount: number; description?: string }
    ): Promise<TransactionDto> {
        return this.creditService.transfer(user.userId, body.toUserId, body.amount, body.description);
    }

    // ─── Public leaderboard ───────────────────────────────────────────────────

    /**
     * GET /credit/leaderboard?limit=5
     * Returns the top N users by balance. Publicly accessible.
     */
    @Get("leaderboard")
    @Public()
    getLeaderboard(@Query("limit") limit?: string): Promise<WalletLeaderboardEntry[]> {
        return this.creditService.getLeaderboard(limit ? parseInt(limit, 10) : 5);
    }

    // ─── Admin endpoints ───────────────────────────────────────────────────────

    /**
     * POST /credit/deposit
     * Admin: deposit credits into any user's wallet.
     *
     * Body: { userId: string; amount: number; description?: string }
     */
    @Post("deposit")
    @Roles("admin")
    deposit(@Body() body: { userId: string; amount: number; description?: string }): Promise<TransactionDto> {
        return this.creditService.deposit(body.userId, body.amount, body.description);
    }

    /**
     * POST /credit/reward
     * Admin: reward any user with credits.
     *
     * Body: { userId: string; amount: number; description?: string }
     */
    @Post("reward")
    @Roles("admin")
    reward(@Body() body: { userId: string; amount: number; description?: string }): Promise<TransactionDto> {
        return this.creditService.reward(body.userId, body.amount, body.description);
    }

    @Get("admin/config")
    @Roles("admin")
    getCoinConfig(): CoinEarnConfig {
        return this.creditService.getCoinConfig();
    }

    @Put("admin/config")
    @Roles("admin")
    updateCoinConfig(@Body() body: Partial<CoinEarnConfig>): CoinEarnConfig {
        return this.creditService.updateCoinConfig(body);
    }

    @Post("admin/transfer")
    @Roles("admin")
    adminTransfer(@CurrentUser() user: AuthenticatedUser, @Body() body: AdminTransferDto): Promise<TransactionDto> {
        return this.creditService.adminTransfer(user.userId, body);
    }

    @Get("admin/wallets")
    @Roles("admin")
    getAllWallets(@Query("limit") limit?: string): Promise<AdminWalletEntry[]> {
        return this.creditService.getAllWallets(limit ? parseInt(limit, 10) : 50);
    }

    @Get("admin/transactions")
    @Roles("admin")
    getAllTransactions(@Query("page") page?: string, @Query("limit") limit?: string): Promise<PaginatedTransactions> {
        return this.creditService.getAllTransactions(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
    }

    @Post("admin/recalculate")
    @Roles("admin")
    recalculateAll(): Promise<RecalculateReport> {
        return this.creditService.recalculateAll();
    }
}
