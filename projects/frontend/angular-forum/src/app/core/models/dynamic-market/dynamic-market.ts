export interface MarketResource {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string;
    groupKey: string;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
    currentPrice: number;
    volatility: number;
    canBuy: boolean;
    canSell: boolean;
    isActive: boolean;
    sortOrder: number;
    trend: number;
    priceHistory: number[];
    changePercent: number;
}

export interface MarketGroup {
    groupKey: string;
    resources: MarketResource[];
}

export interface MarketEvent {
    id: string;
    title: string;
    description: string;
    affectedSlugs: string[];
    modifierType: string;
    modifierValue: number;
    weight: number;
    isActive: boolean;
}

export interface MarketEventLog {
    id: string;
    eventId: string | null;
    title: string;
    description: string;
    priceChanges: Record<string, { before: number; after: number }>;
    createdAt: string;
}

export interface UserInventoryItem {
    resourceId: string;
    resourceSlug: string;
    resourceName: string;
    resourceIcon: string;
    quantity: number;
    currentPrice: number;
    totalValue: number;
}

export interface MarketTradeResult {
    action: "buy" | "sell";
    resourceSlug: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    newBalance: number;
    newInventoryQuantity: number;
}

export interface MarketConfig {
    priceUpdateIntervalMinutes: number;
    eventChancePercent: number;
    demandDecayFactor: number;
    maxTradeQuantity: number;
}

export type MarketModifierType = "set_max" | "set_min" | "multiply" | "add" | "set";

export const MARKET_GROUP_LABELS: Record<string, { de: string; en: string }> = {
    otaku: { de: "Otaku-Waren", en: "Otaku Goods" },
    nature: { de: "Japanische Natur", en: "Japanese Nature" },
    minerals: { de: "Edelsteine & Metalle", en: "Gems & Metals" },
    food: { de: "Speisen & Getränke", en: "Food & Drinks" },
    rare: { de: "Seltene Güter", en: "Rare Goods" }
};
