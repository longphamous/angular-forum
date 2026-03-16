import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreditService } from "../../credit/credit.service";
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
    groupKey: string;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
    volatility?: number;
    canBuy?: boolean;
    canSell?: boolean;
    sortOrder?: number;
}

export interface UpdateMarketResourceDto {
    name?: string;
    description?: string;
    icon?: string;
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
    priceUpdateIntervalMinutes: number;
    eventChancePercent: number;
    demandDecayFactor: number;
    maxTradeQuantity: number;
}

// ─── Default resources (anime/manga themed) ─────────────────────────────────

const DEFAULT_RESOURCES: CreateMarketResourceDto[] = [
    // Manga & Anime
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
    // Japanische Rohstoffe
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
    // Edelsteine & Metalle
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
    // Nahrung
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
    // Seltene Güter
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
    }
];

const DEFAULT_EVENTS: CreateMarketEventDto[] = [
    {
        title: "Anime-Convention!",
        description: "Eine große Anime-Convention steigt! Otaku-Waren sind extrem gefragt!",
        affectedSlugs: ["manga_volume", "rare_figure", "anime_bluray", "cosplay_material"],
        modifierType: "set_max",
        weight: 8
    },
    {
        title: "Kirschblüten-Saison",
        description: "Die Sakura-Saison hat begonnen – Blüten sind überall verfügbar!",
        affectedSlugs: ["sakura_petals"],
        modifierType: "set_min",
        weight: 10
    },
    {
        title: "Drachenfest",
        description: "Beim jährlichen Drachenfest sind Drachenschuppen hochbegehrt!",
        affectedSlugs: ["dragon_scale"],
        modifierType: "multiply",
        modifierValue: 1.8,
        weight: 5
    },
    {
        title: "Ramen-Festival",
        description: "Ein Ramen-Festival findet statt – Ramen-Preise explodieren!",
        affectedSlugs: ["ramen_bowl", "onigiri"],
        modifierType: "multiply",
        modifierValue: 1.5,
        weight: 12
    },
    {
        title: "Schwertschmiede-Meister",
        description: "Ein berühmter Schmied besucht die Stadt. Tamahagane wird knapp!",
        affectedSlugs: ["tamahagane"],
        modifierType: "multiply",
        modifierValue: 1.6,
        weight: 7
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
        title: "Matcha-Ernte",
        description: "Eine hervorragende Matcha-Ernte drückt die Preise!",
        affectedSlugs: ["matcha_powder"],
        modifierType: "set_min",
        weight: 10
    },
    {
        title: "Sake-Fest",
        description: "Die jährliche Sake-Verkostung treibt die Preise hoch!",
        affectedSlugs: ["sake_bottle"],
        modifierType: "multiply",
        modifierValue: 1.7,
        weight: 8
    },
    {
        title: "Kristall-Mine entdeckt",
        description: "Eine neue Kristallmine wurde entdeckt – Kristalle im Überfluss!",
        affectedSlugs: ["crystal_shard", "jade_stone"],
        modifierType: "multiply",
        modifierValue: 0.6,
        weight: 6
    },
    {
        title: "Cosplay-Wettbewerb",
        description: "Ein großer Cosplay-Wettbewerb sorgt für Nachfrage!",
        affectedSlugs: ["cosplay_material", "rare_figure"],
        modifierType: "multiply",
        modifierValue: 1.4,
        weight: 9
    }
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DynamicMarketService implements OnModuleInit {
    private readonly logger = new Logger(DynamicMarketService.name);

    /** In-memory config (could be persisted later) */
    private config: MarketConfigDto = {
        priceUpdateIntervalMinutes: 60,
        eventChancePercent: 20,
        demandDecayFactor: 0.8,
        maxTradeQuantity: 100
    };

    /** Previous prices for trend calculation */
    private previousPrices = new Map<string, number>();

    private priceUpdateTimer: ReturnType<typeof setInterval> | null = null;

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
        private readonly creditService: CreditService
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            const count = await this.resourceRepo.count();
            if (count === 0) {
                await this.seedDefaults();
            }
            // Snapshot current prices for trend
            const resources = await this.resourceRepo.find();
            for (const r of resources) {
                this.previousPrices.set(r.slug, r.currentPrice);
            }
            // Start periodic price update
            this.startPriceUpdateLoop();
            this.logger.log(`Dynamic Market initialized with ${resources.length} resources.`);
        } catch (err) {
            this.logger.warn(`Dynamic Market init skipped: ${String(err)}`);
        }
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

        const totalPrice = resource.currentPrice * quantity;

        // Deduct coins from user wallet
        await this.creditService.deductCredits(userId, totalPrice, "market_buy", `Kauf: ${quantity}x ${resource.name}`);

        // Add to inventory
        const inv = await this.findOrCreateInventory(userId, resource.id);
        inv.quantity += quantity;
        await this.inventoryRepo.save(inv);

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

        const wallet = await this.creditService.getWallet(userId);

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

        const wallet = await this.creditService.getWallet(userId);

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
            groupKey: dto.groupKey,
            basePrice: dto.basePrice,
            minPrice: dto.minPrice,
            maxPrice: dto.maxPrice,
            currentPrice: dto.basePrice,
            volatility: dto.volatility ?? 1.0,
            canBuy: dto.canBuy ?? true,
            canSell: dto.canSell ?? true,
            sortOrder: dto.sortOrder ?? 0
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
        return { ...this.config };
    }

    updateConfig(partial: Partial<MarketConfigDto>): MarketConfigDto {
        this.config = { ...this.config, ...partial };
        // Restart the timer with new interval
        this.startPriceUpdateLoop();
        return this.getConfig();
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
            r.unitsSold = Math.round(r.unitsSold * this.config.demandDecayFactor);
            r.unitsBought = Math.round(r.unitsBought * this.config.demandDecayFactor);
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
        this.logger.log("Market prices recalculated.");
    }

    // ─── Random Events ──────────────────────────────────────────────────────

    private async executeRandomEvent(): Promise<MarketEventLogDto | null> {
        // Roll chance
        const roll = Math.random() * 100;
        if (roll > this.config.eventChancePercent) {
            this.logger.debug(`Event roll ${roll.toFixed(1)} > ${this.config.eventChancePercent}% – no event.`);
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

        this.logger.log(`Market event triggered: "${selected.title}"`);
        return this.toEventLogDto(savedLog);
    }

    // ─── Timer ──────────────────────────────────────────────────────────────

    private startPriceUpdateLoop(): void {
        if (this.priceUpdateTimer) clearInterval(this.priceUpdateTimer);

        const intervalMs = this.config.priceUpdateIntervalMinutes * 60 * 1000;
        this.priceUpdateTimer = setInterval(() => {
            void this.runPriceUpdateCycle();
        }, intervalMs);
    }

    private async runPriceUpdateCycle(): Promise<void> {
        try {
            await this.recalculatePrices();
            await this.executeRandomEvent();
        } catch (err) {
            this.logger.error(`Price update cycle failed: ${String(err)}`);
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private async seedDefaults(): Promise<void> {
        for (const dto of DEFAULT_RESOURCES) {
            // Generate initial price history with slight random variation around base price
            const history: number[] = [];
            for (let i = 0; i < 12; i++) {
                const jitter = 1 + (Math.random() - 0.5) * 0.2; // ±10%
                history.push(Math.max(dto.minPrice, Math.min(dto.maxPrice, Math.round(dto.basePrice * jitter))));
            }
            history.push(dto.basePrice);
            const entity = this.resourceRepo.create({
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
            });
            await this.resourceRepo.save(entity);
        }
        for (const dto of DEFAULT_EVENTS) {
            const entity = this.eventRepo.create({
                title: dto.title,
                description: dto.description,
                affectedSlugs: dto.affectedSlugs,
                modifierType: dto.modifierType,
                modifierValue: dto.modifierValue ?? 0,
                weight: dto.weight ?? 10
            });
            await this.eventRepo.save(entity);
        }
        this.logger.log("Default market resources and events seeded.");
    }

    private async findOrCreateInventory(userId: string, resourceId: string): Promise<UserInventoryEntity> {
        let inv = await this.inventoryRepo.findOneBy({ userId, resourceId });
        if (!inv) {
            inv = this.inventoryRepo.create({ userId, resourceId, quantity: 0 });
            await this.inventoryRepo.save(inv);
        }
        return inv;
    }

    private clampPrice(resource: MarketResourceEntity, price: number): number {
        return Math.max(resource.minPrice, Math.min(resource.maxPrice, Math.round(price)));
    }

    private validateQuantity(quantity: number): void {
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new BadRequestException("Quantity must be a positive integer.");
        }
        if (quantity > this.config.maxTradeQuantity) {
            throw new BadRequestException(`Maximum trade quantity is ${this.config.maxTradeQuantity}.`);
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
            changePercent: Math.round(changePercent * 100) / 100
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
