import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { UserWalletEntity } from "./entities/user-wallet.entity";
import { WalletTransactionEntity } from "./entities/wallet-transaction.entity";
import { TransactionType } from "./models/transaction.model";

export interface CoinEarnAction {
    enabled: boolean;
    amount: number;
}

export interface CoinEarnConfig {
    enabled: boolean; // global on/off switch
    threadCreate: CoinEarnAction;
    postReply: CoinEarnAction;
    reactionGiven: CoinEarnAction;
    reactionReceived: CoinEarnAction;
    blogPost: CoinEarnAction;
    blogComment: CoinEarnAction;
    galleryUpload: CoinEarnAction;
    dailyLogin: CoinEarnAction;
    // Forum categories excluded from earning coins (by category id)
    excludedCategoryIds: string[];
}

export interface RecalculateReport {
    usersProcessed: number;
    totalCoinsAwarded: number;
    durationMs: number;
    message: string;
}

export interface AdminTransferDto {
    toUserId: string;
    amount: number;
    type: "reward" | "penalty";
    description: string;
}

export interface AdminWalletEntry {
    userId: string;
    username: string;
    displayName: string;
    balance: number;
    transactionCount: number;
}

export interface AdminTransactionDto {
    id: string;
    fromUserId: string | null;
    toUserId: string;
    toUserName: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
}

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

