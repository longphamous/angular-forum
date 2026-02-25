import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";

import {
    DrawResult,
    DrawScheduleConfig,
    LottoDraw,
    LottoPrizeClass,
    LottoResult,
    LottoTicket,
    Weekday
} from "./models/lotto.model";

/**
 * Prize amounts per class (in virtual credits).
 * Based loosely on the German "6 aus 49" prize structure.
 *
 * Class 1  – 6 numbers + super number matched  → jackpot (rolls over if no winner)
 * Class 2  – 6 numbers matched                 → 2nd prize
 * Class 3  – 5 numbers + super number matched  → 3rd prize
 * Class 4  – 5 numbers matched
 * Class 5  – 4 numbers + super number matched
 * Class 6  – 4 numbers matched
 * Class 7  – 3 numbers + super number matched
 * Class 8  – 3 numbers matched
 * Class 9  – 2 numbers + super number matched
 */
const PRIZE_TABLE: Record<LottoPrizeClass, number> = {
    class1: 10_000_000,
    class2: 1_000_000,
    class3: 100_000,
    class4: 5_000,
    class5: 500,
    class6: 50,
    class7: 20,
    class8: 10,
    class9: 5,
    no_win: 0
};

const TICKET_COST = 2; // virtual credits per ticket

/** Default schedule: every Saturday at 19:00 UTC */
const DEFAULT_CONFIG: DrawScheduleConfig = {
    drawDays: [6],
    drawHourUtc: 19,
    drawMinuteUtc: 0,
    baseJackpot: 1_000_000,
    rolloverPercentage: 50
};

const draws: LottoDraw[] = [
    {
        id: "draw-2026-w01",
        drawDate: "2026-01-03T19:00:00.000Z",
        winningNumbers: [3, 12, 19, 27, 35, 42],
        superNumber: 7,
        jackpot: 8_500_000,
        status: "drawn"
    }
];

const tickets: LottoTicket[] = [
    {
        id: "ticket-001",
        userId: "u1",
        numbers: [3, 12, 19, 27, 35, 42],
        superNumber: 7,
        drawId: "draw-2026-w01",
        purchasedAt: "2026-01-02T10:00:00.000Z",
        cost: TICKET_COST
    },
    {
        id: "ticket-002",
        userId: "u2",
        numbers: [5, 12, 19, 27, 35, 42],
        superNumber: 3,
        drawId: "draw-2026-w01",
        purchasedAt: "2026-01-02T11:00:00.000Z",
        cost: TICKET_COST
    },
    {
        id: "ticket-003",
        userId: "u3",
        numbers: [1, 7, 13, 25, 38, 49],
        superNumber: 5,
        drawId: "draw-2026-w01",
        purchasedAt: "2026-01-02T12:00:00.000Z",
        cost: TICKET_COST
    }
];

@Injectable()
export class LottoService {
    private readonly logger = new Logger(LottoService.name);
    private config: DrawScheduleConfig = { ...DEFAULT_CONFIG };

    // ─── Config ───────────────────────────────────────────────────────────────

    getConfig(): DrawScheduleConfig {
        return { ...this.config };
    }

    updateConfig(partial: Partial<DrawScheduleConfig>): DrawScheduleConfig {
        if (partial.drawDays !== undefined) {
            if (!Array.isArray(partial.drawDays) || partial.drawDays.length === 0) {
                throw new BadRequestException("drawDays must be a non-empty array");
            }
            const valid = partial.drawDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
            if (!valid) {
                throw new BadRequestException("drawDays values must be integers between 0 (Sun) and 6 (Sat)");
            }
        }
        if (partial.drawHourUtc !== undefined && (partial.drawHourUtc < 0 || partial.drawHourUtc > 23)) {
            throw new BadRequestException("drawHourUtc must be between 0 and 23");
        }
        if (partial.drawMinuteUtc !== undefined && (partial.drawMinuteUtc < 0 || partial.drawMinuteUtc > 59)) {
            throw new BadRequestException("drawMinuteUtc must be between 0 and 59");
        }
        if (
            partial.rolloverPercentage !== undefined &&
            (partial.rolloverPercentage < 0 || partial.rolloverPercentage > 100)
        ) {
            throw new BadRequestException("rolloverPercentage must be between 0 and 100");
        }
        if (partial.baseJackpot !== undefined && partial.baseJackpot <= 0) {
            throw new BadRequestException("baseJackpot must be greater than 0");
        }

        this.config = { ...this.config, ...partial };
        this.logger.log(`Schedule config updated: ${JSON.stringify(this.config)}`);
        return { ...this.config };
    }

