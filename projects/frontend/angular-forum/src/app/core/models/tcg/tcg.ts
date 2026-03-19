export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type CardElement = "fire" | "water" | "earth" | "wind" | "light" | "dark" | "neutral";

export interface Card {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    rarity: CardRarity;
    series: string;
    element: CardElement | null;
    attack: number;
    defense: number;
    hp: number;
    artistCredit: string | null;
    flavorText: string | null;
    isActive: boolean;
    sortOrder: number;
    owned?: number;
}

export interface BoosterCategory {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    isActive: boolean;
    sortOrder: number;
}

export interface BoosterPack {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    cardsPerPack: number;
    guaranteedRarity: CardRarity | null;
    series: string;
    categoryId: string | null;
    categoryName: string | null;
    availableFrom: string | null;
    availableUntil: string | null;
    maxPurchasesPerUser: number | null;
    isActive: boolean;
    sortOrder: number;
    totalCards: number;
    userPurchases?: number;
}

export interface UserCard {
    cardId: string;
    card: Card;
    quantity: number;
    firstObtainedAt: string;
    isFavorite: boolean;
}

export interface UserBooster {
    id: string;
    boosterPackId: string;
    boosterPack: BoosterPack;
    isOpened: boolean;
    purchasedAt: string;
    openedAt: string | null;
}

export interface OpenBoosterResult {
    boosterId: string;
    cards: Card[];
    newCards: string[];
}

export interface CardListing {
    id: string;
    userId: string;
    sellerName: string;
    cardId: string;
    card: Card;
    price: number;
    quantity: number;
    status: "active" | "sold" | "cancelled";
    createdAt: string;
}

export interface CollectionProgress {
    totalCards: number;
    ownedUniqueCards: number;
    completionPercent: number;
    bySeries: { series: string; total: number; owned: number; percent: number }[];
    byRarity: { rarity: CardRarity; total: number; owned: number }[];
}

export interface AdminBoosterDetail extends BoosterPack {
    cards: { cardId: string; cardName: string; cardRarity: CardRarity; dropWeight: number }[];
}

export interface CreateCardDto {
    name: string;
    description?: string;
    imageUrl?: string;
    rarity: CardRarity;
    series: string;
    element?: CardElement;
    attack?: number;
    defense?: number;
    hp?: number;
    artistCredit?: string;
    flavorText?: string;
    sortOrder?: number;
}

export interface CreateBoosterPackDto {
    name: string;
    description?: string;
    imageUrl?: string;
    price: number;
    cardsPerPack?: number;
    guaranteedRarity?: CardRarity;
    series: string;
    categoryId?: string;
    availableFrom?: string;
    availableUntil?: string;
    maxPurchasesPerUser?: number;
    sortOrder?: number;
    cards?: { cardId: string; dropWeight: number }[];
}

export interface CreateBoosterCategoryDto {
    name: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
}

export const RARITY_CONFIG: Record<CardRarity, { label: string; color: string; severity: string }> = {
    common: { label: "Common", color: "#9ca3af", severity: "secondary" },
    uncommon: { label: "Uncommon", color: "#22c55e", severity: "success" },
    rare: { label: "Rare", color: "#3b82f6", severity: "info" },
    epic: { label: "Epic", color: "#a855f7", severity: "help" },
    legendary: { label: "Legendary", color: "#f59e0b", severity: "warn" },
    mythic: { label: "Mythic", color: "#ef4444", severity: "danger" }
};

export const ELEMENT_CONFIG: Record<CardElement, { label: string; icon: string; color: string }> = {
    fire: { label: "Feuer", icon: "pi pi-bolt", color: "#ef4444" },
    water: { label: "Wasser", icon: "pi pi-cloud", color: "#3b82f6" },
    earth: { label: "Erde", icon: "pi pi-globe", color: "#92400e" },
    wind: { label: "Wind", icon: "pi pi-send", color: "#6ee7b7" },
    light: { label: "Licht", icon: "pi pi-sun", color: "#fbbf24" },
    dark: { label: "Dunkel", icon: "pi pi-moon", color: "#6366f1" },
    neutral: { label: "Neutral", icon: "pi pi-circle", color: "#94a3b8" }
};
