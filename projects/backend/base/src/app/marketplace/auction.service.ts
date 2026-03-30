import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity } from "../user/entities/user.entity";
import { AuctionQueryDto } from "./dto/auction-query.dto";
import { CreateAuctionDto } from "./dto/create-auction.dto";
import { PlaceBidDto } from "./dto/place-bid.dto";
import { AuctionBidEntity } from "./entities/auction-bid.entity";
import { AuctionWatchEntity } from "./entities/auction-watch.entity";
import { AuctionEntity } from "./entities/auction.entity";
import { MarketCategoryEntity } from "./entities/market-category.entity";
import { MarketListingEntity } from "./entities/market-listing.entity";
import { AuctionBidDto, AuctionDto, AuctionWatchlistDto, PaginatedAuctionResult } from "./models/auction.model";

const SNIPE_PROTECTION_MS = 5 * 60 * 1000;

@Injectable()
export class AuctionService {
    constructor(
        @InjectRepository(AuctionEntity)
        private readonly auctionRepo: Repository<AuctionEntity>,
        @InjectRepository(AuctionBidEntity)
        private readonly bidRepo: Repository<AuctionBidEntity>,
        @InjectRepository(AuctionWatchEntity)
        private readonly watchRepo: Repository<AuctionWatchEntity>,
        @InjectRepository(MarketListingEntity)
        private readonly listingRepo: Repository<MarketListingEntity>,
        @InjectRepository(MarketCategoryEntity)
        private readonly categoryRepo: Repository<MarketCategoryEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    // ─── Queries ───────────────────────────────────────────────────────────────

    async getAuctions(query: AuctionQueryDto): Promise<PaginatedAuctionResult> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const qb = this.auctionRepo.createQueryBuilder("a").where("a.status = :status", {
            status: query.status ?? "active"
        });

        if (query.categoryId) {
            qb.innerJoin(MarketListingEntity, "l", "l.id = a.listing_id").andWhere("l.category_id = :categoryId", {
                categoryId: query.categoryId
            });
        }

        if (query.search) {
            if (!query.categoryId) {
                qb.innerJoin(MarketListingEntity, "l", "l.id = a.listing_id");
            }
            qb.andWhere("(l.title ILIKE :search OR l.description ILIKE :search)", {
                search: `%${query.search}%`
            });
        }

        const total = await qb.getCount();

        switch (query.sort) {
            case "ending-soon":
                qb.orderBy("a.end_time", "ASC");
                break;
            case "price-asc":
                qb.orderBy("a.current_price", "ASC");
                break;
            case "price-desc":
                qb.orderBy("a.current_price", "DESC");
                break;
            case "most-bids":
                qb.orderBy("a.bid_count", "DESC");
                break;
            default:
                qb.orderBy("a.created_at", "DESC");
                break;
        }

        qb.skip(skip).take(limit);
        const auctions = await qb.getMany();
        const data = await Promise.all(auctions.map((a) => this.toAuctionDto(a)));

        return { data, total, page, limit };
    }

    async getAuction(id: string, userId?: string): Promise<AuctionDto> {
        const auction = await this.auctionRepo.findOne({ where: { id } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");
        return this.toAuctionDto(auction, userId);
    }

    async getBidHistory(auctionId: string): Promise<AuctionBidDto[]> {
        const bids = await this.bidRepo.find({
            where: { auctionId },
            order: { createdAt: "DESC" }
        });
        return Promise.all(bids.map((b) => this.toBidDto(b)));
    }

    async getMyAuctions(userId: string): Promise<AuctionDto[]> {
        const listings = await this.listingRepo.find({
            where: { authorId: userId, type: "auction" },
            order: { createdAt: "DESC" }
        });

        const auctions = await Promise.all(
            listings.map((l) => this.auctionRepo.findOne({ where: { listingId: l.id } }))
        );

        return Promise.all(auctions.filter((a): a is AuctionEntity => a !== null).map((a) => this.toAuctionDto(a, userId)));
    }

    async getMyBids(userId: string): Promise<AuctionBidDto[]> {
        const bids = await this.bidRepo.find({
            where: { bidderId: userId },
            order: { createdAt: "DESC" }
        });
        return Promise.all(bids.map((b) => this.toBidDto(b)));
    }

    async getWatchlist(userId: string): Promise<AuctionWatchlistDto[]> {
        const watches = await this.watchRepo.find({
            where: { userId },
            order: { addedAt: "DESC" }
        });

        return Promise.all(
            watches.map(async (w) => {
                const auction = await this.auctionRepo.findOne({ where: { id: w.auctionId } });
                return {
                    auctionId: w.auctionId,
                    auction: auction ? await this.toAuctionDto(auction, userId) : (null as unknown as AuctionDto),
                    addedAt: w.addedAt.toISOString()
                };
            })
        );
    }

    // ─── Mutations ─────────────────────────────────────────────────────────────

    async createAuction(dto: CreateAuctionDto, userId: string): Promise<AuctionDto> {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId, isActive: true } });
        if (!category) throw new NotFoundException("Kategorie nicht gefunden");

