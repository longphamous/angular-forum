import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { UserWalletEntity } from "./entities/user-wallet.entity";
import { WalletTransactionEntity } from "./entities/wallet-transaction.entity";
import { TransactionType } from "./models/transaction.model";

export interface WalletLeaderboardEntry {
    userId: string;
    displayName: string;
    username: string;
    balance: number;
}

export interface WalletDto {
    id: string;
    userId: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
}

export interface TransactionDto {
    id: string;
    fromUserId: string | null;
    toUserId: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
}

export interface PaginatedTransactions {
    data: TransactionDto[];
    total: number;
    page: number;
    limit: number;
}

function toWalletDto(e: UserWalletEntity): WalletDto {
    return {
        id: e.id,
        userId: e.userId,
        balance: e.balance,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
    };
}

function toTransactionDto(e: WalletTransactionEntity): TransactionDto {
    return {
        id: e.id,
        fromUserId: e.fromUserId,
        toUserId: e.toUserId,
        amount: e.amount,
        type: e.type,
        description: e.description,
        createdAt: e.createdAt.toISOString()
    };
}

@Injectable()
export class CreditService implements OnModuleInit {
    private readonly logger = new Logger(CreditService.name);

    constructor(
        @InjectRepository(UserWalletEntity)
        private readonly walletRepo: Repository<UserWalletEntity>,
        @InjectRepository(WalletTransactionEntity)
        private readonly txRepo: Repository<WalletTransactionEntity>,
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {}

    /** Seed wallets for all existing users that don't have one yet. */
    async onModuleInit(): Promise<void> {
        try {
            await this.dataSource.query(`
                INSERT INTO user_wallets (user_id, balance)
                SELECT id, 0 FROM users
                WHERE id NOT IN (SELECT user_id FROM user_wallets)
                ON CONFLICT DO NOTHING
            `);
            this.logger.log("Wallet seeding complete.");
        } catch (err) {
            this.logger.warn(`Wallet seeding skipped (tables may not exist yet): ${String(err)}`);
        }
    }

    // ─── Wallets ──────────────────────────────────────────────────────────────

    async getWallet(userId: string): Promise<WalletDto> {
        const wallet = await this.findOrCreateWallet(userId);
        return toWalletDto(wallet);
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    async getTransactions(userId: string, page = 1, limit = 20): Promise<PaginatedTransactions> {
        const [entities, total] = await this.txRepo.findAndCount({
            where: [{ toUserId: userId }, { fromUserId: userId }],
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });
        return { data: entities.map(toTransactionDto), total, page, limit };
    }

    async deposit(userId: string, amount: number, description = "Einzahlung"): Promise<TransactionDto> {
        this.validateAmount(amount);
        const wallet = await this.findOrCreateWallet(userId);
        wallet.balance += amount;
        await this.walletRepo.save(wallet);
        return toTransactionDto(await this.record({ toUserId: userId, amount, type: "deposit", description }));
    }

    async withdraw(userId: string, amount: number, description = "Auszahlung"): Promise<TransactionDto> {
        this.validateAmount(amount);
        const wallet = await this.findOrCreateWallet(userId);
        this.ensureBalance(wallet, amount);
        wallet.balance -= amount;
        await this.walletRepo.save(wallet);
        return toTransactionDto(await this.record({ toUserId: userId, amount, type: "withdrawal", description }));
    }

    async transfer(
        fromUserId: string,
        toUserId: string,
        amount: number,
        description = "Transfer"
    ): Promise<TransactionDto> {
        this.validateAmount(amount);
        if (fromUserId === toUserId) {
            throw new BadRequestException("Cannot transfer to yourself");
        }
        const sender = await this.findOrCreateWallet(fromUserId);
        this.ensureBalance(sender, amount);
        const receiver = await this.findOrCreateWallet(toUserId);

        sender.balance -= amount;
        receiver.balance += amount;
        await this.walletRepo.save([sender, receiver]);
        return toTransactionDto(await this.record({ fromUserId, toUserId, amount, type: "transfer", description }));
    }

    async reward(userId: string, amount: number, description = "Belohnung"): Promise<TransactionDto> {
        this.validateAmount(amount);
        const wallet = await this.findOrCreateWallet(userId);
        wallet.balance += amount;
        await this.walletRepo.save(wallet);
        return toTransactionDto(await this.record({ toUserId: userId, amount, type: "reward", description }));
    }

    /** Returns a map of userId → balance for the given user IDs. */
    async getBalances(userIds: string[]): Promise<Map<string, number>> {
        if (!userIds.length) return new Map();
        const wallets = await this.walletRepo.findBy({ userId: In(userIds) });
        return new Map(wallets.map((w) => [w.userId, w.balance]));
    }

    /** Returns the top N users by balance (joined with users table). */
    async getLeaderboard(limit = 5): Promise<WalletLeaderboardEntry[]> {
        const rows = await this.dataSource.query<
            { user_id: string; display_name: string; username: string; balance: number }[]
        >(
            `SELECT w.user_id, u.display_name, u.username, w.balance
               FROM user_wallets w
               JOIN users u ON u.id = w.user_id
              ORDER BY w.balance DESC
              LIMIT $1`,
            [limit]
        );
        return rows.map((r) => ({
            userId: r.user_id,
            displayName: r.display_name,
            username: r.username,
            balance: r.balance
        }));
    }

    // ─── Internal helpers (used by sub-modules like Lotto and PostService) ────

    async deductCredits(
        userId: string,
        amount: number,
        type: TransactionType,
        description: string
    ): Promise<TransactionDto> {
        this.validateAmount(amount);
        const wallet = await this.findOrCreateWallet(userId);
        this.ensureBalance(wallet, amount);
        wallet.balance -= amount;
        await this.walletRepo.save(wallet);
        return toTransactionDto(await this.record({ toUserId: userId, amount, type, description }));
    }

    async addCredits(
        userId: string,
        amount: number,
        type: TransactionType,
        description: string
    ): Promise<TransactionDto> {
        this.validateAmount(amount);
        const wallet = await this.findOrCreateWallet(userId);
        wallet.balance += amount;
        await this.walletRepo.save(wallet);
        return toTransactionDto(await this.record({ toUserId: userId, amount, type, description }));
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private async findOrCreateWallet(userId: string): Promise<UserWalletEntity> {
        let wallet = await this.walletRepo.findOneBy({ userId });
        if (!wallet) {
            wallet = this.walletRepo.create({ userId, balance: 0 });
            await this.walletRepo.save(wallet);
        }
        return wallet;
    }

    private async record(data: {
        fromUserId?: string | null;
        toUserId: string;
        amount: number;
        type: string;
        description: string;
    }): Promise<WalletTransactionEntity> {
        const tx = this.txRepo.create({
            fromUserId: data.fromUserId ?? null,
            toUserId: data.toUserId,
            amount: data.amount,
            type: data.type,
            description: data.description
        });
        return this.txRepo.save(tx);
    }

    private validateAmount(amount: number): void {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new BadRequestException("Amount must be a positive integer");
        }
    }

    private ensureBalance(wallet: UserWalletEntity, amount: number): void {
        if (wallet.balance < amount) {
            throw new BadRequestException(`Insufficient balance. Available: ${wallet.balance}, required: ${amount}`);
        }
    }
}
