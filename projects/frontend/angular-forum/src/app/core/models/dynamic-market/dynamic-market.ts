export interface MarketResource {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string;
    imageUrl: string | null;
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

export type ScheduleType = "disabled" | "minutely" | "hourly" | "daily" | "weekly";

export interface MarketSchedule {
    type: ScheduleType;
    minutelyInterval: number;
    hourlyAtMinute: number;
    dailyTimes: string[];
    weeklyDays: number[];
    weeklyTime: string;
}

export const DEFAULT_SCHEDULE: MarketSchedule = {
    type: "minutely",
    minutelyInterval: 60,
    hourlyAtMinute: 0,
    dailyTimes: ["08:00"],
    weeklyDays: [1],
    weeklyTime: "08:00"
};

export interface MarketConfig {
    eventChancePercent: number;
    demandDecayFactor: number;
    maxTradeQuantity: number;
    schedule: MarketSchedule;
    nextUpdateAt: string | null;
}

export type MarketModifierType = "set_max" | "set_min" | "multiply" | "add" | "set";

export const MARKET_GROUP_LABELS: Record<string, { de: string; en: string }> = {
    otaku: { de: "Otaku-Waren", en: "Otaku Goods" },
    nature: { de: "Japanische Natur", en: "Japanese Nature" },
    minerals: { de: "Edelsteine & Metalle", en: "Gems & Metals" },
    food: { de: "Speisen & Getränke", en: "Food & Drinks" },
    rare: { de: "Seltene Güter", en: "Rare Goods" }
};
