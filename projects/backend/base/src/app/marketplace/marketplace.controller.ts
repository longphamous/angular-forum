import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { MarketplaceService } from "./marketplace.service";
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

@Controller("marketplace")
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) {}

    // ─── Categories ────────────────────────────────────────────────────────────

    @Get("categories")
    getCategories(): Promise<MarketCategoryDto[]> {
        return this.marketplaceService.getCategories();
    }

    // ─── Listings ──────────────────────────────────────────────────────────────

    @Get("listings")
    getListings(@Query() query: ListingsQueryDto): Promise<PaginatedResult<MarketListingDto>> {
        return this.marketplaceService.getListings(query);
    }

    @Get("listings/my")
    getMyListings(@CurrentUser() user: AuthenticatedUser): Promise<MarketListingDto[]> {
        return this.marketplaceService.getMyListings(user.userId);
    }

    @Get("listings/my-offers")
    getMyOffers(@CurrentUser() user: AuthenticatedUser): Promise<MarketOfferDto[]> {
        return this.marketplaceService.getMyOffers(user.userId);
    }

    @Get("listings/:id")
    getListing(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketListingDto> {
        return this.marketplaceService.getListing(id, user.userId);
    }

    @Post("listings")
    createListing(@Body() dto: CreateListingDto, @CurrentUser() user: AuthenticatedUser): Promise<MarketListingDto> {
        return this.marketplaceService.createListing(dto, user.userId);
    }

    @Patch("listings/:id")
    updateListing(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateListingDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketListingDto> {
        return this.marketplaceService.updateListing(id, dto, user.userId);
    }

    @Delete("listings/:id")
    async deleteListing(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.marketplaceService.deleteListing(id, user.userId);
        return { success: true };
    }

    @Post("listings/:id/close")
    closeListing(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketListingDto> {
        return this.marketplaceService.closeListing(id, user.userId);
    }

    // ─── Offers ────────────────────────────────────────────────────────────────

    @Get("listings/:id/offers")
    getOffers(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketOfferDto[]> {
        return this.marketplaceService.getOffers(id, user.userId);
    }

    @Post("listings/:id/offers")
    sendOffer(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateOfferDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketOfferDto> {
        return this.marketplaceService.sendOffer(id, dto, user.userId);
    }

    @Patch("listings/:id/offers/:offerId")
    updateOffer(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("offerId", ParseUUIDPipe) _offerId: string,
        @Body() dto: CreateOfferDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketOfferDto> {
        return this.marketplaceService.sendOffer(id, dto, user.userId);
    }

    @Post("listings/:id/offers/:offerId/accept")
    acceptOffer(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("offerId", ParseUUIDPipe) offerId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketOfferDto> {
        return this.marketplaceService.acceptOffer(id, offerId, user.userId);
    }

    @Post("listings/:id/offers/:offerId/reject")
    rejectOffer(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("offerId", ParseUUIDPipe) offerId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketOfferDto> {
        return this.marketplaceService.rejectOffer(id, offerId, user.userId);
    }

    @Post("listings/:id/offers/:offerId/counter")
    counterOffer(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("offerId", ParseUUIDPipe) offerId: string,
        @Body() dto: CounterOfferDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketOfferDto> {
        return this.marketplaceService.counterOffer(id, offerId, dto, user.userId);
    }

    @Delete("listings/:id/offers/:offerId")
    async withdrawOffer(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("offerId", ParseUUIDPipe) offerId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.marketplaceService.withdrawOffer(id, offerId, user.userId);
        return { success: true };
    }

    // ─── Comments ──────────────────────────────────────────────────────────────

    @Get("listings/:id/comments")
    getComments(@Param("id", ParseUUIDPipe) id: string): Promise<MarketCommentDto[]> {
        return this.marketplaceService.getComments(id);
    }

    @Post("listings/:id/comments")
    addComment(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketCommentDto> {
        return this.marketplaceService.addComment(id, dto, user.userId);
    }

    @Delete("listings/:id/comments/:commentId")
    async deleteComment(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("commentId", ParseUUIDPipe) commentId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.marketplaceService.deleteComment(id, commentId, user.userId);
        return { success: true };
    }

    // ─── Ratings ───────────────────────────────────────────────────────────────

    @Get("listings/:id/ratings")
    getRatings(@Param("id", ParseUUIDPipe) id: string): Promise<MarketRatingDto[]> {
        return this.marketplaceService.getRatings(id);
    }

    @Post("listings/:id/ratings")
    submitRating(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateRatingDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<MarketRatingDto> {
        return this.marketplaceService.submitRating(id, dto, user.userId);
    }

    // ─── Reports ───────────────────────────────────────────────────────────────

    @Post("listings/:id/report")
    async reportListing(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: ReportListingDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.marketplaceService.reportListing(id, dto, user.userId);
        return { success: true };
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    @Get("admin/pending")
    getPendingListings(): Promise<MarketListingDto[]> {
        return this.marketplaceService.getPendingListings();
    }

    @Post("admin/:id/approve")
    approveListing(@Param("id", ParseUUIDPipe) id: string): Promise<MarketListingDto> {
        return this.marketplaceService.approveListing(id);
    }

    @Post("admin/:id/reject")
    rejectListing(@Param("id", ParseUUIDPipe) id: string, @Body() body: { reason: string }): Promise<MarketListingDto> {
        return this.marketplaceService.rejectListingAdmin(id, body.reason);
    }

    @Get("admin/reports")
    getPendingReports(): Promise<MarketReportDto[]> {
        return this.marketplaceService.getPendingReports();
    }

    @Patch("admin/reports/:id")
    actionReport(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ActionReportDto): Promise<MarketReportDto> {
        return this.marketplaceService.actionReport(id, dto);
    }
}
