import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { Transaction, TransactionType } from "./models/transaction.model";
import { Wallet } from "./models/wallet.model";

const wallets: Wallet[] = [
    {
        userId: "u1",
        username: "NarutoFan99",
        balance: 500,
        currency: "credits",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
    },
    {
        userId: "u2",
        username: "AnimeQueen",
        balance: 1200,
        currency: "credits",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
    },
    {
        userId: "u3",
        username: "MangaMaster",
        balance: 300,
        currency: "credits",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
    }
];

const transactions: Transaction[] = [
    {
        id: "tx-001",
        toUserId: "u1",
        amount: 500,
        currency: "credits",
        type: "deposit",
        description: "Initial bonus credits",
        createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
        id: "tx-002",
        toUserId: "u2",
        amount: 1200,
        currency: "credits",
        type: "deposit",
        description: "Initial bonus credits",
        createdAt: "2026-01-01T00:00:00.000Z"
    }
];

@Injectable()
export class CreditService {
    // ─── Wallets ──────────────────────────────────────────────────────────────

    getWallet(userId: string): Wallet {
        const wallet = wallets.find((w) => w.userId === userId);
        if (!wallet) {
            throw new NotFoundException(`Wallet for user "${userId}" not found`);
        }
        return wallet;
    }

    createWallet(userId: string, username: string): Wallet {
        if (wallets.some((w) => w.userId === userId)) {
            throw new BadRequestException(`Wallet for user "${userId}" already exists`);
        }
        const now = new Date().toISOString();
        const wallet: Wallet = {
            userId,
            username,
            balance: 0,
            currency: "credits",
            createdAt: now,
            updatedAt: now
        };
        wallets.push(wallet);
        return wallet;
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    getTransactions(userId: string): Transaction[] {
        return transactions.filter((t) => t.toUserId === userId || t.fromUserId === userId);
    }

    deposit(userId: string, amount: number, description = "Deposit"): Transaction {
        this.validateAmount(amount);
        const wallet = this.getWallet(userId);
        wallet.balance += amount;
        wallet.updatedAt = new Date().toISOString();
        return this.recordTransaction({ toUserId: userId, amount, type: "deposit", description });
    }

    withdraw(userId: string, amount: number, description = "Withdrawal"): Transaction {
        this.validateAmount(amount);
        const wallet = this.getWallet(userId);
        this.ensureSufficientBalance(wallet, amount);
        wallet.balance -= amount;
        wallet.updatedAt = new Date().toISOString();
        return this.recordTransaction({ toUserId: userId, amount, type: "withdrawal", description });
    }

    transfer(fromUserId: string, toUserId: string, amount: number, description = "Transfer"): Transaction {
        this.validateAmount(amount);
        const sender = this.getWallet(fromUserId);
        const receiver = this.getWallet(toUserId);
        this.ensureSufficientBalance(sender, amount);

        sender.balance -= amount;
        sender.updatedAt = new Date().toISOString();
        receiver.balance += amount;
        receiver.updatedAt = new Date().toISOString();

        return this.recordTransaction({ fromUserId, toUserId, amount, type: "transfer", description });
    }

    reward(userId: string, amount: number, description = "Reward"): Transaction {
        this.validateAmount(amount);
        const wallet = this.getWallet(userId);
        wallet.balance += amount;
        wallet.updatedAt = new Date().toISOString();
        return this.recordTransaction({ toUserId: userId, amount, type: "reward", description });
    }

    // ─── Internal helpers (used by sub-modules like Lotto) ────────────────────

    deductCredits(userId: string, amount: number, type: TransactionType, description: string): Transaction {
        this.validateAmount(amount);
        const wallet = this.getWallet(userId);
        this.ensureSufficientBalance(wallet, amount);
        wallet.balance -= amount;
        wallet.updatedAt = new Date().toISOString();
        return this.recordTransaction({ toUserId: userId, amount, type, description });
    }

    addCredits(userId: string, amount: number, type: TransactionType, description: string): Transaction {
        this.validateAmount(amount);
        const wallet = this.getWallet(userId);
        wallet.balance += amount;
        wallet.updatedAt = new Date().toISOString();
        return this.recordTransaction({ toUserId: userId, amount, type, description });
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private validateAmount(amount: number): void {
        if (amount <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }
    }

    private ensureSufficientBalance(wallet: Wallet, amount: number): void {
        if (wallet.balance < amount) {
            throw new BadRequestException(`Insufficient balance. Available: ${wallet.balance}, required: ${amount}`);
        }
    }

    private recordTransaction(data: Omit<Transaction, "id" | "currency" | "createdAt">): Transaction {
        const tx: Transaction = {
            ...data,
            id: `tx-${Date.now()}`,
            currency: "credits",
            createdAt: new Date().toISOString()
        };
        transactions.push(tx);
        return tx;
    }
}
