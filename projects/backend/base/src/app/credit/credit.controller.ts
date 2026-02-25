import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreditService } from "./credit.service";
import { Transaction } from "./models/transaction.model";
import { Wallet } from "./models/wallet.model";

@Controller("credit")
export class CreditController {
    constructor(private readonly creditService: CreditService) {}

    // ─── Wallets ──────────────────────────────────────────────────────────────

    /**
     * GET /credit/wallets/:userId
     * Returns the wallet (balance) for a given user.
     */
    @Get("wallets/:userId")
    getWallet(@Param("userId") userId: string): Wallet {
        return this.creditService.getWallet(userId);
    }

    /**
     * POST /credit/wallets
     * Creates a new wallet for a user.
     *
     * Body: { userId: string; username: string }
     */
    @Post("wallets")
    createWallet(@Body() body: { userId: string; username: string }): Wallet {
        return this.creditService.createWallet(body.userId, body.username);
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    /**
     * GET /credit/transactions/:userId
     * Returns all transactions for a user.
     */
    @Get("transactions/:userId")
    getTransactions(@Param("userId") userId: string): Transaction[] {
        return this.creditService.getTransactions(userId);
    }

    /**
     * POST /credit/deposit
     * Deposits credits into a user's wallet.
     *
     * Body: { userId: string; amount: number; description?: string }
     */
    @Post("deposit")
    deposit(@Body() body: { userId: string; amount: number; description?: string }): Transaction {
        return this.creditService.deposit(body.userId, body.amount, body.description);
    }

    /**
     * POST /credit/withdraw
     * Withdraws credits from a user's wallet.
     *
     * Body: { userId: string; amount: number; description?: string }
     */
    @Post("withdraw")
    withdraw(@Body() body: { userId: string; amount: number; description?: string }): Transaction {
        return this.creditService.withdraw(body.userId, body.amount, body.description);
    }

    /**
     * POST /credit/transfer
     * Transfers credits from one user to another.
     *
     * Body: { fromUserId: string; toUserId: string; amount: number; description?: string }
     */
    @Post("transfer")
    transfer(
        @Body() body: { fromUserId: string; toUserId: string; amount: number; description?: string }
    ): Transaction {
        return this.creditService.transfer(body.fromUserId, body.toUserId, body.amount, body.description);
    }

    /**
     * POST /credit/reward
     * Awards bonus credits to a user (e.g. from gamification events).
     *
     * Body: { userId: string; amount: number; description?: string }
     */
    @Post("reward")
    reward(@Body() body: { userId: string; amount: number; description?: string }): Transaction {
        return this.creditService.reward(body.userId, body.amount, body.description);
    }
}
