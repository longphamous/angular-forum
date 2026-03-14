export const WALLET_ROUTES = {
    wallet: () => "/credit/wallet",
    transactions: (page = 1, limit = 20) => `/credit/transactions?page=${page}&limit=${limit}`,
    transfer: () => "/credit/transfer",
    leaderboard: (limit = 5) => `/credit/leaderboard?limit=${limit}`
} as const;
