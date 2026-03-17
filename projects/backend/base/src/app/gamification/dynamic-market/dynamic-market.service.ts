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

// ─── Default resources (anime/manga themed) ─────────────────────────────────

const DEFAULT_RESOURCES: CreateMarketResourceDto[] = [
    // ── Otaku-Waren ──────────────────────────────────────────────────────────
    {
        slug: "manga_volume",
        name: "Manga Band",
        groupKey: "otaku",
        basePrice: 120,
        minPrice: 60,
        maxPrice: 300,
        icon: "pi pi-book",
        sortOrder: 1
    },
    {
        slug: "rare_figure",
        name: "Seltene Figur",
        groupKey: "otaku",
        basePrice: 850,
        minPrice: 400,
        maxPrice: 2000,
        icon: "pi pi-star",
        volatility: 1.5,
        sortOrder: 2
    },
    {
        slug: "anime_bluray",
        name: "Anime Blu-ray",
        groupKey: "otaku",
        basePrice: 250,
        minPrice: 100,
        maxPrice: 600,
        icon: "pi pi-play",
        sortOrder: 3
    },
    {
        slug: "cosplay_material",
        name: "Cosplay Material",
        groupKey: "otaku",
        basePrice: 180,
        minPrice: 80,
        maxPrice: 450,
        icon: "pi pi-palette",
        sortOrder: 4
    },
    {
        slug: "doujinshi",
        name: "Doujinshi",
        groupKey: "otaku",
        basePrice: 80,
        minPrice: 30,
        maxPrice: 220,
        icon: "pi pi-book",
        sortOrder: 5
    },
    {
        slug: "nendoroid",
        name: "Nendoroid Figur",
        groupKey: "otaku",
        basePrice: 420,
        minPrice: 180,
        maxPrice: 950,
        icon: "pi pi-star-fill",
        volatility: 1.3,
        sortOrder: 6
    },
    {
        slug: "trading_card",
        name: "Sammelkarte",
        groupKey: "otaku",
        basePrice: 200,
        minPrice: 40,
        maxPrice: 1200,
        icon: "pi pi-id-card",
        volatility: 1.8,
        sortOrder: 7
    },
    {
        slug: "artbook",
        name: "Artbook",
        groupKey: "otaku",
        basePrice: 160,
        minPrice: 70,
        maxPrice: 380,
        icon: "pi pi-image",
        sortOrder: 8
    },
    {
        slug: "dakimakura",
        name: "Dakimakura",
        groupKey: "otaku",
        basePrice: 300,
        minPrice: 120,
        maxPrice: 700,
        icon: "pi pi-heart-fill",
        volatility: 1.2,
        sortOrder: 9
    },

    // ── Japanische Natur ─────────────────────────────────────────────────────
    {
        slug: "sakura_petals",
        name: "Sakura-Blüten",
        groupKey: "nature",
        basePrice: 50,
        minPrice: 20,
        maxPrice: 150,
        icon: "pi pi-sun",
        sortOrder: 1
    },
    {
        slug: "matcha_powder",
        name: "Matcha-Pulver",
        groupKey: "nature",
        basePrice: 90,
        minPrice: 40,
        maxPrice: 220,
        icon: "pi pi-leaf",
        sortOrder: 2
    },
    {
        slug: "bamboo",
        name: "Bambus",
        groupKey: "nature",
        basePrice: 35,
        minPrice: 15,
        maxPrice: 100,
        icon: "pi pi-bars",
        sortOrder: 3
    },
    {
        slug: "koi_fish",
        name: "Koi-Fisch",
        groupKey: "nature",
        basePrice: 300,
        minPrice: 120,
        maxPrice: 750,
        icon: "pi pi-heart",
        volatility: 1.3,
        sortOrder: 4
    },
    {
        slug: "bonsai_tree",
        name: "Bonsai-Baum",
        groupKey: "nature",
        basePrice: 450,
        minPrice: 180,
        maxPrice: 1200,
        icon: "pi pi-sitemap",
        volatility: 1.1,
        sortOrder: 5
    },
    {
        slug: "washi_paper",
        name: "Washi-Papier",
        groupKey: "nature",
        basePrice: 70,
        minPrice: 28,
        maxPrice: 180,
        icon: "pi pi-file",
        sortOrder: 6
    },
    {
        slug: "kokedama",
        name: "Kokedama",
        groupKey: "nature",
        basePrice: 130,
        minPrice: 50,
        maxPrice: 320,
        icon: "pi pi-circle",
        sortOrder: 7
    },
    {
        slug: "sencha_tea",
        name: "Sencha-Tee",
        groupKey: "nature",
        basePrice: 75,
        minPrice: 30,
        maxPrice: 190,
        icon: "pi pi-coffee",
        sortOrder: 8
    },
    {
        slug: "lotus_blossom",
        name: "Lotusblüte",
        groupKey: "nature",
        basePrice: 110,
        minPrice: 45,
        maxPrice: 280,
        icon: "pi pi-sun",
        volatility: 1.2,
        sortOrder: 9
    },

    // ── Edelsteine & Metalle ─────────────────────────────────────────────────
    {
        slug: "jade_stone",
        name: "Jadenstein",
        groupKey: "minerals",
        basePrice: 400,
        minPrice: 200,
        maxPrice: 1000,
        icon: "pi pi-circle",
        sortOrder: 1
    },
    {
        slug: "tamahagane",
        name: "Tamahagane-Stahl",
        groupKey: "minerals",
        basePrice: 600,
        minPrice: 300,
        maxPrice: 1500,
        icon: "pi pi-bolt",
        volatility: 1.2,
        sortOrder: 2
    },
    {
        slug: "crystal_shard",
        name: "Kristallsplitter",
        groupKey: "minerals",
        basePrice: 200,
        minPrice: 80,
        maxPrice: 500,
        icon: "pi pi-sparkles",
        sortOrder: 3
    },
    {
        slug: "obsidian",
        name: "Obsidian",
        groupKey: "minerals",
        basePrice: 180,
        minPrice: 70,
        maxPrice: 460,
        icon: "pi pi-stop-circle",
        sortOrder: 4
    },
    {
        slug: "pearl",
        name: "Perle",
        groupKey: "minerals",
        basePrice: 350,
        minPrice: 140,
        maxPrice: 920,
        icon: "pi pi-circle-fill",
        volatility: 1.3,
        sortOrder: 5
    },
    {
        slug: "orichalcum",
        name: "Oreichalkon",
        groupKey: "minerals",
        basePrice: 1100,
        minPrice: 450,
        maxPrice: 3000,
        icon: "pi pi-server",
        volatility: 1.8,
        sortOrder: 6
    },
    {
        slug: "mithril_dust",
        name: "Mithrilstaub",
        groupKey: "minerals",
        basePrice: 780,
        minPrice: 320,
        maxPrice: 2000,
        icon: "pi pi-sparkles",
        volatility: 1.5,
        sortOrder: 7
    },

    // ── Speisen & Getränke ───────────────────────────────────────────────────
    {
        slug: "onigiri",
        name: "Onigiri",
        groupKey: "food",
        basePrice: 25,
        minPrice: 10,
        maxPrice: 70,
        icon: "pi pi-apple",
        sortOrder: 1
    },
    {
        slug: "ramen_bowl",
        name: "Ramen-Schüssel",
        groupKey: "food",
        basePrice: 60,
        minPrice: 25,
        maxPrice: 150,
        icon: "pi pi-shopping-bag",
        sortOrder: 2
    },
    {
        slug: "mochi",
        name: "Mochi",
        groupKey: "food",
        basePrice: 40,
        minPrice: 15,
        maxPrice: 100,
        icon: "pi pi-circle-fill",
        sortOrder: 3
    },
    {
        slug: "sake_bottle",
        name: "Sake-Flasche",
        groupKey: "food",
        basePrice: 150,
        minPrice: 60,
        maxPrice: 400,
        icon: "pi pi-gift",
        volatility: 1.1,
        sortOrder: 4
    },
    {
        slug: "takoyaki",
        name: "Takoyaki",
        groupKey: "food",
        basePrice: 35,
        minPrice: 14,
        maxPrice: 90,
        icon: "pi pi-circle",
        sortOrder: 5
    },
    {
        slug: "wagashi",
        name: "Wagashi",
        groupKey: "food",
        basePrice: 55,
        minPrice: 20,
        maxPrice: 140,
        icon: "pi pi-heart",
        sortOrder: 6
    },
    {
        slug: "yakitori",
        name: "Yakitori",
        groupKey: "food",
        basePrice: 45,
        minPrice: 18,
        maxPrice: 115,
        icon: "pi pi-bolt",
        sortOrder: 7
    },
    {
        slug: "taiyaki",
        name: "Taiyaki",
        groupKey: "food",
        basePrice: 30,
        minPrice: 12,
        maxPrice: 75,
        icon: "pi pi-star",
        sortOrder: 8
    },
    {
        slug: "umeshu",
        name: "Umeshu (Pflaumenwein)",
        groupKey: "food",
        basePrice: 110,
        minPrice: 45,
        maxPrice: 280,
        icon: "pi pi-bottle",
        volatility: 1.2,
        sortOrder: 9
    },

    // ── Seltene Güter ────────────────────────────────────────────────────────
    {
        slug: "dragon_scale",
        name: "Drachenschuppe",
        groupKey: "rare",
        basePrice: 1500,
        minPrice: 700,
        maxPrice: 4000,
        icon: "pi pi-shield",
        volatility: 2.0,
        sortOrder: 1,
        canSell: true
    },
    {
        slug: "spirit_essence",
        name: "Geisteressenz",
        groupKey: "rare",
        basePrice: 2000,
        minPrice: 900,
        maxPrice: 5000,
        icon: "pi pi-eye",
        volatility: 2.0,
        sortOrder: 2
    },
    {
        slug: "ancient_scroll",
        name: "Alte Schriftrolle",
        groupKey: "rare",
        basePrice: 1200,
        minPrice: 500,
        maxPrice: 3000,
        icon: "pi pi-file",
        volatility: 1.8,
        sortOrder: 3
    },
    {
        slug: "phoenix_feather",
        name: "Phönixfeder",
        groupKey: "rare",
        basePrice: 3000,
        minPrice: 1100,
        maxPrice: 8000,
        icon: "pi pi-send",
        volatility: 2.5,
        sortOrder: 4
    },
    {
        slug: "oni_horn",
        name: "Oni-Horn",
        groupKey: "rare",
        basePrice: 2400,
        minPrice: 900,
        maxPrice: 6000,
        icon: "pi pi-wrench",
        volatility: 2.2,
        sortOrder: 5
    },
    {
        slug: "moonstone",
        name: "Mondstein",
        groupKey: "rare",
        basePrice: 1800,
        minPrice: 650,
        maxPrice: 4800,
        icon: "pi pi-moon",
        volatility: 1.9,
        sortOrder: 6
    },
    {
        slug: "cursed_katana",
        name: "Verfluchtes Katana",
        groupKey: "rare",
        basePrice: 2800,
        minPrice: 1000,
        maxPrice: 7000,
        icon: "pi pi-minus",
        volatility: 2.3,
        sortOrder: 7
    }
];

