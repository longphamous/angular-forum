export type TransactionType =
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "reward"
    | "purchase"
    | "lotto_ticket"
    | "lotto_win"
    | "lotto_special_ticket"
    | "lotto_special_win"
    | "admin_transfer"
    | "recalculate"
    | "market_buy"
    | "market_sell"
    | "tcg_booster_buy"
    | "tcg_card_sell"
    | "tcg_card_buy";

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
