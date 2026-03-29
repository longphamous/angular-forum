import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity } from "../user/entities/user.entity";
import { MarketCategoryEntity } from "./entities/market-category.entity";
import { MarketCommentEntity } from "./entities/market-comment.entity";
import { MarketListingEntity } from "./entities/market-listing.entity";
import { MarketOfferEntity } from "./entities/market-offer.entity";
import { MarketRatingEntity } from "./entities/market-rating.entity";
import { MarketReportEntity } from "./entities/market-report.entity";
import {
    ActionReportDto,
    CounterOfferDto,
    CreateCommentDto,
    CreateListingDto,
    CreateOfferDto,
    CreateRatingDto,
    ListingsQueryDto,
    MarketCategoryDto,
    MarketCommentDto,
    MarketListingDto,
    MarketOfferDto,
    MarketRatingDto,
    MarketReportDto,
    PaginatedResult,
    ReportListingDto,
    UpdateListingDto
} from "./models/marketplace.model";

@Injectable()
export class MarketplaceService {
    constructor(
        @InjectRepository(MarketCategoryEntity)
        private readonly categoryRepo: Repository<MarketCategoryEntity>,
        @InjectRepository(MarketListingEntity)
        private readonly listingRepo: Repository<MarketListingEntity>,
        @InjectRepository(MarketOfferEntity)
        private readonly offerRepo: Repository<MarketOfferEntity>,
        @InjectRepository(MarketCommentEntity)
        private readonly commentRepo: Repository<MarketCommentEntity>,
        @InjectRepository(MarketRatingEntity)
        private readonly ratingRepo: Repository<MarketRatingEntity>,
        @InjectRepository(MarketReportEntity)
        private readonly reportRepo: Repository<MarketReportEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    // ─── Categories ────────────────────────────────────────────────────────────

    async getCategories(): Promise<MarketCategoryDto[]> {
        const categories = await this.categoryRepo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC" }
        });

