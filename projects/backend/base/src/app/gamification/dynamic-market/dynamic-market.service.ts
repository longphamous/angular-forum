import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreditService } from "../../credit/credit.service";
import { UserEntity } from "../../user/entities/user.entity";
import { DEFAULT_SCHEDULE, MarketConfigEntity, MarketSchedule } from "./entities/market-config.entity";
import { MarketEventEntity } from "./entities/market-event.entity";
import { MarketEventLogEntity } from "./entities/market-event-log.entity";
import { MarketResourceEntity } from "./entities/market-resource.entity";
import { MarketTransactionEntity } from "./entities/market-transaction.entity";
import { UserInventoryEntity } from "./entities/user-inventory.entity";

// ─── DTOs / Interfaces ──────────────────────────────────────────────────────

export interface MarketResourceDto {
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
    tier: number;
    craftedFrom: string | null;
    craftCost: number;
    /** Price trend: positive = rising, negative = falling */
    trend: number;
    /** Recent price snapshots for sparkline */
    priceHistory: number[];
    /** Percentage change from base price */
    changePercent: number;
    maxStock: number | null;
    currentStock: number | null;
    totalUnitsBought: number;
    totalUnitsSold: number;
}

export interface MarketGroupDto {
    groupKey: string;
    resources: MarketResourceDto[];
}

export interface MarketEventDto {
    id: string;
    title: string;
    description: string;
    affectedSlugs: string[];
    modifierType: string;
    modifierValue: number;
    weight: number;
    isActive: boolean;
}

export interface MarketEventLogDto {
    id: string;
    eventId: string | null;
    title: string;
    description: string;
    priceChanges: Record<string, { before: number; after: number }>;
    createdAt: string;
}

