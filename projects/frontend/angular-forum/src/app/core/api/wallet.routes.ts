export const WALLET_ROUTES = {
    wallet: () => "/credit/wallet",
    transactions: (page = 1, limit = 20) => `/credit/transactions?page=${page}&limit=${limit}`,
    transfer: () => "/credit/transfer",
    leaderboard: (limit = 5) => `/credit/leaderboard?limit=${limit}`,
    // Admin
    adminConfig: () => "/credit/admin/config",
    adminTransfer: () => "/credit/admin/transfer",
    adminWallets: (limit = 50) => `/credit/admin/wallets?limit=${limit}`,
    adminTransactions: (page = 1, limit = 20) => `/credit/admin/transactions?page=${page}&limit=${limit}`,
    adminRecalculate: () => "/credit/admin/recalculate"
} as const;
