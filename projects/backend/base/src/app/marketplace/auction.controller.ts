import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { AuctionService } from "./auction.service";
import { AuctionQueryDto } from "./dto/auction-query.dto";
import { CreateAuctionDto } from "./dto/create-auction.dto";
import { PlaceBidDto } from "./dto/place-bid.dto";
import { AuctionBidDto, AuctionDto, AuctionWatchlistDto, PaginatedAuctionResult } from "./models/auction.model";

@ApiTags("Marketplace")
@ApiBearerAuth("JWT")
@Controller("marketplace/auctions")
@UseGuards(JwtAuthGuard)
export class AuctionController {
    constructor(private readonly auctionService: AuctionService) {}

    // ─── Browse ────────────────────────────────────────────────────────────────

    @Get()
    getAuctions(@Query() query: AuctionQueryDto): Promise<PaginatedAuctionResult> {
        return this.auctionService.getAuctions(query);
    }

    @Get("my")
    getMyAuctions(@CurrentUser() user: AuthenticatedUser): Promise<AuctionDto[]> {
        return this.auctionService.getMyAuctions(user.userId);
    }

    @Get("my-bids")
    getMyBids(@CurrentUser() user: AuthenticatedUser): Promise<AuctionBidDto[]> {
        return this.auctionService.getMyBids(user.userId);
    }

    @Get("watchlist")
    getWatchlist(@CurrentUser() user: AuthenticatedUser): Promise<AuctionWatchlistDto[]> {
        return this.auctionService.getWatchlist(user.userId);
    }

    @Get(":id")
    getAuction(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<AuctionDto> {
        return this.auctionService.getAuction(id, user.userId);
    }

    @Get(":id/bids")
    getBidHistory(@Param("id", ParseUUIDPipe) id: string): Promise<AuctionBidDto[]> {
        return this.auctionService.getBidHistory(id);
    }

    // ─── Actions ───────────────────────────────────────────────────────────────

    @Post()
    createAuction(
        @Body() dto: CreateAuctionDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<AuctionDto> {
        return this.auctionService.createAuction(dto, user.userId);
    }

    @Post(":id/bids")
    placeBid(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: PlaceBidDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<AuctionBidDto> {
        return this.auctionService.placeBid(id, dto, user.userId);
    }

    @Post(":id/buy-now")
    buyNow(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<AuctionDto> {
        return this.auctionService.buyNow(id, user.userId);
    }

    @Post(":id/watch")
    toggleWatch(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ watched: boolean }> {
        return this.auctionService.toggleWatch(id, user.userId);
    }

    @Post(":id/cancel")
    cancelAuction(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<AuctionDto> {
        return this.auctionService.cancelAuction(id, user.userId);
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    @Get("admin/pending")
    getPendingAuctions(): Promise<AuctionDto[]> {
        return this.auctionService.getPendingAuctions();
    }

    @Post("admin/:id/approve")
    approveAuction(@Param("id", ParseUUIDPipe) id: string): Promise<AuctionDto> {
        return this.auctionService.approveAuction(id);
    }

    @Post("admin/:id/reject")
    rejectAuction(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() body: { reason: string }
    ): Promise<AuctionDto> {
        return this.auctionService.rejectAuction(id, body.reason);
    }
}
