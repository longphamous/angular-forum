export type TransactionType =
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "reward"
    | "purchase"
    | "lotto_ticket"
    | "lotto_win";

export interface Transaction {
    id: string;
    fromUserId?: string;
    toUserId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    description: string;
    createdAt: string;
}