        const status = category.requiresApproval ? "pending" : "active";

        const listing = this.listingRepo.create({
            title: dto.title,
            description: dto.description,
            price: dto.startPrice,
            currency: dto.currency ?? "EUR",
            type: "auction" as const,
            status,
            categoryId: dto.categoryId,
            authorId: userId,
            images: dto.images ?? [],
            tags: dto.tags ?? []
        });

        const savedListing = await this.listingRepo.save(listing);

        const now = new Date();
        const endTime = new Date(now.getTime() + dto.durationHours * 60 * 60 * 1000);

        const auction = this.auctionRepo.create({
            listingId: savedListing.id,
            startPrice: dto.startPrice,
            currentPrice: dto.startPrice,
            buyNowPrice: dto.buyNowPrice ?? null,
            currency: dto.currency ?? "EUR",
            bidIncrement: dto.bidIncrement ?? 1.0,
            startTime: now,
            endTime,
            originalEndTime: endTime,
            status: status === "pending" ? "scheduled" : "active",
            bidCount: 0,
            highestBidderId: null,
            watcherCount: 0
        });

        const savedAuction = await this.auctionRepo.save(auction);
        return this.toAuctionDto(savedAuction, userId);
    }

    async placeBid(auctionId: string, dto: PlaceBidDto, userId: string): Promise<AuctionBidDto> {
        const auction = await this.auctionRepo.findOne({ where: { id: auctionId } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");
        if (auction.status !== "active") throw new BadRequestException("Auktion ist nicht aktiv");

        const now = new Date();
        if (now >= auction.endTime) throw new BadRequestException("Auktion ist abgelaufen");

        const listing = await this.listingRepo.findOne({ where: { id: auction.listingId } });
        if (listing && listing.authorId === userId) throw new ForbiddenException("Du kannst nicht auf deine eigene Auktion bieten");

        const minBid = auction.bidCount === 0 ? auction.startPrice : Number(auction.currentPrice) + Number(auction.bidIncrement);

        if (dto.amount < minBid) {
            throw new BadRequestException(`Mindestgebot: ${minBid.toFixed(2)} ${auction.currency}`);
        }

        // Check auto-bid from current highest bidder
        const previousHighBid = auction.highestBidderId
            ? await this.bidRepo.findOne({
                  where: { auctionId, bidderId: auction.highestBidderId },
                  order: { createdAt: "DESC" }
              })
            : null;

        let finalBidAmount = dto.amount;

        if (previousHighBid?.maxAutoBid && Number(previousHighBid.maxAutoBid) >= dto.amount) {
            // Auto-bid counters: previous bidder auto-bids to just above new bid
            const autoBidAmount = Math.min(
                dto.amount + Number(auction.bidIncrement),
                Number(previousHighBid.maxAutoBid)
            );

            const autoBid = this.bidRepo.create({
                auctionId,
                bidderId: previousHighBid.bidderId,
                amount: autoBidAmount,
                maxAutoBid: previousHighBid.maxAutoBid,
                isAutoBid: true
            });
            await this.bidRepo.save(autoBid);

            auction.currentPrice = autoBidAmount;
            auction.bidCount += 1;

            // Notify the new bidder they were outbid
            await this.notificationsService.create(
                userId,
                "system",
                "Überboten",
                `Du wurdest bei "${listing?.title}" überboten`,
                `/marketplace/auctions/${auctionId}`
            );
        } else {
            // New bid wins
            auction.currentPrice = dto.amount;
            auction.highestBidderId = userId;

            // Notify previous highest bidder they were outbid
            if (previousHighBid && previousHighBid.bidderId !== userId) {
                await this.notificationsService.create(
                    previousHighBid.bidderId,
                    "system",
                    "Überboten",
                    `Du wurdest bei "${listing?.title}" überboten`,
                    `/marketplace/auctions/${auctionId}`
                );
            }
        }

        // Create the actual bid
        const bid = this.bidRepo.create({
            auctionId,
            bidderId: userId,
            amount: finalBidAmount,
            maxAutoBid: dto.maxAutoBid ?? null,
            isAutoBid: false
        });
        const savedBid = await this.bidRepo.save(bid);
        auction.bidCount += 1;

        // Snipe protection: extend if bid within last 5 minutes
        const timeLeft = auction.endTime.getTime() - now.getTime();
        if (timeLeft < SNIPE_PROTECTION_MS) {
            auction.endTime = new Date(now.getTime() + SNIPE_PROTECTION_MS);
        }

        await this.auctionRepo.save(auction);

        return this.toBidDto(savedBid);
    }

    async buyNow(auctionId: string, userId: string): Promise<AuctionDto> {
        const auction = await this.auctionRepo.findOne({ where: { id: auctionId } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");
        if (auction.status !== "active") throw new BadRequestException("Auktion ist nicht aktiv");
        if (!auction.buyNowPrice) throw new BadRequestException("Kein Sofort-Kaufen-Preis verfügbar");

        const listing = await this.listingRepo.findOne({ where: { id: auction.listingId } });
        if (listing && listing.authorId === userId) throw new ForbiddenException("Du kannst deine eigene Auktion nicht kaufen");

        auction.status = "ended";
        auction.currentPrice = auction.buyNowPrice;
        auction.highestBidderId = userId;
        await this.auctionRepo.save(auction);

        if (listing) {
            listing.status = "sold";
            await this.listingRepo.save(listing);
        }

        // Notify seller
        if (listing) {
            await this.notificationsService.create(
                listing.authorId,
                "system",
                "Sofort-Kauf",
                `Deine Auktion "${listing.title}" wurde sofort gekauft`,
                `/marketplace/auctions/${auctionId}`
            );
        }

        return this.toAuctionDto(auction, userId);
    }

    async toggleWatch(auctionId: string, userId: string): Promise<{ watched: boolean }> {
        const auction = await this.auctionRepo.findOne({ where: { id: auctionId } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");

        const existing = await this.watchRepo.findOne({ where: { auctionId, userId } });

        if (existing) {
            await this.watchRepo.remove(existing);
            auction.watcherCount = Math.max(0, auction.watcherCount - 1);
            await this.auctionRepo.save(auction);
            return { watched: false };
        }

        const watch = this.watchRepo.create({ auctionId, userId });
        await this.watchRepo.save(watch);
        auction.watcherCount += 1;
        await this.auctionRepo.save(auction);
        return { watched: true };
    }

    async cancelAuction(auctionId: string, userId: string): Promise<AuctionDto> {
        const auction = await this.auctionRepo.findOne({ where: { id: auctionId } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");

        const listing = await this.listingRepo.findOne({ where: { id: auction.listingId } });
        if (!listing || listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");
        if (auction.bidCount > 0) throw new BadRequestException("Auktionen mit Geboten können nicht abgebrochen werden");

        auction.status = "cancelled";
        await this.auctionRepo.save(auction);

        listing.status = "closed";
        await this.listingRepo.save(listing);

        return this.toAuctionDto(auction, userId);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    async getPendingAuctions(): Promise<AuctionDto[]> {
        const auctions = await this.auctionRepo.find({
            where: { status: "scheduled" },
            order: { createdAt: "ASC" }
        });
        return Promise.all(auctions.map((a) => this.toAuctionDto(a)));
    }

    async approveAuction(id: string): Promise<AuctionDto> {
        const auction = await this.auctionRepo.findOne({ where: { id } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");

        const now = new Date();
        const durationMs = auction.originalEndTime.getTime() - auction.startTime.getTime();

        auction.status = "active";
        auction.startTime = now;
        auction.endTime = new Date(now.getTime() + durationMs);
        auction.originalEndTime = auction.endTime;
        await this.auctionRepo.save(auction);

        const listing = await this.listingRepo.findOne({ where: { id: auction.listingId } });
        if (listing) {
            listing.status = "active";
            await this.listingRepo.save(listing);

            await this.notificationsService.create(
                listing.authorId,
                "system",
                "Auktion genehmigt",
                `Deine Auktion "${listing.title}" wurde genehmigt und ist jetzt aktiv`,
                `/marketplace/auctions/${id}`
            );
        }

        return this.toAuctionDto(auction);
    }

    async rejectAuction(id: string, reason: string): Promise<AuctionDto> {
        const auction = await this.auctionRepo.findOne({ where: { id } });
        if (!auction) throw new NotFoundException("Auktion nicht gefunden");

        auction.status = "cancelled";
        await this.auctionRepo.save(auction);

        const listing = await this.listingRepo.findOne({ where: { id: auction.listingId } });
        if (listing) {
            listing.status = "archived";
            await this.listingRepo.save(listing);

            await this.notificationsService.create(
                listing.authorId,
                "system",
                "Auktion abgelehnt",
                `Deine Auktion "${listing.title}" wurde abgelehnt: ${reason}`,
                `/marketplace/auctions/${id}`
            );
        }

        return this.toAuctionDto(auction);
    }

    // ─── DTO Mapping ───────────────────────────────────────────────────────────

    private async toAuctionDto(auction: AuctionEntity, userId?: string): Promise<AuctionDto> {
        const listing = await this.listingRepo.findOne({ where: { id: auction.listingId } });
        const [author, category] = await Promise.all([
            listing ? this.userRepo.findOne({ where: { id: listing.authorId } }) : null,
            listing ? this.categoryRepo.findOne({ where: { id: listing.categoryId } }) : null
        ]);

        const highestBidder = auction.highestBidderId
            ? await this.userRepo.findOne({ where: { id: auction.highestBidderId } })
            : null;

        let isWatched = false;
        let hasUserBid = false;
        let userMaxBid: number | null = null;

        if (userId) {
            const watch = await this.watchRepo.findOne({ where: { auctionId: auction.id, userId } });
            isWatched = !!watch;

            const userBid = await this.bidRepo.findOne({
                where: { auctionId: auction.id, bidderId: userId },
                order: { createdAt: "DESC" }
            });
            hasUserBid = !!userBid;
            userMaxBid = userBid?.maxAutoBid ? Number(userBid.maxAutoBid) : null;
        }

        return {
            id: auction.id,
            listingId: auction.listingId,
            listing: {
                id: listing?.id ?? "",
                title: listing?.title ?? "Unbekannt",
                description: listing?.description ?? "",
                price: listing?.price ?? null,
                currency: listing?.currency ?? "EUR",
                type: listing?.type ?? "auction",
                status: listing?.status ?? "active",
                categoryId: listing?.categoryId ?? "",
                categoryName: category?.name ?? "Unbekannt",
                authorId: listing?.authorId ?? "",
                authorName: author ? author.displayName || author.username : "Unbekannt",
                authorAvatarUrl: author?.avatarUrl ?? null,
                images: listing?.images ?? [],
                customFields: listing?.customFields ?? null,
                tags: listing?.tags ?? [],
                expiresAt: listing?.expiresAt ? listing.expiresAt.toISOString() : null,
                viewCount: listing?.viewCount ?? 0,
                offerCount: listing?.offerCount ?? 0,
                commentCount: listing?.commentCount ?? 0,
                bestOfferId: listing?.bestOfferId ?? null,
                createdAt: listing?.createdAt ? listing.createdAt.toISOString() : new Date().toISOString(),
                updatedAt: listing?.updatedAt ? listing.updatedAt.toISOString() : new Date().toISOString()
            },
            startPrice: Number(auction.startPrice),
            currentPrice: Number(auction.currentPrice),
            buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
            currency: auction.currency,
            bidIncrement: Number(auction.bidIncrement),
            startTime: auction.startTime.toISOString(),
            endTime: auction.endTime.toISOString(),
            originalEndTime: auction.originalEndTime.toISOString(),
            status: auction.status,
            bidCount: auction.bidCount,
            highestBidderId: auction.highestBidderId,
            highestBidderName: highestBidder ? highestBidder.displayName || highestBidder.username : null,
            watcherCount: auction.watcherCount,
            isWatched,
            hasUserBid,
            userMaxBid,
            createdAt: auction.createdAt.toISOString(),
            updatedAt: auction.updatedAt.toISOString()
        };
    }

    private async toBidDto(bid: AuctionBidEntity): Promise<AuctionBidDto> {
        const bidder = await this.userRepo.findOne({ where: { id: bid.bidderId } });

        return {
            id: bid.id,
            auctionId: bid.auctionId,
            bidderId: bid.bidderId,
            bidderName: bidder ? bidder.displayName || bidder.username : "Unbekannt",
            bidderAvatarUrl: bidder?.avatarUrl ?? null,
            amount: Number(bid.amount),
            isAutoBid: bid.isAutoBid,
            createdAt: bid.createdAt.toISOString()
        };
    }
}
