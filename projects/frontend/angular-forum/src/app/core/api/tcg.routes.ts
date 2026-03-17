export const TCG_ROUTES = {
    // Public
    boosters: () => "/gamification/tcg/boosters",
    cards: () => "/gamification/tcg/cards",
    cardById: (id: string) => `/gamification/tcg/cards/${id}`,
    listings: () => "/gamification/tcg/listings",
    // Authenticated
    collection: () => "/gamification/tcg/collection",
    collectionProgress: () => "/gamification/tcg/collection/progress",
    inventory: () => "/gamification/tcg/inventory",
    buyBooster: (id: string) => `/gamification/tcg/boosters/${id}/buy`,
    openBooster: (id: string) => `/gamification/tcg/inventory/${id}/open`,
    toggleFavorite: (id: string) => `/gamification/tcg/cards/${id}/favorite`,
    transferCard: (id: string) => `/gamification/tcg/cards/${id}/transfer`,
    createListing: () => "/gamification/tcg/listings",
    cancelListing: (id: string) => `/gamification/tcg/listings/${id}`,
    buyListing: (id: string) => `/gamification/tcg/listings/${id}/buy`,
    // Admin
    adminCards: () => "/gamification/tcg/admin/cards",
    adminCardById: (id: string) => `/gamification/tcg/admin/cards/${id}`,
    adminBoosters: () => "/gamification/tcg/admin/boosters",
    adminBoosterById: (id: string) => `/gamification/tcg/admin/boosters/${id}`,
    adminBoosterCards: (id: string) => `/gamification/tcg/admin/boosters/${id}/cards`,
    adminBoosterCard: (boosterId: string, cardId: string) =>
        `/gamification/tcg/admin/boosters/${boosterId}/cards/${cardId}`
} as const;
