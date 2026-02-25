import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { LottoScheduler } from "./lotto.scheduler";
import { LottoService } from "./lotto.service";
import { DrawResult, DrawScheduleConfig, LottoDraw, LottoResult, LottoTicket } from "./models/lotto.model";

@Controller("credit/lotto")
export class LottoController {
    constructor(
        private readonly lottoService: LottoService,
        private readonly lottoScheduler: LottoScheduler
    ) {}

    // ─── Schedule config ──────────────────────────────────────────────────────

    /**
     * GET /credit/lotto/config
     * Returns the current draw schedule configuration.
     */
    @Get("config")
    getConfig(): DrawScheduleConfig {
        return this.lottoService.getConfig();
    }

    /**
     * PATCH /credit/lotto/config
     * Updates the draw schedule configuration.
     * All fields are optional – only the provided fields are changed.
     *
     * Body (all optional):
     * {
     *   drawDays?: number[];         // 0=Sun … 6=Sat, e.g. [3,6] for Wed+Sat
     *   drawHourUtc?: number;        // 0–23
     *   drawMinuteUtc?: number;      // 0–59
     *   baseJackpot?: number;        // starting jackpot for fresh draws
     *   rolloverPercentage?: number; // 0–100, % of ticket revenue added to next jackpot
     * }
     */
    @Patch("config")
    updateConfig(@Body() body: Partial<DrawScheduleConfig>): DrawScheduleConfig {
        const updated = this.lottoService.updateConfig(body);
        // Re-register cron jobs to reflect the new schedule
        this.lottoScheduler.updateSchedule(updated);
        return updated;
    }

    // ─── Draws ────────────────────────────────────────────────────────────────

    /**
     * GET /credit/lotto/draws
     * Returns all draws (past and upcoming).
     */
    @Get("draws")
    getAllDraws(): LottoDraw[] {
        return this.lottoService.getAllDraws();
    }

    /**
     * GET /credit/lotto/draws/:id
     * Returns a single draw by id.
     */
    @Get("draws/:id")
    getDrawById(@Param("id") id: string): LottoDraw {
        return this.lottoService.getDrawById(id);
    }

    /**
     * POST /credit/lotto/draws
     * Manually schedules the next draw (uses configured next draw day).
     * Body: { jackpot?: number }
     */
    @Post("draws")
    scheduleNextDraw(@Body() body: { jackpot?: number }): LottoDraw {
        return this.lottoService.scheduleNextDraw(body.jackpot);
    }

    /**
     * POST /credit/lotto/draws/:id/perform
     * Manually triggers the "6 aus 49" draw for the given drawId.
     * Normally this is triggered automatically by the cron scheduler.
     */
    @Post("draws/:id/perform")
    performWeeklyDraw(@Param("id") id: string): DrawResult {
        return this.lottoService.performWeeklyDraw(id);
    }

    /**
     * GET /credit/lotto/draws/:id/results
     * Returns the full result breakdown for a completed draw.
     */
    @Get("draws/:id/results")
    getDrawResults(@Param("id") id: string): DrawResult {
        return this.lottoService.getDrawResults(id);
    }

    // ─── Tickets ──────────────────────────────────────────────────────────────

    /**
     * GET /credit/lotto/tickets?userId=<id>
     * Returns all tickets for a user.
     */
    @Get("tickets")
    getTicketsByUser(@Query("userId") userId: string): LottoTicket[] {
        return this.lottoService.getTicketsByUser(userId);
    }

    /**
     * POST /credit/lotto/tickets
     * Purchases a new ticket for the given draw.
     *
     * Body: { userId: string; numbers: number[]; superNumber: number; drawId: string }
     */
    @Post("tickets")
    purchaseTicket(
        @Body() body: { userId: string; numbers: number[]; superNumber: number; drawId: string }
    ): LottoTicket {
        return this.lottoService.purchaseTicket(body.userId, body.numbers, body.superNumber, body.drawId);
    }

    // ─── User results ─────────────────────────────────────────────────────────

    /**
     * GET /credit/lotto/users/:userId/results?drawId=<optional>
     * Returns all evaluated lotto results for a specific user,
     * optionally filtered by drawId.
     */
    @Get("users/:userId/results")
    getUserResults(@Param("userId") userId: string, @Query("drawId") drawId?: string): LottoResult[] {
        return this.lottoService.getUserResults(userId, drawId);
    }
}
