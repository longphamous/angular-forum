import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";

import { Public, Roles } from "../../auth/auth.decorators";
import { LottoScheduler } from "./lotto.scheduler";
import { LottoService } from "./lotto.service";
import {
    CreateSpecialDrawDto,
    DrawHistoryEntry,
    DrawResult,
    DrawScheduleConfig,
    LottoDraw,
    LottoResult,
    LottoStats,
    LottoTicket,
    SpecialDraw,
    SpecialDrawResult
} from "./models/lotto.model";

@ApiTags("Lotto")
@ApiBearerAuth("JWT")
@Controller("credit/lotto")
export class LottoController {
    constructor(
        private readonly lottoService: LottoService,
        private readonly lottoScheduler: LottoScheduler
    ) {}

    // ─── Schedule config ──────────────────────────────────────────────────────

    @Public()
    @Get("config")
    getConfig(): DrawScheduleConfig {
        return this.lottoService.getConfig();
    }

    @Roles("admin")
    @Patch("config")
    async updateConfig(@Body() body: Partial<DrawScheduleConfig>): Promise<DrawScheduleConfig> {
        const updated = await this.lottoService.updateConfig(body);
        this.lottoScheduler.updateSchedule(updated);
        return updated;
    }

    // ─── Stats ──────────────────────────────────────────────────────────────

    @Public()
    @Get("stats")
    getStats(): Promise<LottoStats> {
        return this.lottoService.getStats();
    }

    @Roles("admin")
    @Post("stats/rebuild")
    async rebuildStats(): Promise<{ success: boolean }> {
        await this.lottoService.rebuildStats();
        return { success: true };
    }

    // ─── Draw History ───────────────────────────────────────────────────────

    @Public()
    @Get("draw-history")
    getDrawHistory(): Promise<DrawHistoryEntry[]> {
        return this.lottoService.getDrawHistory();
    }

    // ─── Draws ──────────────────────────────────────────────────────────────

    @Public()
    @Get("draws")
    getAllDraws(): Promise<LottoDraw[]> {
        return this.lottoService.getAllDraws();
    }

    @Public()
    @Get("draws/:id")
    getDrawById(@Param("id") id: string): Promise<LottoDraw> {
        return this.lottoService.getDrawById(id);
    }

    @Roles("admin")
    @Post("draws")
    scheduleNextDraw(@Body() body: { jackpot?: number }): Promise<LottoDraw> {
        return this.lottoService.scheduleNextDraw(body.jackpot);
    }

    @Roles("admin")
    @Post("draws/:id/perform")
    performWeeklyDraw(@Param("id") id: string): Promise<DrawResult> {
        return this.lottoService.performWeeklyDraw(id);
    }

    @Public()
    @Get("draws/:id/results")
    getDrawResults(@Param("id") id: string): Promise<DrawResult> {
        return this.lottoService.getDrawResults(id);
    }

    // ─── Tickets ────────────────────────────────────────────────────────────

    @Get("my-tickets")
    getMyTickets(@Req() req: Request): Promise<LottoTicket[]> {
        const user = req.user as { userId: string } | undefined;
        if (!user?.userId) return Promise.resolve([]);
        return this.lottoService.getTicketsByUser(user.userId);
    }

    @Get("tickets")
    @Roles("admin")
    getTicketsByUser(@Query("userId") userId: string): Promise<LottoTicket[]> {
        return this.lottoService.getTicketsByUser(userId);
    }

    @Post("tickets")
    purchaseTicket(
        @Req() req: Request,
        @Body() body: { fields: number[][]; superNumber: number; drawId: string; drawCount?: number }
    ): Promise<LottoTicket[]> {
        const user = req.user as { userId: string } | undefined;
        if (!user?.userId) throw new Error("Unauthorized");
        return this.lottoService.purchaseTicket(
            user.userId,
            body.fields,
            body.superNumber,
            body.drawId,
            body.drawCount ?? 1
        );
    }

    // ─── User results ───────────────────────────────────────────────────────

    @Get("my-results")
    getMyResults(@Req() req: Request, @Query("drawId") drawId?: string): Promise<LottoResult[]> {
        const user = req.user as { userId: string } | undefined;
        if (!user?.userId) return Promise.resolve([]);
        return this.lottoService.getUserResults(user.userId, drawId);
    }

    @Public()
    @Get("users/:userId/results")
    getUserResults(@Param("userId") userId: string, @Query("drawId") drawId?: string): Promise<LottoResult[]> {
        return this.lottoService.getUserResults(userId, drawId);
    }

    // ─── Special draws ──────────────────────────────────────────────────────

    @Public()
    @Get("special-draws")
    getAllSpecialDraws(): Promise<SpecialDraw[]> {
        return this.lottoService.getAllSpecialDraws();
    }

    @Roles("admin")
    @Post("special-draws")
    createSpecialDraw(@Body() body: CreateSpecialDrawDto): Promise<SpecialDraw> {
        return this.lottoService.createSpecialDraw(body);
    }

    @Roles("admin")
    @Post("special-draws/:id/perform")
    performSpecialDraw(@Param("id") id: string): Promise<SpecialDrawResult> {
        return this.lottoService.performSpecialDraw(id);
    }

    @Post("special-draws/:id/tickets")
    purchaseSpecialTicket(
        @Req() req: Request,
        @Body() body: { fields: number[][]; superNumber: number }
    ): Promise<LottoTicket> {
        const user = req.user as { userId: string } | undefined;
        if (!user?.userId) throw new Error("Unauthorized");
        const id = req.params["id"];
        if (typeof id !== "string") throw new Error("Invalid ticket id");
        return this.lottoService.purchaseSpecialTicket(user.userId, body.fields, body.superNumber, id);
    }
}