    // ─── Draws ────────────────────────────────────────────────────────────────

    getAllDraws(): LottoDraw[] {
        return draws;
    }

    getDrawById(id: string): LottoDraw {
        const draw = draws.find((d) => d.id === id);
        if (!draw) {
            throw new NotFoundException(`Draw with id "${id}" not found`);
        }
        return draw;
    }

    /**
     * Performs the weekly "6 aus 49" draw for the given drawId.
     * Picks 6 unique random numbers from 1–49 and a super number from 0–9.
     *
     * Jackpot rollover: if there is no class-1 winner, the ticket revenue
     * (rolloverPercentage % of total ticket cost) is carried over to the next draw.
     */
    performWeeklyDraw(drawId: string): DrawResult {
        const draw = this.getDrawById(drawId);

        if (draw.status === "drawn") {
            throw new BadRequestException(`Draw "${drawId}" has already been drawn`);
        }

        const winningNumbers = this.drawUniqueNumbers(1, 49, 6);
        const superNumber = Math.floor(Math.random() * 10); // 0–9

        draw.winningNumbers = winningNumbers;
        draw.superNumber = superNumber;
        draw.status = "drawn";

        const ticketsForDraw = tickets.filter((t) => t.drawId === drawId);
        const allResults = ticketsForDraw.map((ticket) => this.evaluateTicket(ticket, draw));
        const winners = allResults.filter((r) => r.prizeAmount > 0);
        const totalPrizesPaid = winners.reduce((sum, r) => sum + r.prizeAmount, 0);

        this.logger.log(
            `Draw "${drawId}" completed. Numbers: [${winningNumbers.join(", ")}] Super: ${superNumber}. Winners: ${winners.length}`
        );

        // ── Jackpot rollover ──────────────────────────────────────────────────
        const hasJackpotWinner = allResults.some((r) => r.prizeClass === "class1");
        if (!hasJackpotWinner) {
            const totalRevenue = ticketsForDraw.reduce((sum, t) => sum + t.cost, 0);
            const rolloverAmount = Math.floor(totalRevenue * (this.config.rolloverPercentage / 100));
            const nextJackpot = draw.jackpot + rolloverAmount;
            this.logger.log(
                `No jackpot winner – rolling over ${rolloverAmount} credits (${this.config.rolloverPercentage}% of ${totalRevenue}). Next jackpot: ${nextJackpot}`
            );
            this.scheduleNextDraw(nextJackpot);
        } else {
            this.scheduleNextDraw(this.config.baseJackpot);
        }

        return {
            draw,
            totalTickets: ticketsForDraw.length,
            winners,
            totalPrizesPaid
        };
    }

    /**
     * Manually creates the next draw on the next configured draw day.
     * Called automatically after each draw; can also be called via the API.
     */
    scheduleNextDraw(jackpot?: number): LottoDraw {
        const effectiveJackpot = jackpot ?? this.config.baseJackpot;
        const nextDate = this.nextDrawDate();
        const id = `draw-${nextDate.toISOString().replace(/[:T]/g, "-").slice(0, 16)}`;

        if (draws.some((d) => d.id === id)) {
            this.logger.log(`Draw "${id}" already exists, skipping creation`);
            return draws.find((d) => d.id === id)!;
        }

        const newDraw: LottoDraw = {
            id,
            drawDate: nextDate.toISOString(),
            winningNumbers: [],
            superNumber: -1,
            jackpot: effectiveJackpot,
            status: "pending"
        };

        draws.push(newDraw);
        this.logger.log(`Next draw scheduled: "${id}" on ${nextDate.toISOString()} with jackpot ${effectiveJackpot}`);
        return newDraw;
    }

    // ─── Tickets ──────────────────────────────────────────────────────────────

    getTicketsByUser(userId: string): LottoTicket[] {
        return tickets.filter((t) => t.userId === userId);
    }

    purchaseTicket(userId: string, numbers: number[], superNumber: number, drawId: string): LottoTicket {
        this.validateNumbers(numbers, superNumber);

        const draw = this.getDrawById(drawId);
        if (draw.status === "drawn") {
            throw new BadRequestException(`Draw "${drawId}" has already taken place`);
        }

        const ticket: LottoTicket = {
            id: `ticket-${Date.now()}`,
            userId,
            numbers: [...numbers].sort((a, b) => a - b),
            superNumber,
            drawId,
            purchasedAt: new Date().toISOString(),
            cost: TICKET_COST
        };

        tickets.push(ticket);
        return ticket;
    }