const DEFAULT_COIN_CONFIG: CoinEarnConfig = {
    enabled: true,
    threadCreate: { enabled: true, amount: 5 },
    postReply: { enabled: true, amount: 2 },
    reactionGiven: { enabled: false, amount: 1 },
    reactionReceived: { enabled: true, amount: 1 },
    blogPost: { enabled: true, amount: 10 },
    blogComment: { enabled: true, amount: 2 },
    galleryUpload: { enabled: true, amount: 3 },
    dailyLogin: { enabled: true, amount: 1 },
    excludedCategoryIds: []
};

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

    private coinConfig: CoinEarnConfig = {
        ...DEFAULT_COIN_CONFIG,
        threadCreate: { ...DEFAULT_COIN_CONFIG.threadCreate },
        postReply: { ...DEFAULT_COIN_CONFIG.postReply },
        reactionGiven: { ...DEFAULT_COIN_CONFIG.reactionGiven },
        reactionReceived: { ...DEFAULT_COIN_CONFIG.reactionReceived },
        blogPost: { ...DEFAULT_COIN_CONFIG.blogPost },
        blogComment: { ...DEFAULT_COIN_CONFIG.blogComment },
        galleryUpload: { ...DEFAULT_COIN_CONFIG.galleryUpload },
        dailyLogin: { ...DEFAULT_COIN_CONFIG.dailyLogin }
    };

    getCoinConfig(): CoinEarnConfig {
        return JSON.parse(JSON.stringify(this.coinConfig)) as CoinEarnConfig;
    }

    updateCoinConfig(partial: Partial<CoinEarnConfig>): CoinEarnConfig {
        this.coinConfig = { ...this.coinConfig, ...partial };
        return this.getCoinConfig();
    }

    async adminTransfer(adminId: string, dto: AdminTransferDto): Promise<TransactionDto> {
        const wallet = await this.findOrCreateWallet(dto.toUserId);
        if (dto.type === "reward") {
            wallet.balance += dto.amount;
            await this.walletRepo.save(wallet);
            return toTransactionDto(
                await this.record({
                    fromUserId: adminId,
                    toUserId: dto.toUserId,
                    amount: dto.amount,
                    type: "admin_transfer",
                    description: dto.description
                })
            );
        } else {
            if (wallet.balance < dto.amount) {
                wallet.balance = 0;
            } else {
                wallet.balance -= dto.amount;
            }
            await this.walletRepo.save(wallet);
            return toTransactionDto(
                await this.record({
                    fromUserId: adminId,
                    toUserId: dto.toUserId,
                    amount: dto.amount,
                    type: "admin_transfer",
                    description: `[Abzug] ${dto.description}`
                })
            );
        }
    }

    async getAllWallets(limit = 50): Promise<AdminWalletEntry[]> {
        const rows = await this.dataSource.query<
            { user_id: string; display_name: string; username: string; balance: number; tx_count: string }[]
        >(
            `SELECT w.user_id, u.display_name, u.username, w.balance,
                    COUNT(t.id) AS tx_count
               FROM user_wallets w
               JOIN users u ON u.id = w.user_id
               LEFT JOIN wallet_transactions t ON t.to_user_id = w.user_id OR t.from_user_id = w.user_id
              GROUP BY w.user_id, u.display_name, u.username, w.balance
              ORDER BY w.balance DESC
              LIMIT $1`,
            [limit]
        );
        return rows.map((r) => ({
            userId: r.user_id,
            displayName: r.display_name,
            username: r.username,
            balance: r.balance,
            transactionCount: parseInt(r.tx_count, 10)
        }));
    }

    async getAllTransactions(page = 1, limit = 20): Promise<PaginatedTransactions> {
        const [entities, total] = await this.txRepo.findAndCount({
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });
        return { data: entities.map(toTransactionDto), total, page, limit };
    }

    async recalculateAll(): Promise<RecalculateReport> {
        const start = Date.now();
        const config = this.coinConfig;
        if (!config.enabled) {
            return {
                usersProcessed: 0,
                totalCoinsAwarded: 0,
                durationMs: Date.now() - start,
                message: "Coin rewards are globally disabled."
            };
        }
        try {
            interface UserRow {
                user_id: string;
                post_count: string;
                thread_count: string;
                reactions_received: string;
                reactions_given: string;
                blog_post_count: string;
                gallery_count: string;
            }
            const rows = await this.dataSource.query<UserRow[]>(`
                SELECT u.id AS user_id,
                       COUNT(DISTINCT fp.id)  AS post_count,
                       COUNT(DISTINCT ft.id)  AS thread_count,
                       COUNT(DISTINCT rr.id)  AS reactions_received,
                       COUNT(DISTINCT rg.id)  AS reactions_given,
                       COUNT(DISTINCT bp.id)  AS blog_post_count,
                       COUNT(DISTINCT gm.id)  AS gallery_count
                FROM users u
                LEFT JOIN forum_posts     fp ON fp.author_id = u.id AND fp.deleted_at IS NULL
                LEFT JOIN forum_threads   ft ON ft.author_id = u.id AND ft.deleted_at IS NULL
                LEFT JOIN forum_post_reactions rr ON rr.post_id IN (
                    SELECT id FROM forum_posts WHERE author_id = u.id AND deleted_at IS NULL
                )
                LEFT JOIN forum_post_reactions rg ON rg.user_id = u.id
                LEFT JOIN blog_posts      bp ON bp.author_id = u.id
                LEFT JOIN gallery_media   gm ON gm.owner_id  = u.id
                GROUP BY u.id
            `);
            let totalAwarded = 0;
            for (const row of rows) {
                const postCount = parseInt(row.post_count, 10);
                const threadCount = parseInt(row.thread_count, 10);
                const reactionsReceived = parseInt(row.reactions_received, 10);
                const reactionsGiven = parseInt(row.reactions_given, 10);
                const blogPostCount = parseInt(row.blog_post_count, 10);
                const galleryCount = parseInt(row.gallery_count, 10);

                const expected =
                    (config.postReply.enabled ? postCount * config.postReply.amount : 0) +
                    (config.threadCreate.enabled ? threadCount * config.threadCreate.amount : 0) +
                    (config.reactionReceived.enabled ? reactionsReceived * config.reactionReceived.amount : 0) +
                    (config.reactionGiven.enabled ? reactionsGiven * config.reactionGiven.amount : 0) +
                    (config.blogPost.enabled ? blogPostCount * config.blogPost.amount : 0) +
                    (config.galleryUpload.enabled ? galleryCount * config.galleryUpload.amount : 0);

                const wallet = await this.findOrCreateWallet(row.user_id);
                wallet.balance = Math.max(0, expected);
                await this.walletRepo.save(wallet);
                totalAwarded += wallet.balance;
            }
            return {
                usersProcessed: rows.length,
                totalCoinsAwarded: totalAwarded,
                durationMs: Date.now() - start,
                message: `Successfully recalculated ${rows.length} user wallets.`
            };
        } catch (err) {
            return {
                usersProcessed: 0,
                totalCoinsAwarded: 0,
                durationMs: Date.now() - start,
                message: `Recalculation failed: ${String(err)}`
            };
        }
    }

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
