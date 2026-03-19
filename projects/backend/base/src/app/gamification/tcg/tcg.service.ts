import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { CreditService } from "../../credit/credit.service";
import { MarketCategoryEntity } from "../../marketplace/entities/market-category.entity";
import { MarketListingEntity } from "../../marketplace/entities/market-listing.entity";
import { NotificationsService } from "../../notifications/notifications.service";
import { UserEntity } from "../../user/entities/user.entity";
import { BoosterCategoryEntity } from "./entities/booster-category.entity";
import { BoosterPackEntity } from "./entities/booster-pack.entity";
import { BoosterPackCardEntity } from "./entities/booster-pack-card.entity";
import { CardEntity } from "./entities/card.entity";
import { UserBoosterEntity } from "./entities/user-booster.entity";
import { UserCardEntity } from "./entities/user-card.entity";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type CardElement = "fire" | "water" | "earth" | "wind" | "light" | "dark" | "neutral";

/** Slug used to identify the auto-seeded marketplace category for TCG cards. */
const TCG_CATEGORY_NAME = "Trading Cards";
const TCG_CATEGORY_ICON = "pi pi-id-card";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CardDto {
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

export interface BoosterCategoryDto {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    isActive: boolean;
    sortOrder: number;
}

export interface BoosterPackDto {
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

export interface UserCardDto {
    cardId: string;
    card: CardDto;
    quantity: number;
    firstObtainedAt: string;
    isFavorite: boolean;
}

export interface UserBoosterDto {
    id: string;
    boosterPackId: string;
    boosterPack: BoosterPackDto;
    isOpened: boolean;
    purchasedAt: string;
    openedAt: string | null;
}

export interface OpenBoosterResultDto {
    boosterId: string;
    cards: CardDto[];
    newCards: string[];
}

export interface CardListingDto {
    id: string;
    userId: string;
    sellerName: string;
    cardId: string;
    card: CardDto;
    price: number;
    quantity: number;
    status: "active" | "sold" | "cancelled";
    createdAt: string;
}

export interface CollectionProgressDto {
    totalCards: number;
    ownedUniqueCards: number;
    completionPercent: number;
    bySeries: { series: string; total: number; owned: number; percent: number }[];
    byRarity: { rarity: CardRarity; total: number; owned: number }[];
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

export interface UpdateCardDto extends Partial<CreateCardDto> {
    isActive?: boolean;
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

export interface UpdateBoosterCategoryDto extends Partial<CreateBoosterCategoryDto> {
    isActive?: boolean;
}

export interface UpdateBoosterPackDto extends Partial<CreateBoosterPackDto> {
    isActive?: boolean;
}

export interface AdminBoosterDetailDto extends BoosterPackDto {
    cards: { cardId: string; cardName: string; cardRarity: CardRarity; dropWeight: number }[];
}

/** Shape of the JSONB stored in MarketListingEntity.customFields for TCG cards. */
interface TcgCustomFields {
    tcgCardId: string;
    tcgCardQuantity: number;
    tcgCardRarity: string;
    tcgCardName: string;
    tcgCardIcon: string | null;
    tcgCardImageUrl: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCardDto(entity: CardEntity, owned?: number): CardDto {
    const dto: CardDto = {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        imageUrl: entity.imageUrl,
        rarity: entity.rarity as CardRarity,
        series: entity.series,
        element: entity.element as CardElement | null,
        attack: entity.attack,
        defense: entity.defense,
        hp: entity.hp,
        artistCredit: entity.artistCredit,
        flavorText: entity.flavorText,
        isActive: entity.isActive,
        sortOrder: entity.sortOrder
    };
    if (owned !== undefined) {
        dto.owned = owned;
    }
    return dto;
}

function toBoosterPackDto(
    entity: BoosterPackEntity,
    totalCards: number,
    userPurchases?: number,
    categoryName?: string | null
): BoosterPackDto {
    const dto: BoosterPackDto = {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        imageUrl: entity.imageUrl,
        price: entity.price,
        cardsPerPack: entity.cardsPerPack,
        guaranteedRarity: entity.guaranteedRarity as CardRarity | null,
        series: entity.series,
        categoryId: entity.categoryId ?? null,
        categoryName: categoryName ?? entity.category?.name ?? null,
        availableFrom: entity.availableFrom ? entity.availableFrom.toISOString() : null,
        availableUntil: entity.availableUntil ? entity.availableUntil.toISOString() : null,
        maxPurchasesPerUser: entity.maxPurchasesPerUser,
        isActive: entity.isActive,
        sortOrder: entity.sortOrder,
        totalCards
    };
    if (userPurchases !== undefined) {
        dto.userPurchases = userPurchases;
    }
    return dto;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class TcgService implements OnModuleInit {
    private readonly logger = new Logger(TcgService.name);
    private tcgCategoryId: string | null = null;

    constructor(
        @InjectRepository(CardEntity)
        private readonly cardRepo: Repository<CardEntity>,
        @InjectRepository(BoosterPackEntity)
        private readonly boosterPackRepo: Repository<BoosterPackEntity>,
        @InjectRepository(BoosterPackCardEntity)
        private readonly boosterPackCardRepo: Repository<BoosterPackCardEntity>,
        @InjectRepository(BoosterCategoryEntity)
        private readonly boosterCategoryRepo: Repository<BoosterCategoryEntity>,
        @InjectRepository(UserCardEntity)
        private readonly userCardRepo: Repository<UserCardEntity>,
        @InjectRepository(UserBoosterEntity)
        private readonly userBoosterRepo: Repository<UserBoosterEntity>,
        @InjectRepository(MarketListingEntity)
        private readonly listingRepo: Repository<MarketListingEntity>,
        @InjectRepository(MarketCategoryEntity)
        private readonly marketCategoryRepo: Repository<MarketCategoryEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly creditService: CreditService,
        private readonly notificationsService: NotificationsService
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.ensureTcgCategory();
        } catch (err) {
            this.logger.warn(`TCG category seed skipped: ${String(err)}`);
        }
    }

    /** Find or create the "Trading Cards" category in the community marketplace. */
    private async ensureTcgCategory(): Promise<void> {
        let category = await this.marketCategoryRepo.findOne({
            where: { name: TCG_CATEGORY_NAME, parentId: IsNull() }
        });
        if (!category) {
            category = this.marketCategoryRepo.create({
                name: TCG_CATEGORY_NAME,
                description: "Sammelkarten aus dem Trading Card Game",
                icon: TCG_CATEGORY_ICON,
                sortOrder: 999,
                requiresApproval: false,
                isActive: true
            });
            category = await this.marketCategoryRepo.save(category);
            this.logger.log(`Created marketplace category "${TCG_CATEGORY_NAME}" (${category.id})`);
        }
        this.tcgCategoryId = category.id;
    }

    private async getTcgCategoryId(): Promise<string> {
        if (!this.tcgCategoryId) {
            await this.ensureTcgCategory();
        }
        return this.tcgCategoryId!;
    }

    // ─── Public ───────────────────────────────────────────────────────────────

    async getActiveBoosters(userId?: string): Promise<BoosterPackDto[]> {
        const now = new Date();
        const boosters = await this.boosterPackRepo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC", createdAt: "DESC" }
        });

        const activeBoosters = boosters.filter((b) => {
            if (b.availableFrom && b.availableFrom > now) return false;
            if (b.availableUntil && b.availableUntil < now) return false;
            return true;
        });

        const results: BoosterPackDto[] = [];
        for (const booster of activeBoosters) {
            const totalCards = await this.boosterPackCardRepo.count({
                where: { boosterPackId: booster.id }
            });
            let userPurchases: number | undefined;
            if (userId) {
                userPurchases = await this.userBoosterRepo.count({
                    where: { userId, boosterPackId: booster.id }
                });
            }
            results.push(toBoosterPackDto(booster, totalCards, userPurchases));
        }
        return results;
    }

    async getAllCards(userId?: string): Promise<CardDto[]> {
        const cards = await this.cardRepo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC", name: "ASC" }
        });

        if (!userId) {
            return cards.map((c) => toCardDto(c));
        }

        const userCards = await this.userCardRepo.find({ where: { userId } });
        const ownedMap = new Map<string, number>();
        for (const uc of userCards) {
            ownedMap.set(uc.cardId, uc.quantity);
        }
        return cards.map((c) => toCardDto(c, ownedMap.get(c.id) ?? 0));
    }

    async getCardById(id: string): Promise<CardDto> {
        const card = await this.cardRepo.findOneBy({ id });
        if (!card) {
            throw new NotFoundException("Card not found");
        }
        return toCardDto(card);
    }

    // ─── Authenticated ────────────────────────────────────────────────────────

    async buyBooster(userId: string, boosterPackId: string): Promise<UserBoosterDto> {
        const booster = await this.boosterPackRepo.findOneBy({ id: boosterPackId });
        if (!booster || !booster.isActive) {
            throw new NotFoundException("Booster pack not found or not active");
        }

        const now = new Date();
        if (booster.availableFrom && booster.availableFrom > now) {
            throw new BadRequestException("This booster pack is not yet available");
        }
        if (booster.availableUntil && booster.availableUntil < now) {
            throw new BadRequestException("This booster pack is no longer available");
        }

        if (booster.maxPurchasesPerUser !== null) {
            const purchaseCount = await this.userBoosterRepo.count({
                where: { userId, boosterPackId }
            });
            if (purchaseCount >= booster.maxPurchasesPerUser) {
                throw new BadRequestException("Maximum purchase limit reached for this booster pack");
            }
        }

        await this.creditService.deductCredits(
            userId,
            booster.price,
            "tcg_booster_buy",
            `Purchased booster pack: ${booster.name}`
        );

        const userBooster = this.userBoosterRepo.create({
            userId,
            boosterPackId
        });
        const saved = await this.userBoosterRepo.save(userBooster);

        const totalCards = await this.boosterPackCardRepo.count({
            where: { boosterPackId }
        });

        return {
            id: saved.id,
            boosterPackId: saved.boosterPackId,
            boosterPack: toBoosterPackDto(booster, totalCards),
            isOpened: saved.isOpened,
            purchasedAt: saved.purchasedAt.toISOString(),
            openedAt: null
        };
    }

    async openBooster(userId: string, userBoosterId: string): Promise<OpenBoosterResultDto> {
        const userBooster = await this.userBoosterRepo.findOne({
            where: { id: userBoosterId, userId },
            relations: ["boosterPack"]
        });
        if (!userBooster) {
            throw new NotFoundException("Booster not found in your inventory");
        }
        if (userBooster.isOpened) {
            throw new BadRequestException("This booster has already been opened");
        }

        const packCards = await this.boosterPackCardRepo.find({
            where: { boosterPackId: userBooster.boosterPackId },
            relations: ["card"]
        });

        if (packCards.length === 0) {
            throw new BadRequestException("This booster pack has no cards configured");
        }

        const drawnCards = this.selectRandomCards(
            packCards,
            userBooster.boosterPack.cardsPerPack,
            userBooster.boosterPack.guaranteedRarity
        );

        userBooster.isOpened = true;
        userBooster.openedAt = new Date();
        await this.userBoosterRepo.save(userBooster);

        const newCardIds: string[] = [];

        for (const card of drawnCards) {
            const existing = await this.userCardRepo.findOne({
                where: { userId, cardId: card.id }
            });
            if (existing) {
                existing.quantity += 1;
                await this.userCardRepo.save(existing);
            } else {
                const userCard = this.userCardRepo.create({
                    userId,
                    cardId: card.id,
                    quantity: 1
                });
                await this.userCardRepo.save(userCard);
                newCardIds.push(card.id);
            }
        }

        const rareCards = drawnCards.filter((c) => c.rarity === "legendary" || c.rarity === "mythic");
        for (const rareCard of rareCards) {
            await this.notificationsService.create(
                userId,
                "system",
                "Seltene Karte!",
                `Du hast eine ${rareCard.rarity} Karte gezogen: ${rareCard.name}!`,
                "/tcg"
            );
        }

        return {
            boosterId: userBoosterId,
            cards: drawnCards.map((c) => toCardDto(c)),
            newCards: newCardIds
        };
    }

    async getCollection(userId: string): Promise<UserCardDto[]> {
        const userCards = await this.userCardRepo.find({
            where: { userId },
            relations: ["card"],
            order: { card: { sortOrder: "ASC", name: "ASC" } }
        });

        return userCards.map((uc) => ({
            cardId: uc.cardId,
            card: toCardDto(uc.card),
            quantity: uc.quantity,
            firstObtainedAt: uc.firstObtainedAt.toISOString(),
            isFavorite: uc.isFavorite
        }));
    }

    async getCollectionProgress(userId: string): Promise<CollectionProgressDto> {
        const allCards = await this.cardRepo.find({ where: { isActive: true } });
        const userCards = await this.userCardRepo.find({ where: { userId } });
        const ownedCardIds = new Set(userCards.map((uc) => uc.cardId));

        const totalCards = allCards.length;
        const ownedUniqueCards = [...ownedCardIds].filter((id) => allCards.some((c) => c.id === id)).length;
        const completionPercent = totalCards > 0 ? Math.round((ownedUniqueCards / totalCards) * 10000) / 100 : 0;

        const seriesMap = new Map<string, { total: number; owned: number }>();
        const rarityMap = new Map<CardRarity, { total: number; owned: number }>();

        for (const card of allCards) {
            const rarity = card.rarity as CardRarity;

            const seriesEntry = seriesMap.get(card.series) ?? { total: 0, owned: 0 };
            seriesEntry.total += 1;
            if (ownedCardIds.has(card.id)) {
                seriesEntry.owned += 1;
            }
            seriesMap.set(card.series, seriesEntry);

            const rarityEntry = rarityMap.get(rarity) ?? { total: 0, owned: 0 };
            rarityEntry.total += 1;
            if (ownedCardIds.has(card.id)) {
                rarityEntry.owned += 1;
            }
            rarityMap.set(rarity, rarityEntry);
        }

        const bySeries = [...seriesMap.entries()].map(([series, data]) => ({
            series,
            total: data.total,
            owned: data.owned,
            percent: data.total > 0 ? Math.round((data.owned / data.total) * 10000) / 100 : 0
        }));

        const byRarity = [...rarityMap.entries()].map(([rarity, data]) => ({
            rarity,
            total: data.total,
            owned: data.owned
        }));

        return {
            totalCards,
            ownedUniqueCards,
            completionPercent,
            bySeries,
            byRarity
        };
    }

    async getUnopenedBoosters(userId: string): Promise<UserBoosterDto[]> {
        const boosters = await this.userBoosterRepo.find({
            where: { userId, isOpened: false },
            relations: ["boosterPack"],
            order: { purchasedAt: "DESC" }
        });

        const results: UserBoosterDto[] = [];
        for (const b of boosters) {
            const totalCards = await this.boosterPackCardRepo.count({
                where: { boosterPackId: b.boosterPackId }
            });
            results.push({
                id: b.id,
                boosterPackId: b.boosterPackId,
                boosterPack: toBoosterPackDto(b.boosterPack, totalCards),
                isOpened: b.isOpened,
                purchasedAt: b.purchasedAt.toISOString(),
                openedAt: null
            });
        }
        return results;
    }

    async toggleFavorite(userId: string, cardId: string): Promise<UserCardDto> {
        const userCard = await this.userCardRepo.findOne({
            where: { userId, cardId },
            relations: ["card"]
        });
        if (!userCard) {
            throw new NotFoundException("Card not found in your collection");
        }
        userCard.isFavorite = !userCard.isFavorite;
        const saved = await this.userCardRepo.save(userCard);
        return {
            cardId: saved.cardId,
            card: toCardDto(saved.card),
            quantity: saved.quantity,
            firstObtainedAt: saved.firstObtainedAt.toISOString(),
            isFavorite: saved.isFavorite
        };
    }

    async transferCard(userId: string, cardId: string, targetUserId: string, quantity: number): Promise<void> {
        if (userId === targetUserId) {
            throw new BadRequestException("Cannot transfer cards to yourself");
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new BadRequestException("Quantity must be a positive integer");
        }

        const senderCard = await this.userCardRepo.findOne({
            where: { userId, cardId }
        });
        if (!senderCard || senderCard.quantity < quantity) {
            throw new BadRequestException("You do not have enough copies of this card");
        }

        senderCard.quantity -= quantity;
        if (senderCard.quantity === 0) {
            await this.userCardRepo.remove(senderCard);
        } else {
            await this.userCardRepo.save(senderCard);
        }

        const receiverCard = await this.userCardRepo.findOne({
            where: { userId: targetUserId, cardId }
        });
        if (receiverCard) {
            receiverCard.quantity += quantity;
            await this.userCardRepo.save(receiverCard);
        } else {
            const newCard = this.userCardRepo.create({
                userId: targetUserId,
                cardId,
                quantity
            });
            await this.userCardRepo.save(newCard);
        }

        const sender = await this.userRepo.findOneBy({ id: userId });
        const card = await this.cardRepo.findOneBy({ id: cardId });
        const senderName = sender?.displayName ?? "Unbekannt";
        const cardName = card?.name ?? "Unbekannte Karte";
        await this.notificationsService.create(
            targetUserId,
            "system",
            "Karte erhalten",
            `${senderName} hat dir ${quantity}x ${cardName} übertragen.`,
            "/tcg"
        );
    }

    // ─── Marketplace (unified with community marketplace) ─────────────────────

    async getActiveListings(): Promise<CardListingDto[]> {
        const categoryId = await this.getTcgCategoryId();

        const listings = await this.listingRepo.find({
            where: { categoryId, status: "active", deletedAt: undefined },
            order: { createdAt: "DESC" }
        });

        // Collect unique user IDs and card IDs
        const userIds = new Set<string>();
        const cardIds = new Set<string>();
        for (const l of listings) {
            userIds.add(l.authorId);
            const cf = l.customFields as TcgCustomFields | null;
            if (cf?.tcgCardId) cardIds.add(cf.tcgCardId);
        }

        const users = userIds.size > 0 ? await this.userRepo.findByIds([...userIds]) : [];
        const userMap = new Map(users.map((u) => [u.id, u.displayName]));

        const cards = cardIds.size > 0 ? await this.cardRepo.findByIds([...cardIds]) : [];
        const cardMap = new Map(cards.map((c) => [c.id, c]));

        return listings
            .map((l) => {
                const cf = l.customFields as TcgCustomFields | null;
                if (!cf?.tcgCardId) return null;
                const card = cardMap.get(cf.tcgCardId);
                if (!card) return null;

                return {
                    id: l.id,
                    userId: l.authorId,
                    sellerName: userMap.get(l.authorId) ?? "Unknown",
                    cardId: cf.tcgCardId,
                    card: toCardDto(card),
                    price: Number(l.price) || 0,
                    quantity: cf.tcgCardQuantity ?? 1,
                    status: "active" as CardListingDto["status"],
                    createdAt: l.createdAt.toISOString()
                };
            })
            .filter((dto): dto is CardListingDto => dto !== null);
    }

    async createListing(userId: string, cardId: string, price: number, quantity: number): Promise<CardListingDto> {
        if (!Number.isInteger(price) || price <= 0) {
            throw new BadRequestException("Price must be a positive integer");
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new BadRequestException("Quantity must be a positive integer");
        }

        const userCard = await this.userCardRepo.findOne({
            where: { userId, cardId },
            relations: ["card"]
        });
        if (!userCard || userCard.quantity < quantity) {
            throw new BadRequestException("You do not have enough copies of this card");
        }

        const card = userCard.card;

        // Deduct cards from user's collection
        userCard.quantity -= quantity;
        if (userCard.quantity === 0) {
            await this.userCardRepo.remove(userCard);
        } else {
            await this.userCardRepo.save(userCard);
        }

        // Create a marketplace listing
        const categoryId = await this.getTcgCategoryId();
        const customFields: TcgCustomFields = {
            tcgCardId: cardId,
            tcgCardQuantity: quantity,
            tcgCardRarity: card.rarity,
            tcgCardName: card.name,
            tcgCardIcon: card.imageUrl ?? null,
            tcgCardImageUrl: card.imageUrl ?? null
        };

        const listing = this.listingRepo.create({
            title: `${card.name} x${quantity}`,
            description: card.description ?? `Trading Card: ${card.name} (${card.rarity})`,
            price,
            currency: "COINS",
            type: "sell" as const,
            status: "active" as const,
            categoryId,
            authorId: userId,
            images: card.imageUrl ? [card.imageUrl] : [],
            tags: ["tcg", card.rarity, card.series],
            customFields: customFields as unknown as Record<string, unknown>
        });
        const saved = await this.listingRepo.save(listing);

        const user = await this.userRepo.findOneBy({ id: userId });

        return {
            id: saved.id,
            userId: saved.authorId,
            sellerName: user?.displayName ?? "Unknown",
            cardId,
            card: toCardDto(card),
            price: Number(saved.price) || 0,
            quantity,
            status: "active",
            createdAt: saved.createdAt.toISOString()
        };
    }

    async cancelListing(userId: string, listingId: string): Promise<void> {
        const listing = await this.listingRepo.findOne({
            where: { id: listingId, authorId: userId }
        });
        if (!listing) {
            throw new NotFoundException("Listing not found");
        }
        if (listing.status !== "active") {
            throw new BadRequestException("Listing is not active");
        }

        const cf = listing.customFields as TcgCustomFields | null;
        if (!cf?.tcgCardId) {
            throw new BadRequestException("Not a TCG card listing");
        }

        // Mark as closed
        listing.status = "closed";
        await this.listingRepo.save(listing);

        // Return cards to user
        const userCard = await this.userCardRepo.findOne({
            where: { userId, cardId: cf.tcgCardId }
        });
        if (userCard) {
            userCard.quantity += cf.tcgCardQuantity;
            await this.userCardRepo.save(userCard);
        } else {
            const newCard = this.userCardRepo.create({
                userId,
                cardId: cf.tcgCardId,
                quantity: cf.tcgCardQuantity
            });
            await this.userCardRepo.save(newCard);
        }
    }

    async buyListing(buyerId: string, listingId: string): Promise<CardListingDto> {
        const listing = await this.listingRepo.findOne({
            where: { id: listingId }
        });
        if (!listing) {
            throw new NotFoundException("Listing not found");
        }
        if (listing.status !== "active") {
            throw new BadRequestException("Listing is no longer active");
        }
        if (listing.authorId === buyerId) {
            throw new BadRequestException("You cannot buy your own listing");
        }

        const cf = listing.customFields as TcgCustomFields | null;
        if (!cf?.tcgCardId) {
            throw new BadRequestException("Not a TCG card listing");
        }

        const card = await this.cardRepo.findOneBy({ id: cf.tcgCardId });
        if (!card) {
            throw new NotFoundException("Card no longer exists");
        }

        const totalPrice = Number(listing.price) || 0;

        // Deduct coins from buyer
        await this.creditService.deductCredits(
            buyerId,
            totalPrice,
            "tcg_card_buy",
            `Purchased card listing: ${card.name} x${cf.tcgCardQuantity}`
        );

        // Add coins to seller
        await this.creditService.addCredits(
            listing.authorId,
            totalPrice,
            "tcg_card_sell",
            `Sold card: ${card.name} x${cf.tcgCardQuantity}`
        );

        // Transfer cards to buyer
        const buyerCard = await this.userCardRepo.findOne({
            where: { userId: buyerId, cardId: cf.tcgCardId }
        });
        if (buyerCard) {
            buyerCard.quantity += cf.tcgCardQuantity;
            await this.userCardRepo.save(buyerCard);
        } else {
            const newCard = this.userCardRepo.create({
                userId: buyerId,
                cardId: cf.tcgCardId,
                quantity: cf.tcgCardQuantity
            });
            await this.userCardRepo.save(newCard);
        }

        // Mark listing as sold
        listing.status = "sold";
        const saved = await this.listingRepo.save(listing);

        await this.notificationsService.create(
            listing.authorId,
            "system",
            "Karte verkauft!",
            `${card.name} x${cf.tcgCardQuantity} wurde für ${totalPrice} Coins verkauft.`,
            "/tcg"
        );

        const seller = await this.userRepo.findOneBy({ id: listing.authorId });

        return {
            id: saved.id,
            userId: saved.authorId,
            sellerName: seller?.displayName ?? "Unknown",
            cardId: cf.tcgCardId,
            card: toCardDto(card),
            price: totalPrice,
            quantity: cf.tcgCardQuantity,
            status: "sold",
            createdAt: saved.createdAt.toISOString()
        };
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    async adminGetAllCards(): Promise<CardDto[]> {
        const cards = await this.cardRepo.find({
            order: { sortOrder: "ASC", name: "ASC" }
        });
        return cards.map((c) => toCardDto(c));
    }

    async adminCreateCard(dto: CreateCardDto): Promise<CardDto> {
        const card = this.cardRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            imageUrl: dto.imageUrl ?? null,
            rarity: dto.rarity,
            series: dto.series,
            element: dto.element ?? null,
            attack: dto.attack ?? 0,
            defense: dto.defense ?? 0,
            hp: dto.hp ?? 0,
            artistCredit: dto.artistCredit ?? null,
            flavorText: dto.flavorText ?? null,
            sortOrder: dto.sortOrder ?? 0
        });
        const saved = await this.cardRepo.save(card);
        return toCardDto(saved);
    }

    async adminUpdateCard(id: string, dto: UpdateCardDto): Promise<CardDto> {
        const card = await this.cardRepo.findOneBy({ id });
        if (!card) {
            throw new NotFoundException("Card not found");
        }

        if (dto.name !== undefined) card.name = dto.name;
        if (dto.description !== undefined) card.description = dto.description ?? null;
        if (dto.imageUrl !== undefined) card.imageUrl = dto.imageUrl ?? null;
        if (dto.rarity !== undefined) card.rarity = dto.rarity;
        if (dto.series !== undefined) card.series = dto.series;
        if (dto.element !== undefined) card.element = dto.element ?? null;
        if (dto.attack !== undefined) card.attack = dto.attack;
        if (dto.defense !== undefined) card.defense = dto.defense;
        if (dto.hp !== undefined) card.hp = dto.hp;
        if (dto.artistCredit !== undefined) card.artistCredit = dto.artistCredit ?? null;
        if (dto.flavorText !== undefined) card.flavorText = dto.flavorText ?? null;
        if (dto.isActive !== undefined) card.isActive = dto.isActive;
        if (dto.sortOrder !== undefined) card.sortOrder = dto.sortOrder;

        const saved = await this.cardRepo.save(card);
        return toCardDto(saved);
    }

    async adminDeleteCard(id: string): Promise<void> {
        const card = await this.cardRepo.findOneBy({ id });
        if (!card) {
            throw new NotFoundException("Card not found");
        }

        // Remove from all booster packs
        await this.boosterPackCardRepo.delete({ cardId: id });

        await this.cardRepo.remove(card);
    }

    async adminGetAllBoosters(): Promise<AdminBoosterDetailDto[]> {
        const boosters = await this.boosterPackRepo.find({
            relations: ["category"],
            order: { sortOrder: "ASC", createdAt: "DESC" }
        });

        const results: AdminBoosterDetailDto[] = [];
        for (const booster of boosters) {
            const packCards = await this.boosterPackCardRepo.find({
                where: { boosterPackId: booster.id },
                relations: ["card"]
            });

            results.push({
                ...toBoosterPackDto(booster, packCards.length),
                cards: packCards.map((pc) => ({
                    cardId: pc.cardId,
                    cardName: pc.card.name,
                    cardRarity: pc.card.rarity as CardRarity,
                    dropWeight: pc.dropWeight
                }))
            });
        }
        return results;
    }

    async adminCreateBooster(dto: CreateBoosterPackDto): Promise<BoosterPackDto> {
        const booster = this.boosterPackRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            imageUrl: dto.imageUrl ?? null,
            price: dto.price,
            cardsPerPack: dto.cardsPerPack ?? 5,
            guaranteedRarity: dto.guaranteedRarity ?? null,
            series: dto.series,
            categoryId: dto.categoryId ?? null,
            availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
            availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
            maxPurchasesPerUser: dto.maxPurchasesPerUser ?? null,
            sortOrder: dto.sortOrder ?? 0
        });
        const saved = await this.boosterPackRepo.save(booster);

        if (dto.cards && dto.cards.length > 0) {
            for (const cardEntry of dto.cards) {
                const card = await this.cardRepo.findOneBy({ id: cardEntry.cardId });
                if (!card) continue;
                const packCard = this.boosterPackCardRepo.create({
                    boosterPackId: saved.id,
                    cardId: cardEntry.cardId,
                    dropWeight: cardEntry.dropWeight
                });
                await this.boosterPackCardRepo.save(packCard);
            }
        }

        const totalCards = dto.cards?.length ?? 0;
        return toBoosterPackDto(saved, totalCards);
    }

    async adminUpdateBooster(id: string, dto: UpdateBoosterPackDto): Promise<BoosterPackDto> {
        const booster = await this.boosterPackRepo.findOneBy({ id });
        if (!booster) {
            throw new NotFoundException("Booster pack not found");
        }

        if (dto.name !== undefined) booster.name = dto.name;
        if (dto.description !== undefined) booster.description = dto.description ?? null;
        if (dto.imageUrl !== undefined) booster.imageUrl = dto.imageUrl ?? null;
        if (dto.price !== undefined) booster.price = dto.price;
        if (dto.cardsPerPack !== undefined) booster.cardsPerPack = dto.cardsPerPack;
        if (dto.guaranteedRarity !== undefined) booster.guaranteedRarity = dto.guaranteedRarity ?? null;
        if (dto.series !== undefined) booster.series = dto.series;
        if (dto.categoryId !== undefined) booster.categoryId = dto.categoryId ?? null;
        if (dto.availableFrom !== undefined)
            booster.availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : null;
        if (dto.availableUntil !== undefined)
            booster.availableUntil = dto.availableUntil ? new Date(dto.availableUntil) : null;
        if (dto.maxPurchasesPerUser !== undefined) booster.maxPurchasesPerUser = dto.maxPurchasesPerUser ?? null;
        if (dto.isActive !== undefined) booster.isActive = dto.isActive;
        if (dto.sortOrder !== undefined) booster.sortOrder = dto.sortOrder;

        const saved = await this.boosterPackRepo.save(booster);
        const totalCards = await this.boosterPackCardRepo.count({ where: { boosterPackId: id } });
        return toBoosterPackDto(saved, totalCards);
    }

    async adminDeleteBooster(id: string): Promise<void> {
        const booster = await this.boosterPackRepo.findOneBy({ id });
        if (!booster) {
            throw new NotFoundException("Booster pack not found");
        }
        await this.boosterPackCardRepo.delete({ boosterPackId: id });
        await this.boosterPackRepo.remove(booster);
    }

    async adminAddCardToBooster(boosterId: string, cardId: string, dropWeight: number): Promise<void> {
        const booster = await this.boosterPackRepo.findOneBy({ id: boosterId });
        if (!booster) {
            throw new NotFoundException("Booster pack not found");
        }
        const card = await this.cardRepo.findOneBy({ id: cardId });
        if (!card) {
            throw new NotFoundException("Card not found");
        }

        const existing = await this.boosterPackCardRepo.findOne({
            where: { boosterPackId: boosterId, cardId }
        });
        if (existing) {
            throw new BadRequestException("Card is already in this booster pack");
        }

        const packCard = this.boosterPackCardRepo.create({
            boosterPackId: boosterId,
            cardId,
            dropWeight
        });
        await this.boosterPackCardRepo.save(packCard);
    }

    async adminRemoveCardFromBooster(boosterId: string, cardId: string): Promise<void> {
        const packCard = await this.boosterPackCardRepo.findOne({
            where: { boosterPackId: boosterId, cardId }
        });
        if (!packCard) {
            throw new NotFoundException("Card not found in this booster pack");
        }
        await this.boosterPackCardRepo.remove(packCard);
    }

    async adminUpdateCardDropWeight(boosterId: string, cardId: string, dropWeight: number): Promise<void> {
        const packCard = await this.boosterPackCardRepo.findOne({
            where: { boosterPackId: boosterId, cardId }
        });
        if (!packCard) {
            throw new NotFoundException("Card not found in this booster pack");
        }
        packCard.dropWeight = dropWeight;
        await this.boosterPackCardRepo.save(packCard);
    }

    // ─── Admin: Booster Categories ─────────────────────────────────────────────

    async adminGetAllCategories(): Promise<BoosterCategoryDto[]> {
        const categories = await this.boosterCategoryRepo.find({
            order: { sortOrder: "ASC", name: "ASC" }
        });
        return categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            icon: c.icon,
            isActive: c.isActive,
            sortOrder: c.sortOrder
        }));
    }

    async adminCreateCategory(dto: CreateBoosterCategoryDto): Promise<BoosterCategoryDto> {
        const category = this.boosterCategoryRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            icon: dto.icon ?? null,
            sortOrder: dto.sortOrder ?? 0
        });
        const saved = await this.boosterCategoryRepo.save(category);
        return {
            id: saved.id,
            name: saved.name,
            description: saved.description,
            icon: saved.icon,
            isActive: saved.isActive,
            sortOrder: saved.sortOrder
        };
    }

    async adminUpdateCategory(id: string, dto: UpdateBoosterCategoryDto): Promise<BoosterCategoryDto> {
        const category = await this.boosterCategoryRepo.findOneBy({ id });
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        if (dto.name !== undefined) category.name = dto.name;
        if (dto.description !== undefined) category.description = dto.description ?? null;
        if (dto.icon !== undefined) category.icon = dto.icon ?? null;
        if (dto.isActive !== undefined) category.isActive = dto.isActive;
        if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;

        const saved = await this.boosterCategoryRepo.save(category);
        return {
            id: saved.id,
            name: saved.name,
            description: saved.description,
            icon: saved.icon,
            isActive: saved.isActive,
            sortOrder: saved.sortOrder
        };
    }

    async adminDeleteCategory(id: string): Promise<void> {
        const category = await this.boosterCategoryRepo.findOneBy({ id });
        if (!category) {
            throw new NotFoundException("Category not found");
        }
        await this.boosterPackRepo.update({ categoryId: id }, { categoryId: null });
        await this.boosterCategoryRepo.remove(category);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private selectRandomCards(
        packCards: BoosterPackCardEntity[],
        count: number,
        guaranteedRarity: string | null
    ): CardEntity[] {
        const result: CardEntity[] = [];
        const available = [...packCards];

        if (guaranteedRarity) {
            const rarityCards = available.filter((pc) => pc.card.rarity === guaranteedRarity);
            if (rarityCards.length > 0) {
                const picked = this.weightedRandom(rarityCards);
                result.push(picked.card);
            }
        }

        while (result.length < count && available.length > 0) {
            const picked = this.weightedRandom(available);
            result.push(picked.card);
        }

        return result;
    }

    private weightedRandom(items: BoosterPackCardEntity[]): BoosterPackCardEntity {
        const totalWeight = items.reduce((sum, item) => sum + item.dropWeight, 0);
        let random = Math.random() * totalWeight;
        for (const item of items) {
            random -= item.dropWeight;
            if (random <= 0) return item;
        }
        return items[items.length - 1];
    }
}
