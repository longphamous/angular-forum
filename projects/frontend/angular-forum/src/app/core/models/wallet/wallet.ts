export type WalletTransactionType =
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "reward"
    | "purchase"
    | "lotto_ticket"
    | "lotto_win"
    | "admin_transfer"
    | "recalculate";

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

export interface CoinEarnAction {
    enabled: boolean;
    amount: number;
}

export interface CoinEarnConfig {
    enabled: boolean;
    threadCreate: CoinEarnAction;
    postReply: CoinEarnAction;
    reactionGiven: CoinEarnAction;
    reactionReceived: CoinEarnAction;
    blogPost: CoinEarnAction;
    blogComment: CoinEarnAction;
    galleryUpload: CoinEarnAction;
    dailyLogin: CoinEarnAction;
    excludedCategoryIds: string[];
}

export interface AdminWalletEntry {
    userId: string;
    username: string;
    displayName: string;
    balance: number;
    transactionCount: number;
}

export interface RecalculateReport {
    usersProcessed: number;
    totalCoinsAwarded: number;
    durationMs: number;
    message: string;
}
