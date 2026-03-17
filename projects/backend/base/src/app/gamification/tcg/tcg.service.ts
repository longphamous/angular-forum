import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreditService } from "../../credit/credit.service";
import { UserEntity } from "../../user/entities/user.entity";
import { BoosterPackEntity } from "./entities/booster-pack.entity";
import { BoosterPackCardEntity } from "./entities/booster-pack-card.entity";
import { CardEntity } from "./entities/card.entity";
import { CardListingEntity } from "./entities/card-listing.entity";
import { UserBoosterEntity } from "./entities/user-booster.entity";
import { UserCardEntity } from "./entities/user-card.entity";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type CardElement = "fire" | "water" | "earth" | "wind" | "light" | "dark" | "neutral";

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

export interface BoosterPackDto {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    cardsPerPack: number;
    guaranteedRarity: CardRarity | null;
    series: string;
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
    availableFrom?: string;
    availableUntil?: string;
    maxPurchasesPerUser?: number;
    sortOrder?: number;
}

export interface UpdateBoosterPackDto extends Partial<CreateBoosterPackDto> {
    isActive?: boolean;
}

export interface AdminBoosterDetailDto extends BoosterPackDto {
    cards: { cardId: string; cardName: string; cardRarity: CardRarity; dropWeight: number }[];
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

function toBoosterPackDto(entity: BoosterPackEntity, totalCards: number, userPurchases?: number): BoosterPackDto {
    const dto: BoosterPackDto = {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        imageUrl: entity.imageUrl,
        price: entity.price,
        cardsPerPack: entity.cardsPerPack,
        guaranteedRarity: entity.guaranteedRarity as CardRarity | null,
        series: entity.series,
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
export class TcgService {
    constructor(
        @InjectRepository(CardEntity)
        private readonly cardRepo: Repository<CardEntity>,
        @InjectRepository(BoosterPackEntity)
        private readonly boosterPackRepo: Repository<BoosterPackEntity>,
        @InjectRepository(BoosterPackCardEntity)
        private readonly boosterPackCardRepo: Repository<BoosterPackCardEntity>,
        @InjectRepository(UserCardEntity)
        private readonly userCardRepo: Repository<UserCardEntity>,
        @InjectRepository(UserBoosterEntity)
        private readonly userBoosterRepo: Repository<UserBoosterEntity>,
        @InjectRepository(CardListingEntity)
        private readonly cardListingRepo: Repository<CardListingEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly creditService: CreditService
    ) {}

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

            // Series
            const seriesEntry = seriesMap.get(card.series) ?? { total: 0, owned: 0 };
            seriesEntry.total += 1;
            if (ownedCardIds.has(card.id)) {
                seriesEntry.owned += 1;
            }
            seriesMap.set(card.series, seriesEntry);

            // Rarity
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
    }

    // ─── Marketplace ──────────────────────────────────────────────────────────

    async getActiveListings(): Promise<CardListingDto[]> {
        const listings = await this.cardListingRepo.find({
            where: { status: "active" },
            relations: ["card"],
            order: { createdAt: "DESC" }
        });

        const userIds = [...new Set(listings.map((l) => l.userId))];
        const users = userIds.length > 0 ? await this.userRepo.findByIds(userIds) : [];
        const userMap = new Map<string, string>();
        for (const user of users) {
            userMap.set(user.id, user.displayName);
        }

        return listings.map((l) => ({
            id: l.id,
            userId: l.userId,
            sellerName: userMap.get(l.userId) ?? "Unknown",
            cardId: l.cardId,
            card: toCardDto(l.card),
            price: l.price,
            quantity: l.quantity,
            status: l.status,
            createdAt: l.createdAt.toISOString()
        }));
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

        userCard.quantity -= quantity;
        if (userCard.quantity === 0) {
            await this.userCardRepo.remove(userCard);
        } else {
            await this.userCardRepo.save(userCard);
        }

        const listing = this.cardListingRepo.create({
            userId,
            cardId,
            price,
            quantity,
            status: "active"
        });
        const saved = await this.cardListingRepo.save(listing);

        const card = userCard.card;
        const user = await this.userRepo.findOneBy({ id: userId });

        return {
            id: saved.id,
            userId: saved.userId,
            sellerName: user?.displayName ?? "Unknown",
            cardId: saved.cardId,
            card: toCardDto(card),
            price: saved.price,
            quantity: saved.quantity,
            status: saved.status,
            createdAt: saved.createdAt.toISOString()
        };
    }

    async cancelListing(userId: string, listingId: string): Promise<void> {
        const listing = await this.cardListingRepo.findOne({
            where: { id: listingId, userId }
        });
        if (!listing) {
            throw new NotFoundException("Listing not found");
        }
        if (listing.status !== "active") {
            throw new BadRequestException("Listing is not active");
        }

        listing.status = "cancelled";
        await this.cardListingRepo.save(listing);

        // Return cards to user
        const userCard = await this.userCardRepo.findOne({
            where: { userId, cardId: listing.cardId }
        });
        if (userCard) {
            userCard.quantity += listing.quantity;
            await this.userCardRepo.save(userCard);
        } else {
            const newCard = this.userCardRepo.create({
                userId,
                cardId: listing.cardId,
                quantity: listing.quantity
            });
            await this.userCardRepo.save(newCard);
        }
    }

    async buyListing(buyerId: string, listingId: string): Promise<CardListingDto> {
        const listing = await this.cardListingRepo.findOne({
            where: { id: listingId },
            relations: ["card"]
        });
        if (!listing) {
            throw new NotFoundException("Listing not found");
        }
        if (listing.status !== "active") {
            throw new BadRequestException("Listing is no longer active");
        }
        if (listing.userId === buyerId) {
            throw new BadRequestException("You cannot buy your own listing");
        }

        // Deduct coins from buyer
        await this.creditService.deductCredits(
            buyerId,
            listing.price,
            "tcg_card_buy",
            `Purchased card listing: ${listing.card.name} x${listing.quantity}`
        );

        // Add coins to seller
        await this.creditService.addCredits(
            listing.userId,
            listing.price,
            "tcg_card_sell",
            `Sold card: ${listing.card.name} x${listing.quantity}`
        );

        // Transfer cards to buyer
        const buyerCard = await this.userCardRepo.findOne({
            where: { userId: buyerId, cardId: listing.cardId }
        });
        if (buyerCard) {
            buyerCard.quantity += listing.quantity;
            await this.userCardRepo.save(buyerCard);
        } else {
            const newCard = this.userCardRepo.create({
                userId: buyerId,
                cardId: listing.cardId,
                quantity: listing.quantity
            });
            await this.userCardRepo.save(newCard);
        }

        listing.status = "sold";
        listing.buyerId = buyerId;
        const saved = await this.cardListingRepo.save(listing);

        const seller = await this.userRepo.findOneBy({ id: listing.userId });

        return {
            id: saved.id,
            userId: saved.userId,
            sellerName: seller?.displayName ?? "Unknown",
            cardId: saved.cardId,
            card: toCardDto(saved.card),
            price: saved.price,
            quantity: saved.quantity,
            status: saved.status,
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
            availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
            availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
            maxPurchasesPerUser: dto.maxPurchasesPerUser ?? null,
            sortOrder: dto.sortOrder ?? 0
        });
        const saved = await this.boosterPackRepo.save(booster);
        return toBoosterPackDto(saved, 0);
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

    // ─── Private helpers ──────────────────────────────────────────────────────

    private selectRandomCards(
        packCards: BoosterPackCardEntity[],
        count: number,
        guaranteedRarity: string | null
    ): CardEntity[] {
        const result: CardEntity[] = [];
        const available = [...packCards];

        // If guaranteed rarity, pick one card of that rarity first
        if (guaranteedRarity) {
            const rarityCards = available.filter((pc) => pc.card.rarity === guaranteedRarity);
            if (rarityCards.length > 0) {
                const picked = this.weightedRandom(rarityCards);
                result.push(picked.card);
                // Don't remove from pool - can get duplicates
            }
        }

        // Fill remaining slots with weighted random
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