    // ─── Results ──────────────────────────────────────────────────────────────

    getDrawResults(drawId: string): DrawResult {
        const draw = this.getDrawById(drawId);

        if (draw.status !== "drawn") {
            throw new BadRequestException(`Draw "${drawId}" has not been drawn yet`);
        }

        const ticketsForDraw = tickets.filter((t) => t.drawId === drawId);
        const results = ticketsForDraw.map((ticket) => this.evaluateTicket(ticket, draw));
        const winners = results.filter((r) => r.prizeAmount > 0);
        const totalPrizesPaid = winners.reduce((sum, r) => sum + r.prizeAmount, 0);

        return {
            draw,
            totalTickets: ticketsForDraw.length,
            winners,
            totalPrizesPaid
        };
    }

    getUserResults(userId: string, drawId?: string): LottoResult[] {
        const userTickets = tickets.filter((t) => t.userId === userId && (!drawId || t.drawId === drawId));

        return userTickets
            .map((ticket) => {
                const draw = draws.find((d) => d.id === ticket.drawId);
                if (!draw || draw.status !== "drawn") return null;
                return this.evaluateTicket(ticket, draw);
            })
            .filter((r): r is LottoResult => r !== null);
    }

    /**
     * Returns the next UTC datetime that matches one of the configured draw days,
     * at the configured hour:minute.  Always returns a future time.
     */
    nextDrawDate(): Date {
        const now = new Date();
        const { drawDays, drawHourUtc, drawMinuteUtc } = this.config;

        // Try today first, then iterate forward up to 7 days
        for (let offset = 0; offset <= 7; offset++) {
            const candidate = new Date(now);
            candidate.setUTCDate(now.getUTCDate() + offset);
            candidate.setUTCHours(drawHourUtc, drawMinuteUtc, 0, 0);

            const dayOfWeek = candidate.getUTCDay() as Weekday;
            if (drawDays.includes(dayOfWeek) && candidate > now) {
                return candidate;
            }
        }

        // Fallback: 7 days from now (should never be reached)
        const fallback = new Date(now);
        fallback.setUTCDate(now.getUTCDate() + 7);
        fallback.setUTCHours(drawHourUtc, drawMinuteUtc, 0, 0);
        return fallback;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private evaluateTicket(ticket: LottoTicket, draw: LottoDraw): LottoResult {
        const matchedNumbers = ticket.numbers.filter((n) => draw.winningNumbers.includes(n));
        const matchedCount = matchedNumbers.length;
        const superNumberMatched = ticket.superNumber === draw.superNumber;
        const prizeClass = this.determinePrizeClass(matchedCount, superNumberMatched);
        const prizeAmount = prizeClass === "class1" ? draw.jackpot : PRIZE_TABLE[prizeClass];

        return {
            ticketId: ticket.id,
            userId: ticket.userId,
            drawId: draw.id,
            matchedNumbers,
            matchedCount,
            superNumberMatched,
            prizeClass,
            prizeAmount
        };
    }

    private determinePrizeClass(matched: number, superMatched: boolean): LottoPrizeClass {
        if (matched === 6 && superMatched) return "class1";
        if (matched === 6) return "class2";
        if (matched === 5 && superMatched) return "class3";
        if (matched === 5) return "class4";
        if (matched === 4 && superMatched) return "class5";
        if (matched === 4) return "class6";
        if (matched === 3 && superMatched) return "class7";
        if (matched === 3) return "class8";
        if (matched === 2 && superMatched) return "class9";
        return "no_win";
    }

    private drawUniqueNumbers(min: number, max: number, count: number): number[] {
        const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, count).sort((a, b) => a - b);
    }

    private validateNumbers(numbers: number[], superNumber: number): void {
        if (numbers.length !== 6) {
            throw new BadRequestException("Exactly 6 numbers must be provided");
        }
        if (new Set(numbers).size !== 6) {
            throw new BadRequestException("Numbers must be unique");
        }
        if (numbers.some((n) => n < 1 || n > 49)) {
            throw new BadRequestException("Numbers must be between 1 and 49");
        }
        if (superNumber < 0 || superNumber > 9) {
            throw new BadRequestException("Super number must be between 0 and 9");
        }
    }
}