const DEFAULT_EVENTS: CreateMarketEventDto[] = [
    // ── Otaku-Events ─────────────────────────────────────────────────────────
    {
        title: "Anime-Convention!",
        description: "Eine große Anime-Convention steigt! Otaku-Waren sind extrem gefragt!",
        affectedSlugs: ["manga_volume", "rare_figure", "anime_bluray", "cosplay_material"],
        modifierType: "set_max",
        weight: 8
    },
    {
        title: "Manga-Überschwemmung",
        description: "Ein Großverlag veröffentlicht reihenweise günstige Nachdrucke. Manga-Preise fallen!",
        affectedSlugs: ["manga_volume", "doujinshi", "artbook"],
        modifierType: "multiply",
        modifierValue: 0.65,
        weight: 9
    },
    {
        title: "Sammelkarten-Hype",
        description: "Ein virales Video macht Sammelkarten zum Kult – die Preise schießen durch die Decke!",
        affectedSlugs: ["trading_card"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Nendoroid-Kollaboration",
        description: "Eine exklusive Kollaboration mit einem Top-Franchise lässt Nendoroids und Figuren ausverkaufen!",
        affectedSlugs: ["nendoroid", "rare_figure"],
        modifierType: "set_max",
        weight: 7
    },
    {
        title: "Cosplay-Wettbewerb",
        description: "Ein großer Cosplay-Wettbewerb sorgt für riesige Nachfrage nach Materialien!",
        affectedSlugs: ["cosplay_material", "rare_figure"],
        modifierType: "multiply",
        modifierValue: 1.4,
        weight: 9
    },
    {
        title: "Dakimakura-Lager-Räumung",
        description: "Großes Lager wird geräumt – Dakimakuras zu Schleuderpreisen!",
        affectedSlugs: ["dakimakura"],
        modifierType: "set_min",
        weight: 7
    },
    {
        title: "Spielzeugmesse",
        description: "Die jährliche Spielzeugmesse zieht Sammler an – Figuren und Karten explodieren!",
        affectedSlugs: ["rare_figure", "nendoroid", "trading_card"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 8
    },

    // ── Natur-Events ─────────────────────────────────────────────────────────
    {
        title: "Kirschblüten-Saison",
        description: "Die Sakura-Saison hat begonnen – Blüten sind überall verfügbar!",
        affectedSlugs: ["sakura_petals", "lotus_blossom"],
        modifierType: "set_min",
        weight: 10
    },
    {
        title: "Bambus-Dürre",
        description: "Eine ungewöhnliche Dürre dezimiert die Bambuswälder. Preise steigen stark!",
        affectedSlugs: ["bamboo", "kokedama"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Matcha-Rekordernte",
        description: "Die diesjährige Matcha- und Sencha-Ernte übertrifft alle Erwartungen!",
        affectedSlugs: ["matcha_powder", "sencha_tea"],
        modifierType: "multiply",
        modifierValue: 0.65,
        weight: 8
    },
    {
        title: "Karpfenrennen",
        description: "Das spektakuläre Koi-Rennen lässt Züchter die Preise hochjagen!",
        affectedSlugs: ["koi_fish"],
        modifierType: "set_max",
        weight: 7
    },
    {
        title: "Bonsai-Ausstellung",
        description: "Die nationale Bonsai-Schau lockt Sammler – Preise steigen dramatisch!",
        affectedSlugs: ["bonsai_tree"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 6
    },
    {
        title: "Washi-Kunstmarkt",
        description: "Traditionelle Künstler reißen Washi-Papier vom Markt!",
        affectedSlugs: ["washi_paper", "artbook"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 8
    },
    {
        title: "Lotusblüte-Saison",
        description: "Lotusblüten blühen in Hülle und Fülle – ein Überangebot drückt den Preis!",
        affectedSlugs: ["lotus_blossom", "sakura_petals"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 8
    },

    // ── Mineral-Events ────────────────────────────────────────────────────────
    {
        title: "Schwertschmiede-Meister",
        description: "Ein berühmter Schmied besucht die Stadt. Tamahagane wird knapp!",
        affectedSlugs: ["tamahagane", "orichalcum"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
    },
    {
        title: "Kristall-Mine entdeckt",
        description: "Eine neue Kristallmine wurde entdeckt – Kristalle und Obsidian im Überfluss!",
        affectedSlugs: ["crystal_shard", "jade_stone", "obsidian"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 6
    },
    {
        title: "Perlenfischer-Saison",
        description: "Die Perlenfischer-Flotte kehrt mit rekordverdächtiger Ausbeute zurück!",
        affectedSlugs: ["pearl"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 7
    },
    {
        title: "Edelstein-Diebstahl",
        description: "Ein Dieb hat das Jadestein-Lager ausgeraubt – Preise schnellen hoch!",
        affectedSlugs: ["jade_stone", "crystal_shard", "pearl"],
        modifierType: "multiply",
        modifierValue: 1.8,
        weight: 5
    },
    {
        title: "Waffenschmied-Turnier",
        description: "Das große Schmiedeturnier lässt alle Metallpreise steigen!",
        affectedSlugs: ["tamahagane", "obsidian", "mithril_dust"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 7
    },
    {
        title: "Mithril-Fund",
        description: "In den Bergen wird eine Mithrilader entdeckt – Preise stürzen ab!",
        affectedSlugs: ["mithril_dust", "orichalcum"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 5
    },

    // ── Food-Events ──────────────────────────────────────────────────────────
    {
        title: "Ramen-Festival",
        description: "Ein Ramen-Festival findet statt – Ramen-Preise explodieren!",
        affectedSlugs: ["ramen_bowl", "onigiri"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 12
    },
    {
        title: "Sake-Fest",
        description: "Die jährliche Sake-Verkostung treibt die Preise in die Höhe!",
        affectedSlugs: ["sake_bottle", "umeshu"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 8
    },
    {
        title: "Sake-Knappheit",
        description: "Eine schlechte Reisernte macht Sake zur Rarität!",
        affectedSlugs: ["sake_bottle"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Takoyaki-Stand-Boom",
        description: "Takoyaki-Stände eröffnen überall – riesige Nachfrage!",
        affectedSlugs: ["takoyaki", "onigiri", "taiyaki"],
        modifierType: "multiply",
        modifierValue: 1.4,
        weight: 10
    },
    {
        title: "Herbstfest",
        description: "Das Herbstfest zieht Massen an – Wagashi und Sake sind Renner!",
        affectedSlugs: ["wagashi", "sake_bottle", "mochi"],
        modifierType: "multiply",
        modifierValue: 1.45,
        weight: 9
    },
    {
        title: "Lebensmittelkrise",
        description: "Lieferengpässe sorgen für Hamsterkäufe – Basisnahrung ist knapp!",
        affectedSlugs: ["ramen_bowl", "onigiri", "mochi", "taiyaki"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 5
    },
    {
        title: "Küstenmarkt",
        description: "Der Küstenmarkt bietet frische Meeresfrüchte – Takoyaki und Yakitori in Fülle!",
        affectedSlugs: ["takoyaki", "yakitori"],
        modifierType: "multiply",
        modifierValue: 0.65,
        weight: 8
    },
    {
        title: "Umeshu-Ernte",
        description: "Außergewöhnlich gute Pflaumen-Ernte – Umeshu wird günstig!",
        affectedSlugs: ["umeshu"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 7
    },

    // ── Rare-Events ──────────────────────────────────────────────────────────
    {
        title: "Drachenfest",
        description: "Beim jährlichen Drachenfest sind Drachenschuppen hochbegehrt!",
        affectedSlugs: ["dragon_scale"],
        modifierType: "multiply",
        modifierValue: 1.8,
        weight: 5
    },
    {
        title: "Geister-Erscheinung",
        description: "Mysteriöse Geister wurden gesichtet. Geisteressenzen fluten den Markt!",
        affectedSlugs: ["spirit_essence"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 6
    },
    {
        title: "Große Schriftgelehrte",
        description: "Reisende Gelehrte suchen überall nach seltenen Schriftrollen und Artbooks!",
        affectedSlugs: ["ancient_scroll", "artbook"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
    },
    {
        title: "Phönix-Erscheinung",
        description: "Ein Phönix wurde über der Stadt gesichtet – seine Federn sind unschätzbar!",
        affectedSlugs: ["phoenix_feather"],
        modifierType: "set_max",
        weight: 3
    },
    {
        title: "Phönix-Feuer-Regen",
        description: "Phönixfedern regnen auf die Stadt – ein Überangebot drückt die Preise!",
        affectedSlugs: ["phoenix_feather"],
        modifierType: "multiply",
        modifierValue: 0.4,
        weight: 4
    },
    {
        title: "Oni-Invasion",
        description: "Oni überfallen das Tal – ihre Hörner werden von Jägern gesammelt!",
        affectedSlugs: ["oni_horn"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 5
    },
    {
        title: "Mondnacht-Ritual",
        description: "Ein mystisches Mondnacht-Ritual lässt Mondsteine und Geisteressenzen begehrt werden!",
        affectedSlugs: ["moonstone", "spirit_essence"],
        modifierType: "set_max",
        weight: 5
    },
    {
        title: "Verfluchtes Katana gefunden",
        description: "Ein verfluchtes Katana wurde ausgegraben – Sammler zahlen Höchstpreise!",
        affectedSlugs: ["cursed_katana"],
        modifierType: "set_max",
        weight: 4
    },
    {
        title: "Fluch gebrochen",
        description: "Der Fluch des Katanas wurde gebrochen – sein Wert sinkt drastisch!",
        affectedSlugs: ["cursed_katana", "ancient_scroll"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 4
    },

    // ── Marktweite Events ─────────────────────────────────────────────────────
    {
        title: "Großer Basar",
        description: "Der jährliche große Basar öffnet – alle Nahrungspreise sinken!",
        affectedSlugs: ["onigiri", "ramen_bowl", "mochi", "takoyaki", "wagashi", "yakitori", "taiyaki"],
        modifierType: "multiply",
        modifierValue: 0.7,
        weight: 7
    },
    {
        title: "Konjunktur-Boom",
        description: "Die Wirtschaft boomt! Alle Sammelgüter werden teurer.",
        affectedSlugs: ["manga_volume", "artbook", "doujinshi", "trading_card", "ancient_scroll"],
        modifierType: "multiply",
        modifierValue: 1.35,
        weight: 6
    },

    // ── Saisonale / Globale Events ────────────────────────────────────────────
    {
        title: "Großes Erdbeben",
        description: "Ein Erdbeben erschüttert die Region – seltene Güter werden noch knapper!",
        affectedSlugs: ["dragon_scale", "phoenix_feather", "cursed_katana", "moonstone"],
        modifierType: "multiply",
        modifierValue: 1.9,
        weight: 3
    },
    {
        title: "Handelskrieg",
        description: "Diplomatische Spannungen unterbrechen Handelsrouten – Metalle sind Mangelware!",
        affectedSlugs: ["tamahagane", "orichalcum", "mithril_dust", "obsidian"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 4
    },
    {
        title: "Friedensvertrag",
        description: "Ein Friedensvertrag öffnet neue Handelswege – alle Rohstoffe werden günstiger!",
        affectedSlugs: ["tamahagane", "orichalcum", "mithril_dust", "jade_stone", "crystal_shard"],
        modifierType: "multiply",
        modifierValue: 0.65,
        weight: 4
    },
    {
        title: "Silvesternacht",
        description: "Die Silvesternacht lässt Sake und Wagashi aus den Regalen fliegen!",
        affectedSlugs: ["sake_bottle", "umeshu", "wagashi", "mochi"],
        modifierType: "set_max",
        weight: 6
    },
    {
        title: "Manga-Ausverkauf",
        description: "Ein Großverlag schließt – alle Manga-Bestände werden verramscht!",
        affectedSlugs: ["manga_volume", "doujinshi", "artbook"],
        modifierType: "set_min",
        weight: 5
    },
    {
        title: "Geisterschiff",
        description: "Ein Geisterschiff voller Waren treibt in den Hafen – Exotisches wird billig!",
        affectedSlugs: ["koi_fish", "pearl", "lotus_blossom", "washi_paper"],
        modifierType: "multiply",
        modifierValue: 0.55,
        weight: 5
    },
    {
        title: "Mondfinsternis",
        description: "Eine seltene Mondfinsternis steigert die mystische Nachfrage!",
        affectedSlugs: ["moonstone", "spirit_essence", "oni_horn", "phoenix_feather"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 5
    },
    {
        title: "Monsterjäger-Gilde aktiv",
        description: "Die Monsterjäger-Gilde zahlt Höchstpreise für rare Drops!",
        affectedSlugs: ["dragon_scale", "oni_horn", "cursed_katana"],
        modifierType: "multiply",
        modifierValue: 1.75,
        weight: 4
    },
    {
        title: "Schwarzmarkt-Razzia",
        description: "Eine Razzia auf den Schwarzmarkt lässt seltene Güter offiziell im Wert steigen!",
        affectedSlugs: ["ancient_scroll", "cursed_katana", "spirit_essence"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 5
    },
    {
        title: "Großer Blizzard",
        description: "Ein Blizzard legt Lieferketten lahm – Nahrungspreise explodieren!",
        affectedSlugs: ["onigiri", "ramen_bowl", "mochi", "wagashi", "taiyaki", "yakitori"],
        modifierType: "multiply",
        modifierValue: 1.65,
        weight: 4
    },
    {
        title: "Erntefest",
        description: "Das diesjährige Erntefest beschert Überfluss – Lebensmittel im Sonderangebot!",
        affectedSlugs: ["onigiri", "ramen_bowl", "takoyaki", "taiyaki", "yakitori", "wagashi"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 7
    },
    {
        title: "Kuno-Ichi-Turnier",
        description: "Das Kuno-Ichi-Turnier lässt Cosplay und Figuren aus den Regalen fliegen!",
        affectedSlugs: ["cosplay_material", "nendoroid", "rare_figure", "dakimakura"],
        modifierType: "multiply",
        modifierValue: 1.55,
        weight: 7
    },
    {
        title: "Internet-Meme-Boom",
        description: "Ein virales Meme katapultiert Sammelkarten in ungeahnte Höhen!",
        affectedSlugs: ["trading_card", "doujinshi"],
        modifierType: "set_max",
        weight: 5
    },
    {
        title: "Naturschutzgesetz",
        description: "Neues Naturschutzgesetz: Koi-Fische und Bonsai dürfen nicht mehr frei gehandelt werden!",
        affectedSlugs: ["koi_fish", "bonsai_tree", "kokedama"],
        modifierType: "multiply",
        modifierValue: 2.0,
        weight: 4
    },
    {
        title: "Schatztaucher-Expedition",
        description: "Eine Expedition bringt Unmengen von Perlen und Jade zurück – Preise verfallen!",
        affectedSlugs: ["pearl", "jade_stone", "crystal_shard"],
        modifierType: "multiply",
        modifierValue: 0.45,
        weight: 4
    },
    {
        title: "Magische Dürre",
        description: "Eine magische Dürre vernichtet Bambusbestände und trocknet Matcha-Felder aus!",
        affectedSlugs: ["bamboo", "matcha_powder", "sencha_tea", "kokedama"],
        modifierType: "set_max",
        weight: 5
    },
    {
        title: "Goldenes Zeitalter",
        description: "Das Goldene Zeitalter beginnt – alle seltenen Güter sind begehrt wie nie!",
        affectedSlugs: [
            "dragon_scale",
            "spirit_essence",
            "ancient_scroll",
            "phoenix_feather",
            "moonstone",
            "oni_horn",
            "cursed_katana"
        ],
        modifierType: "multiply",
        modifierValue: 1.4,
        weight: 3
    },
    {
        title: "Große Reinigung",
        description: "Alle seltenen Güter werden zu Spottpreisen abgegeben – die große Reinigung!",
        affectedSlugs: ["dragon_scale", "spirit_essence", "ancient_scroll", "phoenix_feather", "moonstone"],
        modifierType: "multiply",
        modifierValue: 0.5,
        weight: 3
    },
    {
        title: "Handwerker-Meisterkurs",
        description: "Angehende Meister kaufen alles an Rohstoffen auf was sie kriegen können!",
        affectedSlugs: ["tamahagane", "washi_paper", "bamboo", "jade_stone"],
        modifierType: "multiply",
        modifierValue: 1.45,
        weight: 8
    },
    {
        title: "Taifun-Saison",
        description: "Taifune unterbrechen Fischerboote – Koi und Perlen werden extrem rar!",
        affectedSlugs: ["koi_fish", "pearl"],
        modifierType: "set_max",
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
