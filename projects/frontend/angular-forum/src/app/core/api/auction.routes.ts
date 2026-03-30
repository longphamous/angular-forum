const BASE = "/api/marketplace/auctions";

export const AUCTION_ROUTES = {
    list: BASE,
    create: BASE,
    my: `${BASE}/my`,
    myBids: `${BASE}/my-bids`,
    watchlist: `${BASE}/watchlist`,
    detail: (id: string) => `${BASE}/${id}`,
    bids: (id: string) => `${BASE}/${id}/bids`,
    buyNow: (id: string) => `${BASE}/${id}/buy-now`,
    watch: (id: string) => `${BASE}/${id}/watch`,
    cancel: (id: string) => `${BASE}/${id}/cancel`,
    admin: {
        pending: `${BASE}/admin/pending`,
        approve: (id: string) => `${BASE}/admin/${id}/approve`,
        reject: (id: string) => `${BASE}/admin/${id}/reject`
    }
} as const;
