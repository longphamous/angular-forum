export type WalletTransactionType =
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "reward"
    | "purchase"
    | "lotto_ticket"
    | "lotto_win";

export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
}

export interface WalletTransaction {
    id: string;
    fromUserId: string | null;
    toUserId: string;
    amount: number;
    type: WalletTransactionType;
    description: string;
    createdAt: string;
}

export interface PaginatedTransactions {
    data: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
}

export interface WalletLeaderboardEntry {
    userId: string;
    displayName: string;
    username: string;
    balance: number;
}
