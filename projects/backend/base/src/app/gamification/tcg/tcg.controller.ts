import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../../auth/auth.decorators";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
    AdminBoosterDetailDto,
    BoosterCategoryDto,
    BoosterPackDto,
    CardDto,
    CardListingDto,
    CollectionProgressDto,
    CreateBoosterCategoryDto,
    CreateBoosterPackDto,
    CreateCardDto,
    OpenBoosterResultDto,
    TcgService,
    UpdateBoosterCategoryDto,
    UpdateBoosterPackDto,
    UpdateCardDto,
    UserBoosterDto,
    UserCardDto
} from "./tcg.service";

@ApiTags("TCG")
@ApiBearerAuth("JWT")
@Controller("gamification/tcg")
export class TcgController {
    constructor(private readonly tcgService: TcgService) {}

    // ─── Public ───────────────────────────────────────────────────────────────

    @Public()
    @Get("boosters")
    getActiveBoosters(@Request() req: { user?: { userId: string } }): Promise<BoosterPackDto[]> {
        return this.tcgService.getActiveBoosters(req.user?.userId);
    }

    @Public()
    @Get("cards")
    getAllCards(): Promise<CardDto[]> {
        return this.tcgService.getAllCards();
    }

    @Public()
    @Get("cards/:id")
    getCardById(@Param("id") id: string): Promise<CardDto> {
        return this.tcgService.getCardById(id);
    }

    @Public()
    @Get("listings")
    getActiveListings(): Promise<CardListingDto[]> {
        return this.tcgService.getActiveListings();
    }

    // ─── Authenticated ────────────────────────────────────────────────────────

    @Get("collection")
    getCollection(@Request() req: { user: { userId: string } }): Promise<UserCardDto[]> {
        return this.tcgService.getCollection(req.user.userId);
    }

    @Get("collection/progress")
    getCollectionProgress(@Request() req: { user: { userId: string } }): Promise<CollectionProgressDto> {
        return this.tcgService.getCollectionProgress(req.user.userId);
    }

    @Get("inventory")
    getUnopenedBoosters(@Request() req: { user: { userId: string } }): Promise<UserBoosterDto[]> {
        return this.tcgService.getUnopenedBoosters(req.user.userId);
    }

    @Post("boosters/:id/buy")
    buyBooster(@Request() req: { user: { userId: string } }, @Param("id") id: string): Promise<UserBoosterDto> {
        return this.tcgService.buyBooster(req.user.userId, id);
    }

    @Post("inventory/:id/open")
    openBooster(@Request() req: { user: { userId: string } }, @Param("id") id: string): Promise<OpenBoosterResultDto> {
        return this.tcgService.openBooster(req.user.userId, id);
    }

    @Patch("cards/:id/favorite")
    toggleFavorite(@Request() req: { user: { userId: string } }, @Param("id") id: string): Promise<UserCardDto> {
        return this.tcgService.toggleFavorite(req.user.userId, id);
    }

    @Post("cards/:id/transfer")
    transferCard(
        @Request() req: { user: { userId: string } },
        @Param("id") id: string,
        @Body() body: { targetUserId: string; quantity: number }
    ): Promise<void> {
        return this.tcgService.transferCard(req.user.userId, id, body.targetUserId, body.quantity);
    }

    @Post("listings")
    createListing(
        @Request() req: { user: { userId: string } },
        @Body() body: { cardId: string; price: number; quantity: number }
    ): Promise<CardListingDto> {
        return this.tcgService.createListing(req.user.userId, body.cardId, body.price, body.quantity);
    }

    @Delete("listings/:id")
    cancelListing(@Request() req: { user: { userId: string } }, @Param("id") id: string): Promise<void> {
        return this.tcgService.cancelListing(req.user.userId, id);
    }

    @Post("listings/:id/buy")
    buyListing(@Request() req: { user: { userId: string } }, @Param("id") id: string): Promise<CardListingDto> {
        return this.tcgService.buyListing(req.user.userId, id);
    }

    // ─── Admin: Cards ─────────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/cards")
    adminGetAllCards(): Promise<CardDto[]> {
        return this.tcgService.adminGetAllCards();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Post("admin/cards")
    adminCreateCard(@Body() body: CreateCardDto): Promise<CardDto> {
        return this.tcgService.adminCreateCard(body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Put("admin/cards/:id")
    adminUpdateCard(@Param("id") id: string, @Body() body: UpdateCardDto): Promise<CardDto> {
        return this.tcgService.adminUpdateCard(id, body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete("admin/cards/:id")
    adminDeleteCard(@Param("id") id: string): Promise<void> {
        return this.tcgService.adminDeleteCard(id);
    }

    // ─── Admin: Boosters ──────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/boosters")
    adminGetAllBoosters(): Promise<AdminBoosterDetailDto[]> {
        return this.tcgService.adminGetAllBoosters();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Post("admin/boosters")
    adminCreateBooster(@Body() body: CreateBoosterPackDto): Promise<BoosterPackDto> {
        return this.tcgService.adminCreateBooster(body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Put("admin/boosters/:id")
    adminUpdateBooster(@Param("id") id: string, @Body() body: UpdateBoosterPackDto): Promise<BoosterPackDto> {
        return this.tcgService.adminUpdateBooster(id, body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete("admin/boosters/:id")
    adminDeleteBooster(@Param("id") id: string): Promise<void> {
        return this.tcgService.adminDeleteBooster(id);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Post("admin/boosters/:id/cards")
    adminAddCardToBooster(
        @Param("id") id: string,
        @Body() body: { cardId: string; dropWeight: number }
    ): Promise<void> {
        return this.tcgService.adminAddCardToBooster(id, body.cardId, body.dropWeight);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete("admin/boosters/:id/cards/:cardId")
    adminRemoveCardFromBooster(@Param("id") id: string, @Param("cardId") cardId: string): Promise<void> {
        return this.tcgService.adminRemoveCardFromBooster(id, cardId);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch("admin/boosters/:id/cards/:cardId")
    adminUpdateCardDropWeight(
        @Param("id") id: string,
        @Param("cardId") cardId: string,
        @Body() body: { dropWeight: number }
    ): Promise<void> {
        return this.tcgService.adminUpdateCardDropWeight(id, cardId, body.dropWeight);
    }

    // ─── Admin: Booster Categories ────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/categories")
    adminGetAllCategories(): Promise<BoosterCategoryDto[]> {
        return this.tcgService.adminGetAllCategories();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Post("admin/categories")
    adminCreateCategory(@Body() body: CreateBoosterCategoryDto): Promise<BoosterCategoryDto> {
        return this.tcgService.adminCreateCategory(body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Put("admin/categories/:id")
    adminUpdateCategory(@Param("id") id: string, @Body() body: UpdateBoosterCategoryDto): Promise<BoosterCategoryDto> {
        return this.tcgService.adminUpdateCategory(id, body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete("admin/categories/:id")
    adminDeleteCategory(@Param("id") id: string): Promise<void> {
        return this.tcgService.adminDeleteCategory(id);
    }
}