        const dtos: MarketCategoryDto[] = categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            parentId: c.parentId,
            icon: c.icon,
            sortOrder: c.sortOrder,
            requiresApproval: c.requiresApproval,
            isActive: c.isActive,
            children: []
        }));

        const map = new Map<string, MarketCategoryDto>(dtos.map((d) => [d.id, d]));
        const roots: MarketCategoryDto[] = [];

        for (const dto of dtos) {
            if (dto.parentId && map.has(dto.parentId)) {
                const parent = map.get(dto.parentId)!;
                if (!parent.children) parent.children = [];
                parent.children.push(dto);
            } else {
                roots.push(dto);
            }
        }

        return roots;
    }

    // ─── Listings ──────────────────────────────────────────────────────────────

    async getListings(query: ListingsQueryDto): Promise<PaginatedResult<MarketListingDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const qb = this.listingRepo
            .createQueryBuilder("l")
            .where("l.deleted_at IS NULL")
            .andWhere("l.status = :status", { status: query.status ?? "active" });

        if (query.categoryId) {
            qb.andWhere("l.category_id = :categoryId", { categoryId: query.categoryId });
        }

        if (query.type) {
            qb.andWhere("l.type = :type", { type: query.type });
        }

        if (query.search) {
            qb.andWhere("(l.title ILIKE :search OR l.description ILIKE :search)", {
                search: `%${query.search}%`
            });
        }

        const total = await qb.getCount();

        qb.orderBy("l.createdAt", "DESC").skip(skip).take(limit);

        const listings = await qb.getMany();
        const data = await Promise.all(listings.map((l) => this.toListingDto(l)));

        return { data, total, page, limit };
    }

    async getMyListings(userId: string): Promise<MarketListingDto[]> {
        const listings = await this.listingRepo.find({
            where: { authorId: userId, deletedAt: IsNull() },
            order: { createdAt: "DESC" }
        });
        return Promise.all(listings.map((l) => this.toListingDto(l)));
    }

    async getListing(id: string, userId?: string): Promise<MarketListingDto> {
        const listing = await this.listingRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");

        if (userId && userId !== listing.authorId) {
            await this.listingRepo.increment({ id }, "viewCount", 1);
            listing.viewCount += 1;
        }

        return this.toListingDto(listing);
    }

    async createListing(dto: CreateListingDto, userId: string): Promise<MarketListingDto> {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId, isActive: true } });
        if (!category) throw new NotFoundException("Kategorie nicht gefunden");

        const status = category.requiresApproval ? "pending" : "active";

        const listing = this.listingRepo.create({
            title: dto.title,
            description: dto.description,
            price: dto.price ?? null,
            currency: dto.currency ?? "EUR",
            type: dto.type,
            status,
            categoryId: dto.categoryId,
            authorId: userId,
            images: dto.images ?? [],
            tags: dto.tags ?? [],
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            customFields: dto.customFields ?? null
        });

        const saved = await this.listingRepo.save(listing);

        if (category.requiresApproval) {
            await this.notificationsService.create(
                userId,
                "system",
                "Inserat eingereicht",
                "Dein Inserat wird geprüft",
                `/marketplace/${saved.id}`
            );
        }

        return this.toListingDto(saved);
    }

    async updateListing(id: string, dto: UpdateListingDto, userId: string): Promise<MarketListingDto> {
        const listing = await this.listingRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");
        if (listing.status !== "draft" && listing.status !== "active") {
            throw new BadRequestException("Nur Entwürfe und aktive Inserate können bearbeitet werden");
        }

        if (dto.title !== undefined) listing.title = dto.title;
        if (dto.description !== undefined) listing.description = dto.description;
        if (dto.price !== undefined) listing.price = dto.price ?? null;
        if (dto.currency !== undefined) listing.currency = dto.currency;
        if (dto.categoryId !== undefined) listing.categoryId = dto.categoryId;
        if (dto.images !== undefined) listing.images = dto.images;
        if (dto.tags !== undefined) listing.tags = dto.tags;
        if (dto.expiresAt !== undefined) listing.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (dto.customFields !== undefined) listing.customFields = dto.customFields ?? null;

        const saved = await this.listingRepo.save(listing);
        return this.toListingDto(saved);
    }

    async deleteListing(id: string, userId: string): Promise<void> {
        const listing = await this.listingRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");
        await this.listingRepo.softDelete(id);
    }

    async closeListing(id: string, userId: string): Promise<MarketListingDto> {
        const listing = await this.listingRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");

        listing.status = "closed";
        const saved = await this.listingRepo.save(listing);

        // Reject all pending offers
        await this.offerRepo
            .createQueryBuilder()
            .update(MarketOfferEntity)
            .set({ status: "rejected" })
            .where("listing_id = :id AND status = :status", { id, status: "pending" })
            .execute();

        return this.toListingDto(saved);
    }

    // ─── Offers ────────────────────────────────────────────────────────────────

    async getOffers(listingId: string, userId: string): Promise<MarketOfferDto[]> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");

        const isOwner = listing.authorId === userId;
        const offers = await this.offerRepo.find({
            where: isOwner ? { listingId } : { listingId, senderId: userId },
            order: { createdAt: "DESC" }
        });

        return Promise.all(offers.map((o) => this.toOfferDto(o)));
    }

    async getMyOffers(userId: string): Promise<MarketOfferDto[]> {
        const offers = await this.offerRepo.find({
            where: { senderId: userId },
            order: { createdAt: "DESC" }
        });
        return Promise.all(offers.map((o) => this.toOfferDto(o)));
    }

    async sendOffer(listingId: string, dto: CreateOfferDto, userId: string): Promise<MarketOfferDto> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.status !== "active") throw new BadRequestException("Das Inserat ist nicht aktiv");
        if (listing.authorId === userId)
            throw new ForbiddenException("Du kannst kein Angebot auf dein eigenes Inserat machen");

        const existing = await this.offerRepo.findOne({ where: { listingId, senderId: userId, status: "pending" } });

        let offer: MarketOfferEntity;
        if (existing) {
            existing.amount = dto.amount ?? null;
            existing.message = dto.message;
            offer = await this.offerRepo.save(existing);
        } else {
            offer = await this.offerRepo.save(
                this.offerRepo.create({
                    listingId,
                    senderId: userId,
                    amount: dto.amount ?? null,
                    message: dto.message,
                    status: "pending"
                })
            );
            await this.listingRepo.increment({ id: listingId }, "offerCount", 1);
        }

        const sender = await this.userRepo.findOne({ where: { id: userId } });
        const senderName = sender ? sender.displayName || sender.username : "Unbekannt";

        await this.notificationsService.create(
            listing.authorId,
            "system",
            "Neues Angebot",
            `${senderName} hat ein Angebot auf "${listing.title}" gesendet`,
            `/marketplace/${listingId}`
        );

        return this.toOfferDto(offer);
    }

    async acceptOffer(listingId: string, offerId: string, userId: string): Promise<MarketOfferDto> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");

        const offer = await this.offerRepo.findOne({ where: { id: offerId, listingId } });
        if (!offer) throw new NotFoundException("Angebot nicht gefunden");

        offer.status = "accepted";
        const saved = await this.offerRepo.save(offer);

        listing.status = "sold";
        listing.bestOfferId = offerId;
        await this.listingRepo.save(listing);

        // Reject all other pending offers
        await this.offerRepo
            .createQueryBuilder()
            .update(MarketOfferEntity)
            .set({ status: "rejected" })
            .where("listing_id = :listingId AND id != :offerId AND status = :status", {
                listingId,
                offerId,
                status: "pending"
            })
            .execute();

        await this.notificationsService.create(
            offer.senderId,
            "system",
            "Angebot akzeptiert",
            "Dein Angebot wurde akzeptiert!",
            `/marketplace/${listingId}`
        );

        return this.toOfferDto(saved);
    }

    async rejectOffer(listingId: string, offerId: string, userId: string): Promise<MarketOfferDto> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");

        const offer = await this.offerRepo.findOne({ where: { id: offerId, listingId } });
        if (!offer) throw new NotFoundException("Angebot nicht gefunden");

        offer.status = "rejected";
        const saved = await this.offerRepo.save(offer);

        await this.notificationsService.create(
            offer.senderId,
            "system",
            "Angebot abgelehnt",
            `Dein Angebot auf "${listing.title}" wurde abgelehnt`,
            `/marketplace/${listingId}`
        );

        return this.toOfferDto(saved);
    }

    async counterOffer(
        listingId: string,
        offerId: string,
        dto: CounterOfferDto,
        userId: string
    ): Promise<MarketOfferDto> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.authorId !== userId) throw new ForbiddenException("Kein Zugriff");

        const offer = await this.offerRepo.findOne({ where: { id: offerId, listingId } });
        if (!offer) throw new NotFoundException("Angebot nicht gefunden");

        offer.status = "countered";
        offer.counterAmount = dto.counterAmount ?? null;
        offer.counterMessage = dto.counterMessage;
        const saved = await this.offerRepo.save(offer);

        await this.notificationsService.create(
            offer.senderId,
            "system",
            "Gegenangebot erhalten",
            `Du hast ein Gegenangebot für "${listing.title}" erhalten`,
            `/marketplace/${listingId}`
        );

        return this.toOfferDto(saved);
    }

    async withdrawOffer(listingId: string, offerId: string, userId: string): Promise<void> {
        const offer = await this.offerRepo.findOne({ where: { id: offerId, listingId, senderId: userId } });
        if (!offer) throw new NotFoundException("Angebot nicht gefunden");

        offer.status = "withdrawn";
        await this.offerRepo.save(offer);

        const currentListing = await this.listingRepo.findOne({ where: { id: listingId } });
        if (currentListing && currentListing.offerCount > 0) {
            await this.listingRepo.update(listingId, {
                offerCount: currentListing.offerCount - 1
            });
        }
    }

    // ─── Comments ──────────────────────────────────────────────────────────────

    async getComments(listingId: string): Promise<MarketCommentDto[]> {
        const comments = await this.commentRepo.find({
            where: { listingId },
            order: { createdAt: "ASC" }
        });

        const dtos = await Promise.all(comments.map((c) => this.toCommentDto(c)));

        const map = new Map<string, MarketCommentDto>(dtos.map((d) => [d.id, d]));
        const roots: MarketCommentDto[] = [];

        for (const dto of dtos) {
            if (dto.parentId && map.has(dto.parentId)) {
                const parent = map.get(dto.parentId)!;
                if (!parent.replies) parent.replies = [];
                parent.replies.push(dto);
            } else {
                roots.push(dto);
            }
        }

        return roots;
    }

    async addComment(listingId: string, dto: CreateCommentDto, userId: string): Promise<MarketCommentDto> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");

        const comment = await this.commentRepo.save(
            this.commentRepo.create({
                listingId,
                authorId: userId,
                content: dto.content,
                parentId: dto.parentId ?? null
            })
        );

        await this.listingRepo.increment({ id: listingId }, "commentCount", 1);

        if (listing.authorId !== userId) {
            const author = await this.userRepo.findOne({ where: { id: userId } });
            const authorName = author ? author.displayName || author.username : "Unbekannt";
            await this.notificationsService.create(
                listing.authorId,
                "system",
                "Neuer Kommentar",
                `${authorName} hat einen Kommentar auf "${listing.title}" hinterlassen`,
                `/marketplace/${listingId}`
            );
        }

        return this.toCommentDto(comment);
    }

    async updateComment(
        listingId: string,
        commentId: string,
        userId: string,
        isAdmin: boolean,
        content: string
    ): Promise<MarketCommentDto> {
        const comment = await this.commentRepo.findOne({ where: { id: commentId, listingId } });
        if (!comment) throw new NotFoundException("Kommentar nicht gefunden");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Kein Zugriff");
        comment.content = content;
        comment.isEdited = true;
        const saved = await this.commentRepo.save(comment);
        return this.toCommentDto(saved);
    }

    async deleteComment(listingId: string, commentId: string, userId: string): Promise<void> {
        const comment = await this.commentRepo.findOne({ where: { id: commentId, listingId } });
        if (!comment) throw new NotFoundException("Kommentar nicht gefunden");
        if (comment.authorId !== userId) throw new ForbiddenException("Kein Zugriff");

        await this.commentRepo.delete(commentId);

        const currentListing = await this.listingRepo.findOne({ where: { id: listingId } });
        if (currentListing && currentListing.commentCount > 0) {
            await this.listingRepo.update(listingId, {
                commentCount: currentListing.commentCount - 1
            });
        }
    }

    // ─── Ratings ───────────────────────────────────────────────────────────────

    async getRatings(listingId: string): Promise<MarketRatingDto[]> {
        const ratings = await this.ratingRepo.find({
            where: { listingId },
            order: { createdAt: "DESC" }
        });
        return Promise.all(ratings.map((r) => this.toRatingDto(r)));
    }

    async submitRating(listingId: string, dto: CreateRatingDto, userId: string): Promise<MarketRatingDto> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");
        if (listing.status !== "sold")
            throw new BadRequestException("Nur abgeschlossene Inserate können bewertet werden");

        const offer = await this.offerRepo.findOne({ where: { id: dto.offerId, listingId } });
        if (!offer) throw new NotFoundException("Angebot nicht gefunden");

        const isParticipant = offer.senderId === userId || listing.authorId === userId;
        if (!isParticipant) throw new ForbiddenException("Nur Teilnehmer können bewerten");

        const alreadyRated = await this.ratingRepo.findOne({
            where: { listingId, offerId: dto.offerId, raterId: userId }
        });
        if (alreadyRated) throw new BadRequestException("Du hast bereits bewertet");

        if (dto.score < 1 || dto.score > 5) throw new BadRequestException("Bewertung muss zwischen 1 und 5 liegen");

        const rating = await this.ratingRepo.save(
            this.ratingRepo.create({
                listingId,
                offerId: dto.offerId,
                raterId: userId,
                ratedUserId: dto.ratedUserId,
                score: dto.score,
                text: dto.text ?? null
            })
        );

        return this.toRatingDto(rating);
    }

    // ─── Reports ───────────────────────────────────────────────────────────────

    async reportListing(listingId: string, dto: ReportListingDto, userId: string): Promise<void> {
        const listing = await this.listingRepo.findOne({ where: { id: listingId, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");

        await this.reportRepo.save(
            this.reportRepo.create({
                listingId,
                reporterId: userId,
                reason: dto.reason,
                status: "pending"
            })
        );
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    async getPendingListings(): Promise<MarketListingDto[]> {
        const listings = await this.listingRepo.find({
            where: { status: "pending", deletedAt: IsNull() },
            order: { createdAt: "ASC" }
        });
        return Promise.all(listings.map((l) => this.toListingDto(l)));
    }

    async approveListing(id: string): Promise<MarketListingDto> {
        const listing = await this.listingRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");

        listing.status = "active";
        const saved = await this.listingRepo.save(listing);

        await this.notificationsService.create(
            listing.authorId,
            "system",
            "Inserat genehmigt",
            `Dein Inserat "${listing.title}" wurde genehmigt und ist jetzt aktiv`,
            `/marketplace/${id}`
        );

        return this.toListingDto(saved);
    }

    async rejectListingAdmin(id: string, reason: string): Promise<MarketListingDto> {
        const listing = await this.listingRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!listing) throw new NotFoundException("Inserat nicht gefunden");

        listing.status = "archived";
        const saved = await this.listingRepo.save(listing);

        await this.notificationsService.create(
            listing.authorId,
            "system",
            "Inserat abgelehnt",
            `Dein Inserat "${listing.title}" wurde abgelehnt. Grund: ${reason}`,
            `/marketplace/${id}`
        );

        return this.toListingDto(saved);
    }

    async getPendingReports(): Promise<MarketReportDto[]> {
        const reports = await this.reportRepo.find({
            where: { status: "pending" },
            order: { createdAt: "ASC" }
        });
        return Promise.all(reports.map((r) => this.toReportDto(r)));
    }

    async actionReport(id: string, dto: ActionReportDto): Promise<MarketReportDto> {
        const report = await this.reportRepo.findOne({ where: { id } });
        if (!report) throw new NotFoundException("Meldung nicht gefunden");

        report.status = dto.status;
        report.moderatorNote = dto.moderatorNote ?? null;
        const saved = await this.reportRepo.save(report);

        return this.toReportDto(saved);
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private async toListingDto(listing: MarketListingEntity): Promise<MarketListingDto> {
        const [author, category] = await Promise.all([
            this.userRepo.findOne({ where: { id: listing.authorId } }),
            this.categoryRepo.findOne({ where: { id: listing.categoryId } })
        ]);

        return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price,
            currency: listing.currency,
            type: listing.type,
            status: listing.status,
            categoryId: listing.categoryId,
            categoryName: category?.name ?? "Unbekannt",
            authorId: listing.authorId,
            authorName: author ? author.displayName || author.username : "Unbekannt",
            authorAvatarUrl: author?.avatarUrl ?? null,
            images: listing.images,
            customFields: listing.customFields,
            tags: listing.tags,
            expiresAt: listing.expiresAt ? listing.expiresAt.toISOString() : null,
            viewCount: listing.viewCount,
            offerCount: listing.offerCount,
            commentCount: listing.commentCount,
            bestOfferId: listing.bestOfferId,
            createdAt: listing.createdAt.toISOString(),
            updatedAt: listing.updatedAt.toISOString()
        };
    }

    private async toOfferDto(offer: MarketOfferEntity): Promise<MarketOfferDto> {
        const sender = await this.userRepo.findOne({ where: { id: offer.senderId } });

        return {
            id: offer.id,
            listingId: offer.listingId,
            senderId: offer.senderId,
            senderName: sender ? sender.displayName || sender.username : "Unbekannt",
            senderAvatarUrl: sender?.avatarUrl ?? null,
            amount: offer.amount,
            message: offer.message,
            status: offer.status,
            counterAmount: offer.counterAmount,
            counterMessage: offer.counterMessage,
            createdAt: offer.createdAt.toISOString(),
            updatedAt: offer.updatedAt.toISOString()
        };
    }

    private async toCommentDto(comment: MarketCommentEntity): Promise<MarketCommentDto> {
        const author = await this.userRepo.findOne({ where: { id: comment.authorId } });

        return {
            id: comment.id,
            listingId: comment.listingId,
            authorId: comment.authorId,
            authorName: author ? author.displayName || author.username : "Unbekannt",
            authorAvatarUrl: author?.avatarUrl ?? null,
            content: comment.content,
            parentId: comment.parentId,
            isEdited: comment.isEdited,
            replies: [],
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        };
    }

    private async toRatingDto(rating: MarketRatingEntity): Promise<MarketRatingDto> {
        const rater = await this.userRepo.findOne({ where: { id: rating.raterId } });

        return {
            id: rating.id,
            listingId: rating.listingId,
            offerId: rating.offerId,
            raterId: rating.raterId,
            raterName: rater ? rater.displayName || rater.username : "Unbekannt",
            raterAvatarUrl: rater?.avatarUrl ?? null,
            ratedUserId: rating.ratedUserId,
            score: rating.score,
            text: rating.text,
            reply: rating.reply,
            createdAt: rating.createdAt.toISOString()
        };
    }

    private async toReportDto(report: MarketReportEntity): Promise<MarketReportDto> {
        const listing = await this.listingRepo.findOne({ where: { id: report.listingId } });

        return {
            id: report.id,
            listingId: report.listingId,
            listingTitle: listing?.title ?? "Unbekannt",
            reporterId: report.reporterId,
            reason: report.reason,
            status: report.status,
            moderatorNote: report.moderatorNote,
            createdAt: report.createdAt.toISOString(),
            updatedAt: report.updatedAt.toISOString()
        };
    }
}
