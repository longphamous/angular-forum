import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request } from "@nestjs/common";

import { Public, Roles } from "../../auth/auth.decorators";
import {
    AdminOrgInventoryDto,
    CreateMarketEventDto,
    CreateMarketResourceDto,
    DynamicMarketService,
    MarketActivityDto,
    MarketStatsDto,
    UpdateMarketResourceDto
} from "./dynamic-market.service";

@Controller("gamification/market")
export class DynamicMarketController {
    constructor(private readonly marketService: DynamicMarketService) {}

    // ─── Public endpoints ───────────────────────────────────────────────────

    @Public()
    @Get("overview")
    getOverview() {
        return this.marketService.getMarketOverview();
    }

    @Public()
    @Get("resources/:slug")
    getResource(@Param("slug") slug: string) {
        return this.marketService.getResource(slug);
    }

    @Public()
    @Get("events/recent")
    getRecentEvents(@Query("limit") limit?: string) {
        return this.marketService.getRecentEvents(limit ? parseInt(limit, 10) : 10);
    }

    @Public()
    @Get("resources/:slug/history")
    getPriceHistory(@Param("slug") slug: string, @Query("limit") limit?: string) {
        return this.marketService.getPriceHistory(slug, limit ? parseInt(limit, 10) : 20);
    }

    @Public()
    @Get("schedule/next")
    getNextUpdate() {
        return this.marketService.getNextUpdateAt();
    }

    @Public()
    @Get("activities")
    getActivities(@Query("limit") limit?: string): MarketActivityDto[] {
        return this.marketService.getRecentActivities(limit ? parseInt(limit, 10) : 50);
    }

    // ─── Authenticated: Trading ─────────────────────────────────────────────

    @Post("buy")
    buy(@Request() req: { user: { userId: string } }, @Body() body: { slug: string; quantity: number }) {
        return this.marketService.buy(req.user.userId, body.slug, body.quantity);
    }

    @Post("sell")
    sell(@Request() req: { user: { userId: string } }, @Body() body: { slug: string; quantity: number }) {
        return this.marketService.sell(req.user.userId, body.slug, body.quantity);
    }

    @Get("inventory")
    getInventory(@Request() req: { user: { userId: string } }) {
        return this.marketService.getUserInventory(req.user.userId);
    }

    @Get("transactions")
    getTransactions(
        @Request() req: { user: { userId: string } },
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ) {
        return this.marketService.getUserTransactions(
            req.user.userId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20
        );
    }

    // ─── Admin: Resources ───────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin/resources")
    adminGetResources() {
        return this.marketService.getAllResources();
    }

    @Roles("admin")
    @Post("admin/resources")
    adminCreateResource(@Body() dto: CreateMarketResourceDto) {
        return this.marketService.createResource(dto);
    }

    @Roles("admin")
    @Patch("admin/resources/:id")
    adminUpdateResource(@Param("id") id: string, @Body() dto: UpdateMarketResourceDto) {
        return this.marketService.updateResource(id, dto);
    }

    @Roles("admin")
    @Delete("admin/resources/:id")
    adminDeleteResource(@Param("id") id: string) {
        return this.marketService.deleteResource(id);
    }

    @Roles("admin")
    @Post("admin/reset-prices")
    adminResetPrices() {
        return this.marketService.resetPrices();
    }

    @Roles("admin")
    @Post("admin/recalculate")
    adminRecalculate() {
        return this.marketService.recalculatePrices();
    }

    @Roles("admin")
    @Post("admin/full-reset")
    adminFullReset() {
        return this.marketService.fullReset();
    }

    // ─── Admin: Events ──────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin/events")
    adminGetEvents() {
        return this.marketService.getAllEvents();
    }

    @Roles("admin")
    @Post("admin/events")
    adminCreateEvent(@Body() dto: CreateMarketEventDto) {
        return this.marketService.createEvent(dto);
    }

    @Roles("admin")
    @Patch("admin/events/:id")
    adminUpdateEvent(@Param("id") id: string, @Body() dto: Partial<CreateMarketEventDto>) {
        return this.marketService.updateEvent(id, dto);
    }

    @Roles("admin")
    @Delete("admin/events/:id")
    adminDeleteEvent(@Param("id") id: string) {
        return this.marketService.deleteEvent(id);
    }

    @Roles("admin")
    @Post("admin/trigger-event")
    adminTriggerEvent() {
        return this.marketService.triggerRandomEvent();
    }

    // ─── Admin: Config ──────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin/config")
    adminGetConfig() {
        return this.marketService.getConfig();
    }

    @Roles("admin")
    @Put("admin/config")
    adminUpdateConfig(
        @Body()
        dto: Partial<{
            eventChancePercent: number;
            demandDecayFactor: number;
            maxTradeQuantity: number;
            schedule: import("./entities/market-config.entity").MarketSchedule;
        }>
    ) {
        return this.marketService.updateConfig(dto);
    }

    // ─── Admin: Stats ───────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin/stats")
    adminGetStats(): Promise<MarketStatsDto> {
        return this.marketService.getMarketStats();
    }

    // ─── Admin: Intervention ────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin/intervention/inventory")
    adminGetOrgInventory(): Promise<AdminOrgInventoryDto[]> {
        return this.marketService.getAdminInventory();
    }

    @Roles("admin")
    @Post("admin/intervention/buy")
    adminInterventionBuy(@Body() body: { slug: string; quantity: number }): Promise<AdminOrgInventoryDto[]> {
        return this.marketService.adminBuy(body.slug, body.quantity);
    }

    @Roles("admin")
    @Post("admin/intervention/sell")
    adminInterventionSell(@Body() body: { slug: string; quantity: number }): Promise<AdminOrgInventoryDto[]> {
        return this.marketService.adminSell(body.slug, body.quantity);
    }
}