export interface UserInventoryDto {
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

export interface CreateMarketResourceDto {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    imageUrl?: string | null;
    groupKey: string;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
    volatility?: number;
    canBuy?: boolean;
    canSell?: boolean;
    sortOrder?: number;
    maxStock?: number | null;
    tier?: number;
    craftedFrom?: string | null;
    craftCost?: number;
}

export interface UpdateMarketResourceDto {
    name?: string;
    description?: string;
    icon?: string;
    imageUrl?: string | null;
    groupKey?: string;
    basePrice?: number;
    minPrice?: number;
    maxPrice?: number;
    currentPrice?: number;
    volatility?: number;
    canBuy?: boolean;
    canSell?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    maxStock?: number | null;
    currentStock?: number | null;
}

export interface CreateMarketEventDto {
    title: string;
    description: string;
    affectedSlugs: string[];
    modifierType: string;
    modifierValue?: number;
    weight?: number;
}

export interface MarketConfigDto {
    eventChancePercent: number;
    demandDecayFactor: number;
    maxTradeQuantity: number;
    schedule: MarketSchedule;
    nextUpdateAt: string | null;
}

/** Special userId for the virtual admin organisation */
export const ADMIN_ORG_USER_ID = "00000000-0000-0000-0000-000000000001";

export interface ResourceStatDto {
    resourceId: string;
    slug: string;
    name: string;
    icon: string;
    groupKey: string;
    currentPrice: number;
    basePrice: number;
    changePercent: number;
    allTimeBuys: number;
    allTimeSells: number;
    buyVolume: number;
    sellVolume: number;
    maxStock: number | null;
    currentStock: number | null;
    priceHistory: number[];
}

export interface MarketStatsDto {
    totalTransactions: number;
    totalBuyVolume: number;
    totalSellVolume: number;
    uniqueTraders: number;
    resources: ResourceStatDto[];
}

export interface AdminOrgInventoryDto {
    resourceId: string;
    resourceSlug: string;
    resourceName: string;
    resourceIcon: string;
    quantity: number;
    currentPrice: number;
}

// ─── Market Activity Log ─────────────────────────────────────────────────────

export type MarketActivityType = "buy" | "sell" | "event" | "price_update";

export interface MarketPriceChangeDto {
    name: string;
    icon: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
}

export interface MarketActivityDto {
    id: string;
    type: MarketActivityType;
    resourceSlug?: string;
    resourceName?: string;
    resourceIcon?: string;
    quantity?: number;
    pricePerUnit?: number;
    totalPrice?: number;
    userDisplay?: string;
    eventTitle?: string;
    eventDescription?: string;
    affectedCount?: number;
    changedCount?: number;
    topChanges?: MarketPriceChangeDto[];
    timestamp: string;
}

// ─── Default resources (with processing chains) ──────────────────────────────
// Tier 0 = Raw, Tier 1 = Processed, Tier 2 = Refined, Tier 3 = Masterwork
// craftedFrom = slug of the source resource, craftCost = units needed

const DEFAULT_RESOURCES: CreateMarketResourceDto[] = [
    // ═══ Bergbau / Mining ═══════════════════════════════════════════════════
    // Kupfer-Kette: Kupfererz → Kupferbarren → Kupferdraht → Elektronik
    {
        slug: "copper_ore",
        name: "Kupfererz",
        description: "Hergestellt aus 3x Kupfererz.",
        groupKey: "mining",
        basePrice: 30,
        minPrice: 12,
        maxPrice: 90,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 0
    },
    {
        slug: "copper_ingot",
        name: "Kupferbarren", description: "Hergestellt aus 3x Kupfererz.",
        groupKey: "mining",
        basePrice: 75,
        minPrice: 30,
        maxPrice: 200,
        icon: "pi pi-stop",
        tier: 1,
        craftedFrom: "copper_ore",
        craftCost: 3,
        sortOrder: 1
    },
    {
        slug: "copper_wire",
        name: "Kupferdraht",
        description: "Hergestellt aus 2x Kupferbarren.",
        groupKey: "mining",
        basePrice: 160,
        minPrice: 65,
        maxPrice: 420,
        icon: "pi pi-minus",
        tier: 2,
        craftedFrom: "copper_ingot",
        craftCost: 2,
        sortOrder: 2
    },
    {
        slug: "electronics",
        name: "Elektronik",
        description: "Hergestellt aus 3x Kupferdraht.",
        groupKey: "mining",
        basePrice: 380,
        minPrice: 150,
        maxPrice: 950,
        icon: "pi pi-microchip",
        tier: 3,
        craftedFrom: "copper_wire",
        craftCost: 3,
        volatility: 1.3,
        sortOrder: 3
    },
    // Eisen-Kette: Eisenerz → Stahlbarren → Tamahagane → Katana
    {
        slug: "iron_ore",
        name: "Eisenerz",
        description: "Hergestellt aus 3x Eisenerz.",
        groupKey: "mining",
        basePrice: 35,
        minPrice: 14,
        maxPrice: 100,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 4
    },
    {
        slug: "steel_ingot",
        name: "Stahlbarren", description: "Hergestellt aus 3x Eisenerz.",
        groupKey: "mining",
        basePrice: 90,
        minPrice: 36,
        maxPrice: 240,
        icon: "pi pi-stop",
        tier: 1,
        craftedFrom: "iron_ore",
        craftCost: 3,
        sortOrder: 5
    },
    {
        slug: "tamahagane",
        name: "Tamahagane-Stahl",
        description: "Hergestellt aus 3x Stahlbarren.",
        groupKey: "mining",
        basePrice: 250,
        minPrice: 100,
        maxPrice: 650,
        icon: "pi pi-shield",
        tier: 2,
        craftedFrom: "steel_ingot",
        craftCost: 3,
        volatility: 1.2,
        sortOrder: 6
    },
    {
        slug: "katana",
        name: "Katana",
        description: "Hergestellt aus 2x Tamahagane-Stahl.",
        groupKey: "mining",
        basePrice: 800,
        minPrice: 320,
        maxPrice: 2200,
        icon: "pi pi-bolt",
        tier: 3,
        craftedFrom: "tamahagane",
        craftCost: 2,
        volatility: 1.5,
        sortOrder: 7
    },
    // Gold-Kette: Golderz → Goldbarren → Goldschmuck
    {
        slug: "gold_ore",
        name: "Golderz",
        description: "Hergestellt aus 3x Golderz.",
        groupKey: "mining",
        basePrice: 80,
        minPrice: 32,
        maxPrice: 220,
        icon: "pi pi-circle",
        tier: 0,
        volatility: 1.1,
        sortOrder: 8
    },
    {
        slug: "gold_ingot",
        name: "Goldbarren", description: "Hergestellt aus 3x Golderz.",
        groupKey: "mining",
        basePrice: 220,
        minPrice: 88,
        maxPrice: 580,
        icon: "pi pi-stop",
        tier: 1,
        craftedFrom: "gold_ore",
        craftCost: 3,
        volatility: 1.2,
        sortOrder: 9
    },
    {
        slug: "gold_jewelry",
        name: "Goldschmuck",
        description: "Hergestellt aus 2x Goldbarren.",
        groupKey: "mining",
        basePrice: 600,
        minPrice: 240,
        maxPrice: 1600,
        icon: "pi pi-star",
        tier: 2,
        craftedFrom: "gold_ingot",
        craftCost: 2,
        volatility: 1.4,
        sortOrder: 10
    },
    // Jade-Kette: Jadeerz → Jadeschliff → Jadeamulett
    {
        slug: "jade_raw",
        name: "Rohjade",
        description: "Hergestellt aus 2x Rohjade.",
        groupKey: "mining",
        basePrice: 60,
        minPrice: 24,
        maxPrice: 160,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 11
    },
    {
        slug: "jade_polished",
        name: "Polierte Jade", description: "Hergestellt aus 2x Rohjade.",
        groupKey: "mining",
        basePrice: 180,
        minPrice: 72,
        maxPrice: 480,
        icon: "pi pi-sun",
        tier: 1,
        craftedFrom: "jade_raw",
        craftCost: 2,
        sortOrder: 12
    },
    {
        slug: "jade_amulet",
        name: "Jade-Amulett",
        description: "Hergestellt aus 2x Polierte Jade.",
        groupKey: "mining",
        basePrice: 500,
        minPrice: 200,
        maxPrice: 1300,
        icon: "pi pi-heart",
        tier: 2,
        craftedFrom: "jade_polished",
        craftCost: 2,
        volatility: 1.3,
        sortOrder: 13
    },
    // Kristall: Kristall → Kristalllinse → Kristallkugel
    {
        slug: "crystal_raw",
        name: "Rohkristall",
        description: "Hergestellt aus 3x Rohkristall.",
        groupKey: "mining",
        basePrice: 45,
        minPrice: 18,
        maxPrice: 130,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 14
    },
    {
        slug: "crystal_lens",
        name: "Kristalllinse", description: "Hergestellt aus 3x Rohkristall.",
        groupKey: "mining",
        basePrice: 140,
        minPrice: 56,
        maxPrice: 370,
        icon: "pi pi-eye",
        tier: 1,
        craftedFrom: "crystal_raw",
        craftCost: 3,
        sortOrder: 15
    },
    {
        slug: "crystal_orb",
        name: "Kristallkugel",
        description: "Hergestellt aus 2x Kristalllinse.",
        groupKey: "mining",
        basePrice: 420,
        minPrice: 168,
        maxPrice: 1100,
        icon: "pi pi-globe",
        tier: 2,
        craftedFrom: "crystal_lens",
        craftCost: 2,
        volatility: 1.4,
        sortOrder: 16
    },

    // ═══ Natur / Nature ═════════════════════════════════════════════════════
    // Bambus-Kette: Bambus → Bambusbretter → Bambusmöbel
    {
        slug: "bamboo",
        name: "Bambus",
        description: "Hergestellt aus 4x Bambus.",
        groupKey: "nature",
        basePrice: 25,
        minPrice: 10,
        maxPrice: 75,
        icon: "pi pi-align-justify",
        tier: 0,
        sortOrder: 0
    },
    {
        slug: "bamboo_planks",
        name: "Bambusbretter", description: "Hergestellt aus 4x Bambus.",
        groupKey: "nature",
        basePrice: 65,
        minPrice: 26,
        maxPrice: 175,
        icon: "pi pi-table",
        tier: 1,
        craftedFrom: "bamboo",
        craftCost: 4,
        sortOrder: 1
    },
    {
        slug: "bamboo_furniture",
        name: "Bambusmöbel",
        description: "Hergestellt aus 3x Bambusbretter.",
        groupKey: "nature",
        basePrice: 200,
        minPrice: 80,
        maxPrice: 520,
        icon: "pi pi-home",
        tier: 2,
        craftedFrom: "bamboo_planks",
        craftCost: 3,
        sortOrder: 2
    },
    // Sakura-Kette: Sakurablüten → Sakura-Extrakt → Sakura-Parfüm
    {
        slug: "sakura_petals",
        name: "Sakura-Blüten",
        description: "Hergestellt aus 5x Sakura-Blüten.",
        groupKey: "nature",
        basePrice: 40,
        minPrice: 16,
        maxPrice: 120,
        icon: "pi pi-sun",
        tier: 0,
        sortOrder: 3
    },
    {
        slug: "sakura_extract",
        name: "Sakura-Extrakt", description: "Hergestellt aus 5x Sakura-Blüten.",
        groupKey: "nature",
        basePrice: 120,
        minPrice: 48,
        maxPrice: 320,
        icon: "pi pi-filter",
        tier: 1,
        craftedFrom: "sakura_petals",
        craftCost: 5,
        sortOrder: 4
    },
    {
        slug: "sakura_perfume",
        name: "Sakura-Parfüm",
        description: "Hergestellt aus 2x Sakura-Extrakt.",
        groupKey: "nature",
        basePrice: 350,
        minPrice: 140,
        maxPrice: 920,
        icon: "pi pi-sparkles",
        tier: 2,
        craftedFrom: "sakura_extract",
        craftCost: 2,
        volatility: 1.3,
        sortOrder: 5
    },
    // Tee-Kette: Teeblätter → Matcha-Pulver → Premium-Matcha-Set
    {
        slug: "tea_leaves",
        name: "Teeblätter",
        description: "Hergestellt aus 5x Teeblätter.",
        groupKey: "nature",
        basePrice: 20,
        minPrice: 8,
        maxPrice: 60,
        icon: "pi pi-leaf",
        tier: 0,
        sortOrder: 6
    },
    {
        slug: "matcha_powder",
        name: "Matcha-Pulver", description: "Hergestellt aus 5x Teeblätter.",
        groupKey: "nature",
        basePrice: 70,
        minPrice: 28,
        maxPrice: 185,
        icon: "pi pi-box",
        tier: 1,
        craftedFrom: "tea_leaves",
        craftCost: 5,
        sortOrder: 7
    },
    {
        slug: "matcha_set",
        name: "Premium-Matcha-Set",
        description: "Hergestellt aus 3x Matcha-Pulver.",
        groupKey: "nature",
        basePrice: 220,
        minPrice: 88,
        maxPrice: 580,
        icon: "pi pi-gift",
        tier: 2,
        craftedFrom: "matcha_powder",
        craftCost: 3,
        sortOrder: 8
    },
    // Lotus-Kette: Lotussamen → Lotusblüte → Lotusessenz
    {
        slug: "lotus_seed",
        name: "Lotussamen",
        description: "Hergestellt aus 3x Lotussamen.",
        groupKey: "nature",
        basePrice: 30,
        minPrice: 12,
        maxPrice: 90,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 9
    },
    {
        slug: "lotus_blossom",
        name: "Lotusblüte", description: "Hergestellt aus 3x Lotussamen.",
        groupKey: "nature",
        basePrice: 95,
        minPrice: 38,
        maxPrice: 250,
        icon: "pi pi-sun",
        tier: 1,
        craftedFrom: "lotus_seed",
        craftCost: 3,
        sortOrder: 10
    },
    {
        slug: "lotus_essence",
        name: "Lotusessenz",
        description: "Hergestellt aus 3x Lotusblüte.",
        groupKey: "nature",
        basePrice: 280,
        minPrice: 112,
        maxPrice: 740,
        icon: "pi pi-sparkles",
        tier: 2,
        craftedFrom: "lotus_blossom",
        craftCost: 3,
        volatility: 1.2,
        sortOrder: 11
    },
    // Seidenraupe → Seide → Kimono
    {
        slug: "silkworm",
        name: "Seidenraupe",
        description: "Hergestellt aus 4x Seidenraupe.",
        groupKey: "nature",
        basePrice: 35,
        minPrice: 14,
        maxPrice: 100,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 12
    },
    {
        slug: "silk",
        name: "Seide", description: "Hergestellt aus 4x Seidenraupe.",
        groupKey: "nature",
        basePrice: 110,
        minPrice: 44,
        maxPrice: 290,
        icon: "pi pi-palette",
        tier: 1,
        craftedFrom: "silkworm",
        craftCost: 4,
        sortOrder: 13
    },
    {
        slug: "kimono",
        name: "Kimono",
        description: "Hergestellt aus 3x Seide.",
        groupKey: "nature",
        basePrice: 400,
        minPrice: 160,
        maxPrice: 1050,
        icon: "pi pi-user",
        tier: 2,
        craftedFrom: "silk",
        craftCost: 3,
        volatility: 1.3,
        sortOrder: 14
    },

    // ═══ Nahrung / Food ═════════════════════════════════════════════════════
    // Reis-Kette: Reis → Onigiri → Bento-Box
    {
        slug: "rice",
        name: "Reis",
        description: "Hergestellt aus 3x Reis.",
        groupKey: "food",
        basePrice: 15,
        minPrice: 6,
        maxPrice: 45,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 0
    },
    {
        slug: "onigiri",
        name: "Onigiri", description: "Hergestellt aus 3x Reis.",
        groupKey: "food",
        basePrice: 40,
        minPrice: 16,
        maxPrice: 110,
        icon: "pi pi-stop",
        tier: 1,
        craftedFrom: "rice",
        craftCost: 3,
        sortOrder: 1
    },
    {
        slug: "bento_box",
        name: "Bento-Box",
        description: "Hergestellt aus 3x Onigiri.",
        groupKey: "food",
        basePrice: 120,
        minPrice: 48,
        maxPrice: 320,
        icon: "pi pi-th-large",
        tier: 2,
        craftedFrom: "onigiri",
        craftCost: 3,
        sortOrder: 2
    },
    // Mehl-Kette: Mehl → Nudelteig → Ramen
    {
        slug: "flour",
        name: "Mehl",
        description: "Hergestellt aus 3x Mehl.",
        groupKey: "food",
        basePrice: 12,
        minPrice: 5,
        maxPrice: 35,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 3
    },
    {
        slug: "noodle_dough",
        name: "Nudelteig", description: "Hergestellt aus 3x Mehl.",
        groupKey: "food",
        basePrice: 35,
        minPrice: 14,
        maxPrice: 95,
        icon: "pi pi-minus",
        tier: 1,
        craftedFrom: "flour",
        craftCost: 3,
        sortOrder: 4
    },
    {
        slug: "ramen_bowl",
        name: "Ramen-Schüssel",
        description: "Hergestellt aus 2x Nudelteig.",
        groupKey: "food",
        basePrice: 100,
        minPrice: 40,
        maxPrice: 260,
        icon: "pi pi-sun",
        tier: 2,
        craftedFrom: "noodle_dough",
        craftCost: 2,
        sortOrder: 5
    },
    // Fisch-Kette: Fisch → Sashimi → Sushi-Platte
    {
        slug: "raw_fish",
        name: "Frischer Fisch",
        description: "Hergestellt aus 2x Frischer Fisch.",
        groupKey: "food",
        basePrice: 25,
        minPrice: 10,
        maxPrice: 70,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 6
    },
    {
        slug: "sashimi",
        name: "Sashimi", description: "Hergestellt aus 2x Frischer Fisch.",
        groupKey: "food",
        basePrice: 70,
        minPrice: 28,
        maxPrice: 185,
        icon: "pi pi-minus",
        tier: 1,
        craftedFrom: "raw_fish",
        craftCost: 2,
        sortOrder: 7
    },
    {
        slug: "sushi_platter",
        name: "Sushi-Platte",
        description: "Hergestellt aus 3x Sashimi.",
        groupKey: "food",
        basePrice: 220,
        minPrice: 88,
        maxPrice: 580,
        icon: "pi pi-th-large",
        tier: 2,
        craftedFrom: "sashimi",
        craftCost: 3,
        volatility: 1.2,
        sortOrder: 8
    },
    // Azuki-Kette: Azuki-Bohnen → Anko → Wagashi
    {
        slug: "azuki_beans",
        name: "Azuki-Bohnen",
        description: "Hergestellt aus 4x Azuki-Bohnen.",
        groupKey: "food",
        basePrice: 18,
        minPrice: 7,
        maxPrice: 50,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 9
    },
    {
        slug: "anko_paste",
        name: "Anko-Paste", description: "Hergestellt aus 4x Azuki-Bohnen.",
        groupKey: "food",
        basePrice: 50,
        minPrice: 20,
        maxPrice: 135,
        icon: "pi pi-filter",
        tier: 1,
        craftedFrom: "azuki_beans",
        craftCost: 4,
        sortOrder: 10
    },
    {
        slug: "wagashi",
        name: "Wagashi",
        description: "Hergestellt aus 2x Anko-Paste.",
        groupKey: "food",
        basePrice: 150,
        minPrice: 60,
        maxPrice: 400,
        icon: "pi pi-heart",
        tier: 2,
        craftedFrom: "anko_paste",
        craftCost: 2,
        sortOrder: 11
    },
    // Sake-Kette: Reis → Sake → Premium-Sake
    {
        slug: "sake_rice",
        name: "Sake-Reis",
        description: "Hergestellt aus 5x Sake-Reis.",
        groupKey: "food",
        basePrice: 22,
        minPrice: 9,
        maxPrice: 65,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 12
    },
    {
        slug: "sake",
        name: "Sake", description: "Hergestellt aus 5x Sake-Reis.",
        groupKey: "food",
        basePrice: 80,
        minPrice: 32,
        maxPrice: 210,
        icon: "pi pi-glass-martini",
        tier: 1,
        craftedFrom: "sake_rice",
        craftCost: 5,
        sortOrder: 13
    },
    {
        slug: "premium_sake",
        name: "Premium-Sake",
        description: "Hergestellt aus 2x Sake.",
        groupKey: "food",
        basePrice: 280,
        minPrice: 112,
        maxPrice: 740,
        icon: "pi pi-star",
        tier: 2,
        craftedFrom: "sake",
        craftCost: 2,
        volatility: 1.3,
        sortOrder: 14
    },

    // ═══ Otaku / Sammlerstücke ══════════════════════════════════════════════
    // Manga-Kette: Papier → Manga → Sammelband → Collector's Edition
    {
        slug: "blank_paper",
        name: "Druckpapier",
        description: "Hergestellt aus 5x Druckpapier.",
        groupKey: "otaku",
        basePrice: 10,
        minPrice: 4,
        maxPrice: 30,
        icon: "pi pi-file",
        tier: 0,
        sortOrder: 0
    },
    {
        slug: "manga_volume",
        name: "Manga Band", description: "Hergestellt aus 5x Druckpapier.",
        groupKey: "otaku",
        basePrice: 55,
        minPrice: 22,
        maxPrice: 145,
        icon: "pi pi-book",
        tier: 1,
        craftedFrom: "blank_paper",
        craftCost: 5,
        sortOrder: 1
    },
    {
        slug: "manga_box_set",
        name: "Manga Sammelbox",
        description: "Hergestellt aus 5x Manga Band.",
        groupKey: "otaku",
        basePrice: 250,
        minPrice: 100,
        maxPrice: 660,
        icon: "pi pi-inbox",
        tier: 2,
        craftedFrom: "manga_volume",
        craftCost: 5,
        sortOrder: 2
    },
    {
        slug: "collectors_edition",
        name: "Collector's Edition",
        description: "Hergestellt aus 2x Manga Sammelbox.",
        groupKey: "otaku",
        basePrice: 700,
        minPrice: 280,
        maxPrice: 1850,
        icon: "pi pi-trophy",
        tier: 3,
        craftedFrom: "manga_box_set",
        craftCost: 2,
        volatility: 1.5,
        sortOrder: 3
    },
    // Figur-Kette: Plastik → Rohfigur → Nendoroid → Limitierte Figur
    {
        slug: "raw_plastic",
        name: "Rohmaterial",
        description: "Hergestellt aus 4x Rohmaterial.",
        groupKey: "otaku",
        basePrice: 15,
        minPrice: 6,
        maxPrice: 45,
        icon: "pi pi-circle",
        tier: 0,
        sortOrder: 4
    },
    {
        slug: "figure_base",
        name: "Rohfigur", description: "Hergestellt aus 4x Rohmaterial.",
        groupKey: "otaku",
        basePrice: 60,
        minPrice: 24,
        maxPrice: 160,
        icon: "pi pi-user",
        tier: 1,
        craftedFrom: "raw_plastic",
        craftCost: 4,
        sortOrder: 5
    },
    {
        slug: "nendoroid",
        name: "Nendoroid",
        description: "Hergestellt aus 2x Rohfigur.",
        groupKey: "otaku",
        basePrice: 200,
        minPrice: 80,
        maxPrice: 520,
        icon: "pi pi-star",
        tier: 2,
        craftedFrom: "figure_base",
        craftCost: 2,
        volatility: 1.3,
        sortOrder: 6
    },
    {
        slug: "limited_figure",
        name: "Limitierte Figur",
        description: "Hergestellt aus 2x Nendoroid.",
        groupKey: "otaku",
        basePrice: 650,
        minPrice: 260,
        maxPrice: 1700,
        icon: "pi pi-crown",
        tier: 3,
        craftedFrom: "nendoroid",
        craftCost: 2,
        volatility: 1.6,
        sortOrder: 7
    },
    // Cosplay-Kette: Stoff → Cosplay-Teil → Cosplay-Set
    {
        slug: "fabric",
        name: "Stoff",
        description: "Hergestellt aus 4x Stoff.",
        groupKey: "otaku",
        basePrice: 20,
        minPrice: 8,
        maxPrice: 55,
        icon: "pi pi-palette",
        tier: 0,
        sortOrder: 8
    },
    {
        slug: "cosplay_piece",
        name: "Cosplay-Teil", description: "Hergestellt aus 4x Stoff.",
        groupKey: "otaku",
        basePrice: 80,
        minPrice: 32,
        maxPrice: 210,
        icon: "pi pi-user",
        tier: 1,
        craftedFrom: "fabric",
        craftCost: 4,
        sortOrder: 9
    },
    {
        slug: "cosplay_set",
        name: "Vollständiges Cosplay",
        description: "Hergestellt aus 4x Cosplay-Teil.",
        groupKey: "otaku",
        basePrice: 350,
        minPrice: 140,
        maxPrice: 920,
        icon: "pi pi-users",
        tier: 2,
        craftedFrom: "cosplay_piece",
        craftCost: 4,
        volatility: 1.2,
        sortOrder: 10
    },
    // Sammelkarten
    {
        slug: "trading_card",
        name: "Sammelkarte",
        description: "Hergestellt aus 4x Mithrilstaub.",
        groupKey: "otaku",
        basePrice: 45,
        minPrice: 18,
        maxPrice: 250,
        icon: "pi pi-id-card",
        tier: 0,
        volatility: 1.8,
        sortOrder: 11
    },

    // ═══ Mythisch / Rare ════════════════════════════════════════════════════
    // Mithril-Kette: Mithrilstaub → Mithrilbarren → Mithrilklinge → Mithrilrüstung
    {
        slug: "mithril_dust",
        name: "Mithrilstaub",
        description: "Seltener Mithrilstaub aus den Tiefen der Erde.",
        groupKey: "rare",
        basePrice: 200,
        minPrice: 80,
        maxPrice: 520,
        icon: "pi pi-sparkles",
        tier: 0,
        volatility: 1.5,
        sortOrder: 0
    },
    {
        slug: "mithril_ingot",
        name: "Mithrilbarren", description: "Hergestellt aus 4x Mithrilstaub.",
        groupKey: "rare",
        basePrice: 550,
        minPrice: 220,
        maxPrice: 1450,
        icon: "pi pi-stop",
        tier: 1,
        craftedFrom: "mithril_dust",
        craftCost: 4,
        volatility: 1.5,
        sortOrder: 1
    },
    {
        slug: "mithril_blade",
        name: "Mithrilklinge",
        description: "Hergestellt aus 2x Mithrilbarren.",
        groupKey: "rare",
        basePrice: 1400,
        minPrice: 560,
        maxPrice: 3700,
        icon: "pi pi-bolt",
        tier: 2,
        craftedFrom: "mithril_ingot",
        craftCost: 2,
        volatility: 1.8,
        sortOrder: 2
    },
    {
        slug: "mithril_armor",
        name: "Mithrilrüstung",
        description: "Hergestellt aus 2x Mithrilklinge.",
        groupKey: "rare",
        basePrice: 3500,
        minPrice: 1400,
        maxPrice: 9200,
        icon: "pi pi-shield",
        tier: 3,
        craftedFrom: "mithril_blade",
        craftCost: 2,
        volatility: 2.0,
        sortOrder: 3
    },
    // Drachenschuppe → Drachenpanzer
    {
        slug: "dragon_scale",
        name: "Drachenschuppe",
        description: "Hergestellt aus 4x Drachenschuppe.",
        groupKey: "rare",
        basePrice: 800,
        minPrice: 320,
        maxPrice: 2100,
        icon: "pi pi-bolt",
        tier: 0,
        volatility: 2.0,
        sortOrder: 4
    },
    {
        slug: "dragon_armor",
        name: "Drachenpanzer", description: "Hergestellt aus 4x Drachenschuppe.",
        groupKey: "rare",
        basePrice: 2500,
        minPrice: 1000,
        maxPrice: 6600,
        icon: "pi pi-shield",
        tier: 1,
        craftedFrom: "dragon_scale",
        craftCost: 4,
        volatility: 2.2,
        sortOrder: 5
    },
    // Phönix-Kette: Phönixfeder → Phönixumhang
    {
        slug: "phoenix_feather",
        name: "Phönixfeder",
        description: "Hergestellt aus 3x Phönixfeder.",
        groupKey: "rare",
        basePrice: 1200,
        minPrice: 480,
        maxPrice: 3200,
        icon: "pi pi-sun",
        tier: 0,
        volatility: 2.5,
        sortOrder: 6
    },
    {
        slug: "phoenix_cloak",
        name: "Phönixumhang", description: "Hergestellt aus 3x Phönixfeder.",
        groupKey: "rare",
        basePrice: 3800,
        minPrice: 1520,
        maxPrice: 10000,
        icon: "pi pi-sparkles",
        tier: 1,
        craftedFrom: "phoenix_feather",
        craftCost: 3,
        volatility: 2.5,
        sortOrder: 7
    },
    // Mondstein-Kette: Mondstein → Mondstein-Amulett → Mondstein-Krone
    {
        slug: "moonstone",
        name: "Mondstein",
        description: "Hergestellt aus 3x Mondstein.",
        groupKey: "rare",
        basePrice: 600,
        minPrice: 240,
        maxPrice: 1600,
        icon: "pi pi-moon",
        tier: 0,
        volatility: 1.9,
        sortOrder: 8
    },
    {
        slug: "moonstone_amulet",
        name: "Mondstein-Amulett", description: "Hergestellt aus 3x Mondstein.",
        groupKey: "rare",
        basePrice: 1600,
        minPrice: 640,
        maxPrice: 4200,
        icon: "pi pi-heart",
        tier: 1,
        craftedFrom: "moonstone",
        craftCost: 3,
        volatility: 2.0,
        sortOrder: 9
    },
    {
        slug: "moonstone_crown",
        name: "Mondstein-Krone",
        description: "Hergestellt aus 2x Mondstein-Amulett.",
        groupKey: "rare",
        basePrice: 4500,
        minPrice: 1800,
        maxPrice: 12000,
        icon: "pi pi-crown",
        tier: 2,
        craftedFrom: "moonstone_amulet",
        craftCost: 2,
        volatility: 2.3,
        sortOrder: 10
    },
    // Geisteressenz → Geisterschild
    {
        slug: "spirit_essence",
        name: "Geisteressenz",
        description: "Hergestellt aus 3x Geisteressenz.",
        groupKey: "rare",
        basePrice: 900,
        minPrice: 360,
        maxPrice: 2400,
        icon: "pi pi-eye",
        tier: 0,
        volatility: 2.0,
        sortOrder: 11
    },
    {
        slug: "spirit_shield",
        name: "Geisterschild", description: "Hergestellt aus 3x Geisteressenz.",
        groupKey: "rare",
        basePrice: 2800,
        minPrice: 1120,
        maxPrice: 7400,
        icon: "pi pi-shield",
        tier: 1,
        craftedFrom: "spirit_essence",
        craftCost: 3,
        volatility: 2.2,
        sortOrder: 12
    },
    // Standalone Rare
    {
        slug: "ancient_scroll",
        name: "Alte Schriftrolle",
        description: "Uralte Schriftrolle mit vergessenem Wissen.",
        groupKey: "rare",
        basePrice: 500,
        minPrice: 200,
        maxPrice: 1300,
        icon: "pi pi-file",
        tier: 0,
        volatility: 1.8,
        sortOrder: 13
    },
    {
        slug: "oni_horn",
        name: "Oni-Horn",
        description: "Horn eines besiegten Oni-Dämons.",
        groupKey: "rare",
        basePrice: 1000,
        minPrice: 400,
        maxPrice: 2600,
        icon: "pi pi-exclamation-triangle",
        tier: 0,
        volatility: 2.2,
        sortOrder: 14
    }
];

const DEFAULT_EVENTS: CreateMarketEventDto[] = [
    // ═══ Mining Events ══════════════════════════════════════════════════════
    {
        title: "Kupferader entdeckt!",
        description: "Eine riesige Kupferader wurde gefunden — Kupfererz flutet den Markt.",
        affectedSlugs: ["copper_ore", "copper_ingot"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 8
    },
    {
        title: "Eisenmangel",
        description: "Eisen wird knapp — die Preise steigen.",
        affectedSlugs: ["iron_ore", "steel_ingot", "tamahagane"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
    },
    {
        title: "Goldrausch!",
        description: "Alle suchen Gold — enorme Nachfrage treibt die Preise.",
        affectedSlugs: ["gold_ore", "gold_ingot", "gold_jewelry"],
        modifierType: "set_max",
        weight: 5
    },
    {
        title: "Schwertschmiede-Meister",
        description: "Ein berühmter Schmied braucht Stahl — Tamahagane und Katana sind gefragt.",
        affectedSlugs: ["tamahagane", "katana"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 7
    },
    {
        title: "Kristallmine eingestürzt",
        description: "Kristalle werden selten — Preise explodieren.",
        affectedSlugs: ["crystal_raw", "crystal_lens", "crystal_orb"],
        modifierType: "multiply",
        modifierValue: 1.8,
        weight: 5
    },
    {
        title: "Jade-Auktion",
        description: "Seltene Jade wird versteigert — alle Jade-Produkte im Aufschwung.",
        affectedSlugs: ["jade_raw", "jade_polished", "jade_amulet"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 7
    },
    {
        title: "Elektronik-Boom",
        description: "Hohe Nachfrage nach Elektronik treibt die gesamte Kupfer-Kette.",
        affectedSlugs: ["copper_wire", "electronics"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Überschuss an Erzen",
        description: "Minen produzieren zu viel — Rohstoffpreise fallen.",
        affectedSlugs: ["copper_ore", "iron_ore", "gold_ore", "jade_raw", "crystal_raw"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 6
    },

    // ═══ Nature Events ══════════════════════════════════════════════════════
    {
        title: "Kirschblüten-Saison!",
        description: "Sakura-Blüten sind überall — Überangebot drückt den Preis.",
        affectedSlugs: ["sakura_petals", "sakura_extract"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 10
    },
    {
        title: "Parfüm-Wahn",
        description: "Sakura-Parfüm ist der neue Trend — Preise steigen stark.",
        affectedSlugs: ["sakura_perfume", "sakura_extract"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Bambus-Dürre",
        description: "Bambus wächst nicht — extreme Knappheit.",
        affectedSlugs: ["bamboo", "bamboo_planks"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Möbelmesse",
        description: "Bambusmöbel sind gefragt wie nie.",
        affectedSlugs: ["bamboo_furniture", "bamboo_planks"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
    },
    {
        title: "Tee-Rekordernte",
        description: "Perfektes Wetter — Teeblätter und Matcha im Überfluss.",
        affectedSlugs: ["tea_leaves", "matcha_powder"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 8
    },
    {
        title: "Matcha-Hype",
        description: "Matcha wird zum Superfood erklärt — Premium-Sets fliegen aus den Regalen.",
        affectedSlugs: ["matcha_set", "matcha_powder"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Seidenstraße geöffnet",
        description: "Neue Handelsroute — Seide und Kimonos werden günstig.",
        affectedSlugs: ["silk", "kimono", "silkworm"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 7
    },
    {
        title: "Kimono-Festival",
        description: "Kimonos sind extrem gefragt — Preise steigen.",
        affectedSlugs: ["kimono", "silk"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 7
    },
    {
        title: "Lotusblüte-Saison",
        description: "Lotusblüten blühen — Überangebot.",
        affectedSlugs: ["lotus_seed", "lotus_blossom"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 8
    },
    {
        title: "Heilkräuter-Nachfrage",
        description: "Lotusessenz wird als Heilmittel gesucht.",
        affectedSlugs: ["lotus_essence", "lotus_blossom"],
        modifierType: "multiply",
        modifierValue: 1.8,
        weight: 5
    },

    // ═══ Food Events ════════════════════════════════════════════════════════
    {
        title: "Ramen-Festival!",
        description: "Ramen-Stände überall — die ganze Produktionskette boomt.",
        affectedSlugs: ["flour", "noodle_dough", "ramen_bowl"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 10
    },
    {
        title: "Sushi-Woche",
        description: "Sushi-Restaurants machen Werbung — Fisch und Sushi-Platten gefragt.",
        affectedSlugs: ["raw_fish", "sashimi", "sushi_platter"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 8
    },
    {
        title: "Fischfang-Boom",
        description: "Fischer haben eine Rekordfang — Fischpreise fallen.",
        affectedSlugs: ["raw_fish", "sashimi"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 7
    },
    {
        title: "Reis-Knappheit",
        description: "Schlechte Ernte — Reis wird teuer.",
        affectedSlugs: ["rice", "onigiri", "sake_rice"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Bento-Trend",
        description: "Bento-Boxen sind der neue Lunch-Trend.",
        affectedSlugs: ["bento_box", "onigiri"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 8
    },
    {
        title: "Wagashi-Kunstmarkt",
        description: "Handgemachte Süßigkeiten sind im Trend.",
        affectedSlugs: ["wagashi", "anko_paste", "azuki_beans"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
    },
    {
        title: "Sake-Fest!",
        description: "Großes Sake-Festival — Premium-Sake explodiert im Preis.",
        affectedSlugs: ["sake", "premium_sake"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Sake-Überproduktion",
        description: "Zu viel Sake produziert — Preise sinken.",
        affectedSlugs: ["sake", "sake_rice"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 7
    },
    {
        title: "Erntefest",
        description: "Großes Erntefest — alle Grundnahrungsmittel werden günstig.",
        affectedSlugs: ["rice", "flour", "azuki_beans", "raw_fish", "sake_rice"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 8
    },
    {
        title: "Lebensmittelkrise",
        description: "Naturkatastrophe — alle Nahrungsmittel werden teuer.",
        affectedSlugs: ["rice", "flour", "raw_fish", "onigiri", "ramen_bowl"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 4
    },

    // ═══ Otaku Events ═══════════════════════════════════════════════════════
    {
        title: "Anime-Convention!",
        description: "Große Convention — Otaku-Waren boomen.",
        affectedSlugs: ["manga_volume", "nendoroid", "limited_figure", "cosplay_set", "trading_card"],
        modifierType: "set_max",
        weight: 8
    },
    {
        title: "Manga-Überschwemmung",
        description: "Neuer Manga-Verlag druckt zu viel — Manga-Preise fallen.",
        affectedSlugs: ["manga_volume", "blank_paper", "manga_box_set"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 8
    },
    {
        title: "Sammelkarten-Hype!",
        description: "Neue Kartenedition — Trading Cards explodieren im Preis.",
        affectedSlugs: ["trading_card"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Nendoroid-Kollaboration",
        description: "Beliebter Anime bekommt Nendoroid — Figuren gefragt.",
        affectedSlugs: ["nendoroid", "limited_figure", "figure_base"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
    },
    {
        title: "Cosplay-Wettbewerb",
        description: "Großer Cosplay-Wettbewerb steht an.",
        affectedSlugs: ["cosplay_piece", "cosplay_set", "fabric"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 8
    },
    {
        title: "Collector's Edition Ankündigung",
        description: "Limitierte Collector's Edition angekündigt — Preise steigen enorm.",
        affectedSlugs: ["collectors_edition", "manga_box_set"],
        modifierType: "set_max",
        weight: 4
    },
    {
        title: "Spielzeugmesse",
        description: "Internationale Spielzeugmesse — alle Figuren gefragt.",
        affectedSlugs: ["figure_base", "nendoroid", "limited_figure", "raw_plastic"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 7
    },
    {
        title: "Druckkosten gesunken",
        description: "Papier wird billig — Manga-Produktion wird günstiger.",
        affectedSlugs: ["blank_paper", "manga_volume"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 7
    },

    // ═══ Rare/Mythical Events ═══════════════════════════════════════════════
    {
        title: "Drachenfest!",
        description: "Drachenschuppen sind extrem gefragt.",
        affectedSlugs: ["dragon_scale", "dragon_armor"],
        modifierType: "multiply",
        modifierValue: 1.8,
        weight: 5
    },
    {
        title: "Phönix-Erscheinung!",
        description: "Ein Phönix wurde gesichtet — Federn werden extrem wertvoll.",
        affectedSlugs: ["phoenix_feather", "phoenix_cloak"],
        modifierType: "set_max",
        weight: 3
    },
    {
        title: "Mithril-Fund!",
        description: "Neue Mithril-Vorkommen entdeckt — Mithrilstaub wird günstiger.",
        affectedSlugs: ["mithril_dust", "mithril_ingot"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 5
    },
    {
        title: "Waffenschmied-Turnier",
        description: "Schmiede brauchen seltene Materialien — Mithril und Drachenschuppen gefragt.",
        affectedSlugs: ["mithril_blade", "mithril_armor", "dragon_armor", "katana"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 6
    },
    {
        title: "Mondnacht-Ritual",
        description: "Seltenes Ritual — Mondstein-Artefakte extrem gefragt.",
        affectedSlugs: ["moonstone", "moonstone_amulet", "moonstone_crown"],
        modifierType: "set_max",
        weight: 4
    },
    {
        title: "Geister-Erscheinung",
        description: "Geister wurden gesichtet — Geisteressenz wird reichlich verfügbar.",
        affectedSlugs: ["spirit_essence", "spirit_shield"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 6
    },
    {
        title: "Oni-Invasion!",
        description: "Oni greifen an — Oni-Hörner fallen überall.",
        affectedSlugs: ["oni_horn"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 5
    },
    {
        title: "Alte Bibliothek entdeckt",
        description: "Schriftrollen aus einer alten Bibliothek gefunden.",
        affectedSlugs: ["ancient_scroll"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 6
    },
    {
        title: "Große Reinigung",
        description: "Dunkle Magie wird verbannt — mystische Artefakte verlieren an Wert.",
        affectedSlugs: ["spirit_essence", "moonstone", "phoenix_feather", "ancient_scroll"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 3
    },
    {
        title: "Goldenes Zeitalter",
        description: "Alle seltenen Items steigen massiv im Wert.",
        affectedSlugs: ["mithril_armor", "dragon_armor", "phoenix_cloak", "moonstone_crown", "spirit_shield"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 3
    },

    // ═══ Global/Cross-chain Events ══════════════════════════════════════════
    {
        title: "Großer Basar",
        description: "Markttag — alle verarbeiteten Waren werden günstiger.",
        affectedSlugs: [
            "onigiri",
            "ramen_bowl",
            "sashimi",
            "sake",
            "wagashi",
            "bamboo_planks",
            "silk",
            "copper_ingot",
            "steel_ingot"
        ],
        modifierType: "multiply",
        modifierValue: 0.7,
        weight: 7
    },
    {
        title: "Handwerker-Meisterkurs",
        description: "Handwerker lernen neue Techniken — Verarbeitetes wird wertvoller.",
        affectedSlugs: [
            "katana",
            "electronics",
            "gold_jewelry",
            "jade_amulet",
            "crystal_orb",
            "bamboo_furniture",
            "kimono",
            "cosplay_set"
        ],
        modifierType: "multiply",
        modifierValue: 1.45,
        weight: 6
    },
    {
        title: "Handelskrieg",
        description: "Embargo auf Rohstoffe — alle Rohmaterialien werden teuer.",
        affectedSlugs: [
            "copper_ore",
            "iron_ore",
            "gold_ore",
            "jade_raw",
            "crystal_raw",
            "bamboo",
            "tea_leaves",
            "rice",
            "flour"
        ],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 4
    },
    {
        title: "Friedensvertrag",
        description: "Handel normalisiert sich — alle Preise fallen moderat.",
        affectedSlugs: ["copper_ore", "iron_ore", "gold_ore", "steel_ingot", "tamahagane", "mithril_dust"],
        modifierType: "multiply",
        modifierValue: 0.65,
        weight: 5
    },
    {
        title: "Großes Erdbeben",
        description: "Naturkatastrophe — alle seltenen Items werden noch seltener.",
        affectedSlugs: ["dragon_scale", "phoenix_feather", "moonstone", "mithril_dust", "crystal_raw"],
        modifierType: "multiply",
        modifierValue: 1.9,
        weight: 3
    },
    {
        title: "Taifun-Saison",
        description: "Stürme zerstören Ernten und Minen.",
        affectedSlugs: ["rice", "tea_leaves", "bamboo", "sakura_petals", "copper_ore", "iron_ore"],
        modifierType: "set_max",
        weight: 4
    },
    {
        title: "Internet-Meme-Boom",
        description: "Ein Meme geht viral — zufällige Sammelstücke werden gehyped.",
        affectedSlugs: ["trading_card", "nendoroid", "manga_volume"],
        modifierType: "set_max",
        weight: 5
    },
    {
        title: "Silvesternacht",
        description: "Feierlichkeiten — Sake und Wagashi boomen.",
        affectedSlugs: ["premium_sake", "sake", "wagashi", "mochi"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Konjunktur-Boom",
        description: "Wirtschaft brummt — alle Masterwork-Produkte werden wertvoller.",
        affectedSlugs: [
            "electronics",
            "katana",
            "collectors_edition",
            "limited_figure",
            "mithril_armor",
            "moonstone_crown",
            "phoenix_cloak"
        ],
        modifierType: "multiply",
        modifierValue: 1.4,
        weight: 5
    },
    {
        title: "Schwarzmarkt-Razzia",
        description: "Behörden beschlagnahmen seltene Waren — Preise steigen.",
        affectedSlugs: ["ancient_scroll", "oni_horn", "spirit_essence", "dragon_scale"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 5
    }
];

// ─── Activity log ─────────────────────────────────────────────────────────────

const ACTIVITY_MAX = 200;
const activityLog: MarketActivityDto[] = [];

function pushActivity(act: Omit<MarketActivityDto, "id">): void {
    activityLog.unshift({
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...act
    });
    if (activityLog.length > ACTIVITY_MAX) {
        activityLog.length = ACTIVITY_MAX;
    }
}

// ─── Schedule Helper ─────────────────────────────────────────────────────────

function computeNextUpdate(schedule: MarketSchedule): Date | null {
    const now = new Date();
    switch (schedule.type) {
        case "disabled":
            return null;
        case "minutely": {
            const ms = Math.max(1, schedule.minutelyInterval || 60) * 60 * 1000;
            return new Date(now.getTime() + ms);
        }
        case "hourly": {
            const minute = Math.max(0, Math.min(59, schedule.hourlyAtMinute ?? 0));
            const next = new Date(now);
            next.setSeconds(0, 0);
            next.setMinutes(minute);
            if (next <= now) next.setHours(next.getHours() + 1);
            return next;
        }
        case "daily": {
            const times = schedule.dailyTimes?.length ? schedule.dailyTimes : ["00:00"];
            const candidates = times.map((t) => {
                const [h, m] = t.split(":").map(Number);
                const d = new Date(now);
                d.setHours(h, m, 0, 0);
                if (d <= now) d.setDate(d.getDate() + 1);
                return d;
            });
            return candidates.reduce((a, b) => (a < b ? a : b));
        }
        case "weekly": {
            const days = schedule.weeklyDays?.length ? schedule.weeklyDays : [1];
            const [h, m] = (schedule.weeklyTime || "00:00").split(":").map(Number);
            const candidates = days.map((day) => {
                const d = new Date(now);
                d.setHours(h, m, 0, 0);
                const diff = (day - d.getDay() + 7) % 7;
                d.setDate(d.getDate() + diff);
                if (d <= now) d.setDate(d.getDate() + 7);
                return d;
            });
            return candidates.reduce((a, b) => (a < b ? a : b));
        }
        default:
            return null;
    }
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DynamicMarketService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DynamicMarketService.name);

    private configEntity: MarketConfigEntity | null = null;

    /** Previous prices for trend calculation */
    private previousPrices = new Map<string, number>();

    private updateTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        @InjectRepository(MarketResourceEntity)
        private readonly resourceRepo: Repository<MarketResourceEntity>,
        @InjectRepository(MarketEventEntity)
        private readonly eventRepo: Repository<MarketEventEntity>,
        @InjectRepository(MarketEventLogEntity)
        private readonly eventLogRepo: Repository<MarketEventLogEntity>,
        @InjectRepository(MarketTransactionEntity)
        private readonly txRepo: Repository<MarketTransactionEntity>,
        @InjectRepository(UserInventoryEntity)
        private readonly inventoryRepo: Repository<UserInventoryEntity>,
        @InjectRepository(MarketConfigEntity)
        private readonly configRepo: Repository<MarketConfigEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly creditService: CreditService
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.seedMissingDefaults();
            const resources = await this.resourceRepo.find();
            for (const r of resources) {
                this.previousPrices.set(r.slug, r.currentPrice);
            }
            this.configEntity = await this.getOrCreateConfigEntity();
            await this.scheduleNextUpdate();
            this.logger.log(`Dynamic Market initialized with ${resources.length} resources.`);
        } catch (err) {
            this.logger.warn(`Dynamic Market init skipped: ${String(err)}`);
        }
    }

    onModuleDestroy(): void {
        if (this.updateTimer) clearTimeout(this.updateTimer);
    }

    // ─── Public: Market Data ────────────────────────────────────────────────

    async getMarketOverview(): Promise<MarketGroupDto[]> {
        const resources = await this.resourceRepo.find({
            where: { isActive: true },
            order: { groupKey: "ASC", sortOrder: "ASC" }
        });

        const groups = new Map<string, MarketResourceDto[]>();
        for (const r of resources) {
            const dto = this.toResourceDto(r);
            const list = groups.get(r.groupKey) ?? [];
            list.push(dto);
            groups.set(r.groupKey, list);
        }

        return Array.from(groups.entries()).map(([groupKey, items]) => ({
            groupKey,
            resources: items
        }));
    }

    async getResource(slug: string): Promise<MarketResourceDto> {
        const r = await this.resourceRepo.findOneBy({ slug });
        if (!r) throw new BadRequestException(`Resource not found: ${slug}`);
        return this.toResourceDto(r);
    }

    async getPriceHistory(slug: string, limit = 20): Promise<MarketEventLogDto[]> {
        const logs = await this.eventLogRepo.find({
            order: { createdAt: "DESC" },
            take: limit
        });
        // Filter to logs that affected this slug
        return logs.filter((l) => slug in (l.priceChanges ?? {})).map(this.toEventLogDto);
    }

    async getRecentEvents(limit = 10): Promise<MarketEventLogDto[]> {
        const logs = await this.eventLogRepo.find({
            order: { createdAt: "DESC" },
            take: limit
        });
        return logs.map(this.toEventLogDto);
    }

    // ─── Public: Trading ────────────────────────────────────────────────────

    async buy(userId: string, slug: string, quantity: number): Promise<MarketTradeResult> {
        this.validateQuantity(quantity);
        const resource = await this.resourceRepo.findOneBy({ slug, isActive: true });
        if (!resource) throw new BadRequestException("Resource not found or inactive.");
        if (!resource.canBuy) throw new BadRequestException("This resource cannot be purchased.");

        // Stock check
        if (resource.maxStock !== null) {
            const stock = resource.currentStock ?? 0;
            if (stock < quantity) {
                throw new BadRequestException(`Only ${stock} units available in stock.`);
            }
        }

        const totalPrice = resource.currentPrice * quantity;

        // Deduct coins from user wallet
        await this.creditService.deductCredits(userId, totalPrice, "market_buy", `Kauf: ${quantity}x ${resource.name}`);

        // Add to inventory
        const inv = await this.findOrCreateInventory(userId, resource.id);
        inv.quantity += quantity;
        await this.inventoryRepo.save(inv);

        // Decrement stock if limited
        if (resource.maxStock !== null) {
            resource.currentStock = Math.max(0, (resource.currentStock ?? 0) - quantity);
        }
        // Track cumulative buys
        resource.totalUnitsBought = Number(resource.totalUnitsBought) + quantity;

        // Track demand – buying increases unitsBought
        resource.unitsBought += quantity;
        await this.resourceRepo.save(resource);

        // Record transaction
        await this.txRepo.save(
            this.txRepo.create({
                userId,
                resourceId: resource.id,
                resourceSlug: resource.slug,
                action: "buy",
                quantity,
                pricePerUnit: resource.currentPrice,
                totalPrice
            })
        );

        const [wallet, buyer] = await Promise.all([
            this.creditService.getWallet(userId),
            this.userRepo.findOne({ where: { id: userId }, select: { displayName: true } })
        ]);

        pushActivity({
            type: "buy",
            resourceSlug: resource.slug,
            resourceName: resource.name,
            resourceIcon: resource.icon,
            quantity,
            pricePerUnit: resource.currentPrice,
            totalPrice,
            userDisplay: buyer?.displayName ?? `Spieler #${userId.slice(-4)}`,
            timestamp: new Date().toISOString()
        });

        return {
            action: "buy",
            resourceSlug: resource.slug,
            quantity,
            pricePerUnit: resource.currentPrice,
            totalPrice,
            newBalance: wallet.balance,
            newInventoryQuantity: inv.quantity
        };
    }

    async sell(userId: string, slug: string, quantity: number): Promise<MarketTradeResult> {
        this.validateQuantity(quantity);
        const resource = await this.resourceRepo.findOneBy({ slug, isActive: true });
        if (!resource) throw new BadRequestException("Resource not found or inactive.");
        if (!resource.canSell) throw new BadRequestException("This resource cannot be sold.");

        // Check inventory
        const inv = await this.inventoryRepo.findOneBy({ userId, resourceId: resource.id });
        if (!inv || inv.quantity < quantity) {
            throw new BadRequestException("Insufficient inventory.");
        }

        const sellPrice = Math.floor(resource.currentPrice * 0.8); // 80% of current price
        const totalPrice = sellPrice * quantity;

        // Add coins to user wallet
        await this.creditService.addCredits(
            userId,
            totalPrice,
            "market_sell",
            `Verkauf: ${quantity}x ${resource.name}`
        );

        // Remove from inventory
        inv.quantity -= quantity;
        await this.inventoryRepo.save(inv);

        // Increment stock if limited (selling returns to market pool)
        if (resource.maxStock !== null) {
            resource.currentStock = Math.min(resource.maxStock, (resource.currentStock ?? 0) + quantity);
        }
        // Track cumulative sells
        resource.totalUnitsSold = Number(resource.totalUnitsSold) + quantity;

        // Track supply – selling increases unitsSold
        resource.unitsSold += quantity;
        await this.resourceRepo.save(resource);

        // Record transaction
        await this.txRepo.save(
            this.txRepo.create({
                userId,
                resourceId: resource.id,
                resourceSlug: resource.slug,
                action: "sell",
                quantity,
                pricePerUnit: sellPrice,
                totalPrice
            })
        );

        const [wallet, seller] = await Promise.all([
            this.creditService.getWallet(userId),
            this.userRepo.findOne({ where: { id: userId }, select: { displayName: true } })
        ]);

        pushActivity({
            type: "sell",
            resourceSlug: resource.slug,
            resourceName: resource.name,
            resourceIcon: resource.icon,
            quantity,
            pricePerUnit: sellPrice,
            totalPrice,
            userDisplay: seller?.displayName ?? `Spieler #${userId.slice(-4)}`,
            timestamp: new Date().toISOString()
        });

        return {
            action: "sell",
            resourceSlug: resource.slug,
            quantity,
            pricePerUnit: sellPrice,
            totalPrice,
            newBalance: wallet.balance,
            newInventoryQuantity: inv.quantity
        };
    }

    async getUserInventory(userId: string): Promise<UserInventoryDto[]> {
        const items = await this.inventoryRepo.find({ where: { userId } });
        if (!items.length) return [];

        const resourceIds = items.map((i) => i.resourceId);
        const resources = await this.resourceRepo.findByIds(resourceIds);
        const resourceMap = new Map(resources.map((r) => [r.id, r]));

        return items
            .filter((i) => i.quantity > 0)
            .map((i) => {
                const r = resourceMap.get(i.resourceId);
                return {
                    resourceId: i.resourceId,
                    resourceSlug: r?.slug ?? "unknown",
                    resourceName: r?.name ?? "Unknown",
                    resourceIcon: r?.icon ?? "pi pi-box",
                    quantity: i.quantity,
                    currentPrice: r?.currentPrice ?? 0,
                    totalValue: i.quantity * (r ? Math.floor(r.currentPrice * 0.8) : 0)
                };
            });
    }

    async getUserTransactions(
        userId: string,
        page = 1,
        limit = 20
    ): Promise<{ data: MarketTransactionEntity[]; total: number }> {
        const [data, total] = await this.txRepo.findAndCount({
            where: { userId },
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });
        return { data, total };
    }

    // ─── Admin: CRUD ────────────────────────────────────────────────────────

    async getAllResources(): Promise<MarketResourceDto[]> {
        const resources = await this.resourceRepo.find({ order: { groupKey: "ASC", sortOrder: "ASC" } });
        return resources.map((r) => this.toResourceDto(r));
    }

    async createResource(dto: CreateMarketResourceDto): Promise<MarketResourceDto> {
        const entity = this.resourceRepo.create({
            slug: dto.slug,
            name: dto.name,
            description: dto.description ?? null,
            icon: dto.icon ?? "pi pi-box",
            imageUrl: dto.imageUrl ?? null,
            groupKey: dto.groupKey,
            basePrice: dto.basePrice,
            minPrice: dto.minPrice,
            maxPrice: dto.maxPrice,
            currentPrice: dto.basePrice,
            volatility: dto.volatility ?? 1.0,
            canBuy: dto.canBuy ?? true,
            canSell: dto.canSell ?? true,
            sortOrder: dto.sortOrder ?? 0,
            tier: dto.tier ?? 0,
            craftedFrom: dto.craftedFrom ?? null,
            craftCost: dto.craftCost ?? 1,
            maxStock: dto.maxStock ?? null,
            currentStock: dto.maxStock ?? null
        });
        const saved = await this.resourceRepo.save(entity);
        return this.toResourceDto(saved);
    }

    async updateResource(id: string, dto: UpdateMarketResourceDto): Promise<MarketResourceDto> {
        const resource = await this.resourceRepo.findOneBy({ id });
        if (!resource) throw new BadRequestException("Resource not found.");
        Object.assign(resource, dto);
        const saved = await this.resourceRepo.save(resource);
        return this.toResourceDto(saved);
    }

    async deleteResource(id: string): Promise<void> {
        await this.resourceRepo.delete(id);
    }

    async resetPrices(): Promise<{ reset: number }> {
        const resources = await this.resourceRepo.find();
        for (const r of resources) {
            r.currentPrice = r.basePrice;
            r.unitsSold = 0;
            r.unitsBought = 0;
        }
        await this.resourceRepo.save(resources);
        return { reset: resources.length };
    }

    async fullReset(): Promise<{ message: string }> {
        // Clear all user inventories, transactions and event logs
        await this.inventoryRepo.createQueryBuilder().delete().execute();
        await this.txRepo.createQueryBuilder().delete().execute();
        await this.eventLogRepo.createQueryBuilder().delete().execute();

        // Reset all resource stats and prices to defaults
        const resources = await this.resourceRepo.find();
        for (const r of resources) {
            r.currentPrice = r.basePrice;
            r.unitsSold = 0;
            r.unitsBought = 0;
            r.totalUnitsBought = 0;
            r.totalUnitsSold = 0;
            r.priceHistory = [];
            r.currentStock = r.maxStock ?? null;
        }
        await this.resourceRepo.save(resources);

        return { message: "Market fully reset." };
    }

    // ─── Admin: Events CRUD ─────────────────────────────────────────────────

    async getAllEvents(): Promise<MarketEventDto[]> {
        const events = await this.eventRepo.find({ order: { createdAt: "DESC" } });
        return events.map(this.toEventDto);
    }

    async createEvent(dto: CreateMarketEventDto): Promise<MarketEventDto> {
        const entity = this.eventRepo.create({
            title: dto.title,
            description: dto.description,
            affectedSlugs: dto.affectedSlugs,
            modifierType: dto.modifierType,
            modifierValue: dto.modifierValue ?? 0,
            weight: dto.weight ?? 10
        });
        const saved = await this.eventRepo.save(entity);
        return this.toEventDto(saved);
    }

    async updateEvent(id: string, dto: Partial<CreateMarketEventDto>): Promise<MarketEventDto> {
        const event = await this.eventRepo.findOneBy({ id });
        if (!event) throw new BadRequestException("Event not found.");
        Object.assign(event, dto);
        const saved = await this.eventRepo.save(event);
        return this.toEventDto(saved);
    }

    async deleteEvent(id: string): Promise<void> {
        await this.eventRepo.delete(id);
    }

    async triggerRandomEvent(): Promise<MarketEventLogDto | null> {
        return this.executeRandomEvent();
    }

    // ─── Admin: Config ──────────────────────────────────────────────────────

    getConfig(): MarketConfigDto {
        const e = this.configEntity;
        return {
            eventChancePercent: e?.eventChancePercent ?? 20,
            demandDecayFactor: e?.demandDecayFactor ?? 0.8,
            maxTradeQuantity: e?.maxTradeQuantity ?? 100,
            schedule: e?.schedule ?? DEFAULT_SCHEDULE,
            nextUpdateAt: e?.nextUpdateAt?.toISOString() ?? null
        };
    }

    async updateConfig(partial: Partial<Omit<MarketConfigDto, "nextUpdateAt">>): Promise<MarketConfigDto> {
        const entity = await this.getOrCreateConfigEntity();
        if (partial.eventChancePercent !== undefined) entity.eventChancePercent = partial.eventChancePercent;
        if (partial.demandDecayFactor !== undefined) entity.demandDecayFactor = partial.demandDecayFactor;
        if (partial.maxTradeQuantity !== undefined) entity.maxTradeQuantity = partial.maxTradeQuantity;
        if (partial.schedule !== undefined) entity.schedule = partial.schedule as MarketSchedule;
        this.configEntity = await this.configRepo.save(entity);
        await this.scheduleNextUpdate();
        return this.getConfig();
    }

    getNextUpdateAt(): { nextUpdateAt: string | null; scheduleType: string } {
        return {
            nextUpdateAt: this.configEntity?.nextUpdateAt?.toISOString() ?? null,
            scheduleType: this.configEntity?.schedule?.type ?? "disabled"
        };
    }

    // ─── Price Calculation Engine ───────────────────────────────────────────

    /**
     * Recalculate all prices based on supply/demand since last update.
     * Inspired by RyanTT's DynMarket fn_calculatePrices:
     * - When an item is sold, its price DECREASES (supply up)
     * - When an item is bought, its price INCREASES (demand up)
     * - Other items in the same group get inverse pressure
     */
    async recalculatePrices(): Promise<void> {
        const resources = await this.resourceRepo.find();
        const groups = new Map<string, MarketResourceEntity[]>();

        // Group resources
        for (const r of resources) {
            const list = groups.get(r.groupKey) ?? [];
            list.push(r);
            groups.set(r.groupKey, list);
        }

        // Snapshot previous prices
        const prevPricesForLog = new Map<string, number>(resources.map((r) => [r.slug, r.currentPrice]));
        for (const r of resources) {
            this.previousPrices.set(r.slug, r.currentPrice);
        }

        for (const [, groupResources] of groups) {
            for (const resource of groupResources) {
                const netDemand = resource.unitsBought - resource.unitsSold;

                if (netDemand === 0) continue;

                // Direct price effect on this resource
                const priceChange = Math.round(netDemand * (resource.currentPrice / 2000) * resource.volatility);
                resource.currentPrice = this.clampPrice(resource, resource.currentPrice + priceChange);

                // Inverse effect on other group members
                for (const other of groupResources) {
                    if (other.id === resource.id) continue;
                    const inverseChange = Math.round(-netDemand * (other.currentPrice / 4000) * other.volatility);
                    other.currentPrice = this.clampPrice(other, other.currentPrice + inverseChange);
                }
            }
        }

        // Apply demand decay and record price history snapshot
        for (const r of resources) {
            r.unitsSold = Math.round(r.unitsSold * (this.configEntity?.demandDecayFactor ?? 0.8));
            r.unitsBought = Math.round(r.unitsBought * (this.configEntity?.demandDecayFactor ?? 0.8));
            // Reset tiny values
            if (Math.abs(r.unitsSold) < 1) r.unitsSold = 0;
            if (Math.abs(r.unitsBought) < 1) r.unitsBought = 0;
            // Push current price to history (keep max 20 snapshots)
            const history = Array.isArray(r.priceHistory) ? [...r.priceHistory] : [];
            history.push(r.currentPrice);
            if (history.length > 20) history.shift();
            r.priceHistory = history;
        }

        await this.resourceRepo.save(resources);

        const topChanges = resources
            .map((r) => {
                const old = prevPricesForLog.get(r.slug) ?? r.currentPrice;
                if (old === r.currentPrice) return null;
                const cp = old > 0 ? ((r.currentPrice - old) / old) * 100 : 0;
                return {
                    name: r.name,
                    icon: r.icon,
                    oldPrice: old,
                    newPrice: r.currentPrice,
                    changePercent: Math.round(cp * 10) / 10
                };
            })
            .filter((c): c is MarketPriceChangeDto => c !== null && Math.abs(c.changePercent) >= 0.5)
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
            .slice(0, 5);
        const changedCount = resources.filter((r) => prevPricesForLog.get(r.slug) !== r.currentPrice).length;
        if (changedCount > 0) {
            pushActivity({
                type: "price_update",
                changedCount,
                topChanges,
                timestamp: new Date().toISOString()
            });
        }

        this.logger.log("Market prices recalculated.");
    }

    // ─── Random Events ──────────────────────────────────────────────────────

    private async executeRandomEvent(): Promise<MarketEventLogDto | null> {
        // Roll chance
        const roll = Math.random() * 100;
        const eventChance = this.configEntity?.eventChancePercent ?? 20;
        if (roll > eventChance) {
            this.logger.debug(`Event roll ${roll.toFixed(1)} > ${eventChance}% – no event.`);
            return null;
        }

        const events = await this.eventRepo.find({ where: { isActive: true } });
        if (!events.length) return null;

        // Weighted random selection
        const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
        let pick = Math.random() * totalWeight;
        let selected: MarketEventEntity | null = null;
        for (const e of events) {
            pick -= e.weight;
            if (pick <= 0) {
                selected = e;
                break;
            }
        }
        if (!selected) selected = events[events.length - 1];

        // Apply event
        const priceChanges: Record<string, { before: number; after: number }> = {};

        for (const slug of selected.affectedSlugs) {
            const resource = await this.resourceRepo.findOneBy({ slug });
            if (!resource) continue;

            const before = resource.currentPrice;
            let newPrice = before;

            switch (selected.modifierType) {
                case "set_max":
                    newPrice = resource.maxPrice;
                    break;
                case "set_min":
                    newPrice = resource.minPrice;
                    break;
                case "multiply":
                    newPrice = Math.round(before * selected.modifierValue);
                    break;
                case "add":
                    newPrice = before + Math.round(selected.modifierValue);
                    break;
                case "set":
                    newPrice = Math.round(selected.modifierValue);
                    break;
            }

            resource.currentPrice = this.clampPrice(resource, newPrice);
            priceChanges[slug] = { before, after: resource.currentPrice };
            await this.resourceRepo.save(resource);
        }

        // Log the event
        const log = this.eventLogRepo.create({
            eventId: selected.id,
            title: selected.title,
            description: selected.description,
            priceChanges
        });
        const savedLog = await this.eventLogRepo.save(log);

        pushActivity({
            type: "event",
            eventTitle: selected.title,
            eventDescription: selected.description,
            affectedCount: Object.keys(priceChanges).length,
            timestamp: new Date().toISOString()
        });

        this.logger.log(`Market event triggered: "${selected.title}"`);
        return this.toEventLogDto(savedLog);
    }

    // ─── Admin: Stats ────────────────────────────────────────────────────────

    async getMarketStats(): Promise<MarketStatsDto> {
        const resources = await this.resourceRepo.find({ order: { groupKey: "ASC", sortOrder: "ASC" } });

        // Aggregate buy/sell totals per resource from transaction history
        const txAgg = await this.txRepo
            .createQueryBuilder("tx")
            .select("tx.resource_slug", "slug")
            .addSelect("tx.action", "action")
            .addSelect("SUM(tx.quantity)", "totalQty")
            .addSelect("SUM(tx.total_price)", "totalVolume")
            .where("tx.user_id != :adminId", { adminId: ADMIN_ORG_USER_ID })
            .groupBy("tx.resource_slug")
            .addGroupBy("tx.action")
            .getRawMany<{ slug: string; action: string; totalQty: string; totalVolume: string }>();

        const buyMap = new Map<string, { qty: number; vol: number }>();
        const sellMap = new Map<string, { qty: number; vol: number }>();
        for (const row of txAgg) {
            const map = row.action === "buy" ? buyMap : sellMap;
            map.set(row.slug, { qty: Number(row.totalQty), vol: Number(row.totalVolume) });
        }

        const totalBuyVolume = [...buyMap.values()].reduce((s, v) => s + v.vol, 0);
        const totalSellVolume = [...sellMap.values()].reduce((s, v) => s + v.vol, 0);
        const totalTransactions = await this.txRepo
            .createQueryBuilder("tx")
            .where("tx.user_id != :adminId", { adminId: ADMIN_ORG_USER_ID })
            .getCount();
        const uniqueTradersResult = await this.txRepo
            .createQueryBuilder("tx")
            .select("COUNT(DISTINCT tx.user_id)", "count")
            .where("tx.user_id != :adminId", { adminId: ADMIN_ORG_USER_ID })
            .getRawOne<{ count: string }>();
        const uniqueTraders = Number(uniqueTradersResult?.count ?? 0);

        const resourceStats: ResourceStatDto[] = resources.map((r) => {
            const b = buyMap.get(r.slug) ?? { qty: 0, vol: 0 };
            const s = sellMap.get(r.slug) ?? { qty: 0, vol: 0 };
            const changePercent = r.basePrice > 0 ? ((r.currentPrice - r.basePrice) / r.basePrice) * 100 : 0;
            return {
                resourceId: r.id,
                slug: r.slug,
                name: r.name,
                icon: r.icon,
                groupKey: r.groupKey,
                currentPrice: r.currentPrice,
                basePrice: r.basePrice,
                changePercent: Math.round(changePercent * 100) / 100,
                allTimeBuys: b.qty,
                allTimeSells: s.qty,
                buyVolume: b.vol,
                sellVolume: s.vol,
                maxStock: r.maxStock,
                currentStock: r.currentStock,
                priceHistory: r.priceHistory ?? []
            };
        });

        return { totalTransactions, totalBuyVolume, totalSellVolume, uniqueTraders, resources: resourceStats };
    }

    // ─── Admin: Intervention ────────────────────────────────────────────────────

    async adminBuy(slug: string, quantity: number): Promise<AdminOrgInventoryDto[]> {
        const resource = await this.resourceRepo.findOneBy({ slug, isActive: true });
        if (!resource) throw new BadRequestException("Resource not found or inactive.");

        // Stock check
        if (resource.maxStock !== null) {
            const stock = resource.currentStock ?? 0;
            if (stock < quantity) throw new BadRequestException(`Only ${stock} units in market stock.`);
            resource.currentStock = Math.max(0, stock - quantity);
        }

        resource.unitsBought += quantity;
        resource.totalUnitsBought = Number(resource.totalUnitsBought) + quantity;
        await this.resourceRepo.save(resource);

        const inv = await this.findOrCreateInventory(ADMIN_ORG_USER_ID, resource.id);
        inv.quantity += quantity;
        await this.inventoryRepo.save(inv);

        await this.txRepo.save(
            this.txRepo.create({
                userId: ADMIN_ORG_USER_ID,
                resourceId: resource.id,
                resourceSlug: resource.slug,
                action: "buy",
                quantity,
                pricePerUnit: resource.currentPrice,
                totalPrice: 0
            })
        );

        return this.getAdminInventory();
    }

    async adminSell(slug: string, quantity: number): Promise<AdminOrgInventoryDto[]> {
        const resource = await this.resourceRepo.findOneBy({ slug, isActive: true });
        if (!resource) throw new BadRequestException("Resource not found or inactive.");

        const inv = await this.inventoryRepo.findOneBy({ userId: ADMIN_ORG_USER_ID, resourceId: resource.id });
        if (!inv || inv.quantity < quantity) throw new BadRequestException("Insufficient admin inventory.");

        inv.quantity -= quantity;
        await this.inventoryRepo.save(inv);

        if (resource.maxStock !== null) {
            resource.currentStock = Math.min(resource.maxStock, (resource.currentStock ?? 0) + quantity);
        }
        resource.unitsSold += quantity;
        resource.totalUnitsSold = Number(resource.totalUnitsSold) + quantity;
        await this.resourceRepo.save(resource);

        await this.txRepo.save(
            this.txRepo.create({
                userId: ADMIN_ORG_USER_ID,
                resourceId: resource.id,
                resourceSlug: resource.slug,
                action: "sell",
                quantity,
                pricePerUnit: resource.currentPrice,
                totalPrice: 0
            })
        );

        return this.getAdminInventory();
    }

    async getAdminInventory(): Promise<AdminOrgInventoryDto[]> {
        const items = await this.inventoryRepo.find({ where: { userId: ADMIN_ORG_USER_ID } });
        if (!items.length) return [];

        const resourceIds = items.map((i) => i.resourceId);
        const resources = await this.resourceRepo.findByIds(resourceIds);
        const resourceMap = new Map(resources.map((r) => [r.id, r]));

        return items
            .filter((i) => i.quantity > 0)
            .map((i) => {
                const r = resourceMap.get(i.resourceId);
                return {
                    resourceId: i.resourceId,
                    resourceSlug: r?.slug ?? "unknown",
                    resourceName: r?.name ?? "Unknown",
                    resourceIcon: r?.icon ?? "pi pi-box",
                    quantity: i.quantity,
                    currentPrice: r?.currentPrice ?? 0
                };
            });
    }

    // ─── Timer ──────────────────────────────────────────────────────────────

    private async scheduleNextUpdate(): Promise<void> {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
        const entity = await this.getOrCreateConfigEntity();
        const schedule = entity.schedule ?? DEFAULT_SCHEDULE;
        const next = computeNextUpdate(schedule);
        entity.nextUpdateAt = next;
        this.configEntity = await this.configRepo.save(entity);
        if (!next) return;
        const delay = Math.max(1000, next.getTime() - Date.now());
        this.updateTimer = setTimeout(() => {
            void this.runPriceUpdateCycle();
        }, delay);
    }

    private async runPriceUpdateCycle(): Promise<void> {
        try {
            await this.recalculatePrices();
            await this.executeRandomEvent();
            this.logger.log("Market price update cycle completed.");
        } catch (err) {
            this.logger.error(`Price update cycle failed: ${String(err)}`);
        } finally {
            await this.scheduleNextUpdate();
        }
    }

    // ─── Activity log ────────────────────────────────────────────────────────

    getRecentActivities(limit = 50): MarketActivityDto[] {
        return activityLog.slice(0, Math.min(limit, ACTIVITY_MAX));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private async getOrCreateConfigEntity(): Promise<MarketConfigEntity> {
        let entity = await this.configRepo.findOneBy({ id: 1 });
        if (!entity) {
            entity = this.configRepo.create({
                id: 1,
                eventChancePercent: 20,
                demandDecayFactor: 0.8,
                maxTradeQuantity: 100,
                schedule: { ...DEFAULT_SCHEDULE },
                nextUpdateAt: null
            });
            entity = await this.configRepo.save(entity);
        }
        if (!entity.schedule) {
            entity.schedule = { ...DEFAULT_SCHEDULE };
            entity = await this.configRepo.save(entity);
        }
        this.configEntity = entity;
        return entity;
    }

    /** Seed any resources or events from DEFAULT_RESOURCES/DEFAULT_EVENTS that don't yet exist in the DB. */
    private async seedMissingDefaults(): Promise<void> {
        const existingSlugs = new Set((await this.resourceRepo.find({ select: ["slug"] })).map((r) => r.slug));
        const existingTitles = new Set((await this.eventRepo.find({ select: ["title"] })).map((e) => e.title));

        let newResources = 0;
        for (const dto of DEFAULT_RESOURCES) {
            if (existingSlugs.has(dto.slug)) continue;
            const history: number[] = [];
            for (let i = 0; i < 12; i++) {
                const jitter = 1 + (Math.random() - 0.5) * 0.2;
                history.push(Math.max(dto.minPrice, Math.min(dto.maxPrice, Math.round(dto.basePrice * jitter))));
            }
            history.push(dto.basePrice);
            await this.resourceRepo.save(
                this.resourceRepo.create({
                    slug: dto.slug,
                    name: dto.name,
                    description: dto.description ?? null,
                    icon: dto.icon ?? "pi pi-box",
                    groupKey: dto.groupKey,
                    basePrice: dto.basePrice,
                    minPrice: dto.minPrice,
                    maxPrice: dto.maxPrice,
                    currentPrice: dto.basePrice,
                    volatility: dto.volatility ?? 1.0,
                    canBuy: dto.canBuy ?? true,
                    canSell: dto.canSell ?? true,
                    sortOrder: dto.sortOrder ?? 0,
                    tier: dto.tier ?? 0,
                    craftedFrom: dto.craftedFrom ?? null,
                    craftCost: dto.craftCost ?? 1,
                    priceHistory: history
                })
            );
            newResources++;
        }

        let newEvents = 0;
        for (const dto of DEFAULT_EVENTS) {
            if (existingTitles.has(dto.title)) continue;
            await this.eventRepo.save(
                this.eventRepo.create({
                    title: dto.title,
                    description: dto.description,
                    affectedSlugs: dto.affectedSlugs,
                    modifierType: dto.modifierType,
                    modifierValue: dto.modifierValue ?? 0,
                    weight: dto.weight ?? 10
                })
            );
            newEvents++;
        }

        if (newResources > 0 || newEvents > 0) {
            this.logger.log(`Seeded ${newResources} new resources and ${newEvents} new events.`);
        }
    }

    private async findOrCreateInventory(userId: string, resourceId: string): Promise<UserInventoryEntity> {
        // INSERT ... ON CONFLICT DO NOTHING avoids a race condition where two concurrent
        // requests both find no record and both attempt the same INSERT, which would
        // violate the unique constraint on (user_id, resource_id).
        await this.inventoryRepo
            .createQueryBuilder()
            .insert()
            .into(UserInventoryEntity)
            .values({ userId, resourceId, quantity: 0 })
            .orIgnore()
            .execute();
        return this.inventoryRepo.findOneByOrFail({ userId, resourceId });
    }

    private clampPrice(resource: MarketResourceEntity, price: number): number {
        return Math.max(resource.minPrice, Math.min(resource.maxPrice, Math.round(price)));
    }

    private validateQuantity(quantity: number): void {
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new BadRequestException("Quantity must be a positive integer.");
        }
        if (quantity > (this.configEntity?.maxTradeQuantity ?? 100)) {
            throw new BadRequestException(`Maximum trade quantity is ${this.configEntity?.maxTradeQuantity ?? 100}.`);
        }
    }

    private toResourceDto(r: MarketResourceEntity): MarketResourceDto {
        const prev = this.previousPrices.get(r.slug) ?? r.basePrice;
        const changePercent = r.basePrice > 0 ? ((r.currentPrice - r.basePrice) / r.basePrice) * 100 : 0;
        return {
            id: r.id,
            slug: r.slug,
            name: r.name,
            description: r.description,
            icon: r.icon,
            imageUrl: r.imageUrl,
            groupKey: r.groupKey,
            basePrice: r.basePrice,
            minPrice: r.minPrice,
            maxPrice: r.maxPrice,
            currentPrice: r.currentPrice,
            volatility: r.volatility,
            canBuy: r.canBuy,
            canSell: r.canSell,
            isActive: r.isActive,
            sortOrder: r.sortOrder,
            tier: r.tier,
            craftedFrom: r.craftedFrom,
            craftCost: r.craftCost,
            trend: r.currentPrice - prev,
            priceHistory: r.priceHistory ?? [],
            changePercent: Math.round(changePercent * 100) / 100,
            maxStock: r.maxStock,
            currentStock: r.currentStock,
            totalUnitsBought: Number(r.totalUnitsBought),
            totalUnitsSold: Number(r.totalUnitsSold)
        };
    }

    private toEventDto(e: MarketEventEntity): MarketEventDto {
        return {
            id: e.id,
            title: e.title,
            description: e.description,
            affectedSlugs: e.affectedSlugs,
            modifierType: e.modifierType,
            modifierValue: e.modifierValue,
            weight: e.weight,
            isActive: e.isActive
        };
    }

    private toEventLogDto(l: MarketEventLogEntity): MarketEventLogDto {
        return {
            id: l.id,
            eventId: l.eventId,
            title: l.title,
            description: l.description,
            priceChanges: l.priceChanges,
            createdAt: l.createdAt.toISOString()
        };
    }
}
