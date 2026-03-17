import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { NotificationsService } from "../../notifications/notifications.service";
import { CreditService } from "../credit.service";
import {
    CreateSpecialDrawDto,
    DrawResult,
    DrawScheduleConfig,
    LottoDraw,
    LottoPrizeClass,
    LottoResult,
    LottoStats,
    LottoTicket,
    SpecialDraw,
    SpecialDrawResult,
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
    class1: 10_000_000, // overridden by draw.jackpot at payout time
    class2: 500_000,
    class3: 100_000,
    class4: 5_000,
    class5: 500,
    class6: 50,
    class7: 20,
    class8: 10,
    class9: 5,
    no_win: 0
};

/** Default schedule: every Saturday at 19:00 UTC */
const DEFAULT_CONFIG: DrawScheduleConfig = {
    drawDays: [6],
    drawHourUtc: 19,
    drawMinuteUtc: 0,
    baseJackpot: 1_000_000,
    rolloverPercentage: 50,
    ticketCost: 2
};

const draws: LottoDraw[] = [
    {
        id: "draw-2026-w01",
        drawDate: "2026-01-03T19:00:00.000Z",
        winningNumbers: [3, 12, 19, 27, 35, 42],
        superNumber: 7,
        jackpot: 8_500_000,
        status: "drawn",
        totalTickets: 3
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
        cost: 2
    },
    {
        id: "ticket-002",
        userId: "u2",
        numbers: [5, 12, 19, 27, 35, 42],
        superNumber: 3,
        drawId: "draw-2026-w01",
        purchasedAt: "2026-01-02T11:00:00.000Z",
        cost: 2
    },
    {
        id: "ticket-003",
        userId: "u3",
        numbers: [1, 7, 13, 25, 38, 49],
        superNumber: 5,
        drawId: "draw-2026-w01",
        purchasedAt: "2026-01-02T12:00:00.000Z",
        cost: 2
    }
];

const specialDraws: SpecialDraw[] = [];
const specialTickets: LottoTicket[] = [];

@Injectable()
export class LottoService {
    private readonly logger = new Logger(LottoService.name);
    private config: DrawScheduleConfig = { ...DEFAULT_CONFIG };

    constructor(
        @Inject(forwardRef(() => CreditService)) private readonly creditService: CreditService,
        private readonly notificationsService: NotificationsService
    ) {}

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
        if (partial.ticketCost !== undefined && partial.ticketCost <= 0) {
            throw new BadRequestException("ticketCost must be greater than 0");
        }

        const scheduleChanged =
            partial.drawDays !== undefined || partial.drawHourUtc !== undefined || partial.drawMinuteUtc !== undefined;

        this.config = { ...this.config, ...partial };
        this.logger.log(`Schedule config updated: ${JSON.stringify(this.config)}`);

        if (scheduleChanged) {
            // Remove pending draws (wrong dates) and schedule a fresh one
            const pendingIndices = draws
                .map((d, i) => (d.status === "pending" ? i : -1))
                .filter((i) => i !== -1)
                .reverse();
            for (const i of pendingIndices) {
                draws.splice(i, 1);
            }
            this.scheduleNextDraw();
            this.logger.log("Pending draws rescheduled after config change");
        }

        return { ...this.config };
    }

    // ─── Draws ────────────────────────────────────────────────────────────────

    getAllDraws(): LottoDraw[] {
        return draws.map((d) => ({
            ...d,
            totalTickets: tickets.filter((t) => t.drawId === d.id).length
        }));
    }

    getDrawById(id: string): LottoDraw {
        const draw = draws.find((d) => d.id === id);
        if (!draw) {
            throw new NotFoundException(`Draw with id "${id}" not found`);
        }
        return { ...draw, totalTickets: tickets.filter((t) => t.drawId === draw.id).length };
    }

    getNextDraw(): LottoDraw | null {
        const pending = draws
            .filter((d) => d.status === "pending")
            .sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());
        return pending[0]
            ? { ...pending[0], totalTickets: tickets.filter((t) => t.drawId === pending[0]!.id).length }
            : null;
    }

    getLastDraw(): LottoDraw | null {
        const drawn = draws
            .filter((d) => d.status === "drawn")
            .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
        return drawn[0] ? { ...drawn[0], totalTickets: tickets.filter((t) => t.drawId === drawn[0]!.id).length } : null;
    }

    /**
     * Performs the weekly "6 aus 49" draw for the given drawId.
     */
    async performWeeklyDraw(drawId: string): Promise<DrawResult> {
        const draw = draws.find((d) => d.id === drawId);
        if (!draw) throw new NotFoundException(`Draw with id "${drawId}" not found`);
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

        // ── Credit winners ────────────────────────────────────────────────────
        for (const winner of winners) {
            try {
                await this.creditService.addCredits(
                    winner.userId,
                    winner.prizeAmount,
                    "lotto_win",
                    `Lotto Gewinn: ${winner.prizeClass} (${winner.prizeAmount} Credits)`
                );
                await this.notificationsService.create(
                    winner.userId,
                    "coins_received",
                    "Lottogewinn!",
                    `${winner.prizeClass}: ${winner.prizeAmount} Coins gewonnen!`,
                    "/lotto"
                );
            } catch (err) {
                this.logger.error(`Failed to credit user ${winner.userId}: ${(err as Error).message}`);
            }
        }

        // ── Jackpot rollover ──────────────────────────────────────────────────
        const hasJackpotWinner = allResults.some((r) => r.prizeClass === "class1");
        if (!hasJackpotWinner) {
            const totalRevenue = ticketsForDraw.reduce((sum, t) => sum + t.cost, 0);
            const rolloverAmount = Math.floor(totalRevenue * (this.config.rolloverPercentage / 100));
            const nextJackpot = draw.jackpot + rolloverAmount;
            this.logger.log(`No jackpot winner – rolling over ${rolloverAmount} credits. Next jackpot: ${nextJackpot}`);
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
            status: "pending",
            totalTickets: 0
        };

        draws.push(newDraw);
        this.logger.log(`Next draw scheduled: "${id}" on ${nextDate.toISOString()} with jackpot ${effectiveJackpot}`);
        return newDraw;
    }

    // ─── Tickets ──────────────────────────────────────────────────────────────

    getTicketsByUser(userId: string): LottoTicket[] {
        return tickets.filter((t) => t.userId === userId);
    }

    async purchaseTicket(
        userId: string,
        numbers: number[],
        superNumber: number,
        drawId: string,
        repeatWeeks = 1
    ): Promise<LottoTicket[]> {
        this.validateNumbers(numbers, superNumber);

        const totalCost = this.config.ticketCost * Math.max(1, repeatWeeks);

        // Deduct credits
        await this.creditService.deductCredits(
            userId,
            totalCost,
            "lotto_ticket",
            `Lotto Ticket (${repeatWeeks > 1 ? `${repeatWeeks} Wochen` : "1 Woche"}): ${numbers.join(", ")} | SZ: ${superNumber}`
        );

        await this.notificationsService.create(
            userId,
            "system",
            "Lottoticket gekauft",
            "Du hast ein Lottoticket für die nächste Ziehung gekauft.",
            "/lotto"
        );

        const createdTickets: LottoTicket[] = [];

        // For repeat weeks, get or create draws for subsequent weeks
        let currentDrawId = drawId;
        for (let week = 0; week < Math.max(1, repeatWeeks); week++) {
            const draw = draws.find((d) => d.id === currentDrawId);
            if (!draw) throw new BadRequestException(`Draw "${currentDrawId}" not found`);
            if (draw.status === "drawn")
                throw new BadRequestException(`Draw "${currentDrawId}" has already taken place`);

            const ticket: LottoTicket = {
                id: `ticket-${Date.now()}-${week}`,
                userId,
                numbers: [...numbers].sort((a, b) => a - b),
                superNumber,
                drawId: currentDrawId,
                purchasedAt: new Date().toISOString(),
                cost: this.config.ticketCost,
                repeatWeeks: repeatWeeks > 1 ? repeatWeeks : undefined
            };
            tickets.push(ticket);
            createdTickets.push(ticket);

            // For next iteration: find or create the next draw
            if (week < repeatWeeks - 1) {
                const nextDrawDate = new Date(draw.drawDate);
                // Find next draw after this one
                const subsequentDraw = draws
                    .filter((d) => d.status === "pending" && new Date(d.drawDate) > nextDrawDate)
                    .sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime())[0];
                if (subsequentDraw) {
                    currentDrawId = subsequentDraw.id;
                } else {
                    // Calculate next draw date and create it
                    const nextDate = this.nextDrawDateAfter(nextDrawDate);
                    const nextId = `draw-${nextDate.toISOString().replace(/[:T]/g, "-").slice(0, 16)}`;
                    if (!draws.some((d) => d.id === nextId)) {
                        draws.push({
                            id: nextId,
                            drawDate: nextDate.toISOString(),
                            winningNumbers: [],
                            superNumber: -1,
                            jackpot: this.config.baseJackpot,
                            status: "pending",
                            totalTickets: 0
                        });
                    }
                    currentDrawId = nextId;
                }
            }
        }

        return createdTickets;
    }

    // ─── Results ──────────────────────────────────────────────────────────────

    getDrawResults(drawId: string): DrawResult {
        const draw = draws.find((d) => d.id === drawId);
        if (!draw) throw new NotFoundException(`Draw "${drawId}" not found`);
        if (draw.status !== "drawn") {
            throw new BadRequestException(`Draw "${drawId}" has not been drawn yet`);
        }

        const ticketsForDraw = tickets.filter((t) => t.drawId === drawId);
        const results = ticketsForDraw.map((ticket) => this.evaluateTicket(ticket, draw));
        const winners = results.filter((r) => r.prizeAmount > 0);
        const totalPrizesPaid = winners.reduce((sum, r) => sum + r.prizeAmount, 0);

        return { draw, totalTickets: ticketsForDraw.length, winners, totalPrizesPaid };
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

    getStats(): LottoStats {
        const drawnDraws = draws.filter((d) => d.status === "drawn");
        const allWinningNumbers = drawnDraws.flatMap((d) => d.winningNumbers);
        const numberFrequency = new Map<number, number>();
        for (let n = 1; n <= 49; n++) numberFrequency.set(n, 0);
        for (const n of allWinningNumbers) numberFrequency.set(n, (numberFrequency.get(n) ?? 0) + 1);

        const sorted = [...numberFrequency.entries()].sort((a, b) => b[1] - a[1]);
        const hotNumbers = sorted.slice(0, 10).map(([n]) => n);
        const coldNumbers = sorted.slice(-10).map(([n]) => n);

        const allResults = tickets.flatMap((t) => {
            const draw = draws.find((d) => d.id === t.drawId);
            if (!draw || draw.status !== "drawn") return [];
            return [this.evaluateTicket(t, draw)];
        });

        return {
            totalDraws: drawnDraws.length,
            totalTicketsSold: tickets.length,
            totalPrizePaid: allResults.reduce((sum, r) => sum + r.prizeAmount, 0),
            biggestJackpot: Math.max(...draws.map((d) => d.jackpot), 0),
            lastDraw: this.getLastDraw(),
            nextDraw: this.getNextDraw(),
            hotNumbers,
            coldNumbers
        };
    }

    /**
     * Returns the next UTC datetime that matches one of the configured draw days,
     * at the configured hour:minute. Always returns a future time.
     */
    nextDrawDate(): Date {
        return this.nextDrawDateAfter(new Date());
    }

    nextDrawDateAfter(after: Date): Date {
        const { drawDays, drawHourUtc, drawMinuteUtc } = this.config;
        for (let offset = 1; offset <= 8; offset++) {
            const candidate = new Date(after);
            candidate.setUTCDate(after.getUTCDate() + offset);
            candidate.setUTCHours(drawHourUtc, drawMinuteUtc, 0, 0);
            const dayOfWeek = candidate.getUTCDay() as Weekday;
            if (drawDays.includes(dayOfWeek) && candidate > after) {
                return candidate;
            }
        }
        const fallback = new Date(after);
        fallback.setUTCDate(after.getUTCDate() + 7);
        fallback.setUTCHours(drawHourUtc, drawMinuteUtc, 0, 0);
        return fallback;
    }

    // ─── Special draws ────────────────────────────────────────────────────────

    createSpecialDraw(dto: CreateSpecialDrawDto): SpecialDraw {
        if (!dto.name?.trim()) throw new BadRequestException("name is required");
        if (!dto.drawDate) throw new BadRequestException("drawDate is required");
        if (new Date(dto.drawDate) <= new Date()) throw new BadRequestException("drawDate must be in the future");

        const draw: SpecialDraw = {
            id: `special-${Date.now()}`,
            name: dto.name.trim(),
            drawDate: dto.drawDate,
            ticketMode: dto.ticketMode ?? "separate",
            prizeMode: dto.prizeMode ?? "standard",
            customJackpot: dto.customJackpot,
            singlePrizeClass: dto.singlePrizeClass,
            singlePrizeAmount: dto.singlePrizeAmount,
            ticketCost: dto.ticketCost,
            status: "pending",
            createdAt: new Date().toISOString()
        };
        specialDraws.push(draw);
        this.logger.log(`Special draw created: "${draw.id}" – "${draw.name}"`);
        return draw;
    }

    getAllSpecialDraws(): SpecialDraw[] {
        return specialDraws.map((d) => ({
            ...d,
            totalTickets:
                d.ticketMode === "all_current" ? tickets.length : specialTickets.filter((t) => t.drawId === d.id).length
        }));
    }

    async performSpecialDraw(drawId: string): Promise<SpecialDrawResult> {
        const draw = specialDraws.find((d) => d.id === drawId);
        if (!draw) throw new NotFoundException(`Special draw "${drawId}" not found`);
        if (draw.status === "drawn") throw new BadRequestException(`Special draw "${drawId}" has already been drawn`);

        const winningNumbers = this.drawUniqueNumbers(1, 49, 6);
        const superNumber = Math.floor(Math.random() * 10);
        draw.winningNumbers = winningNumbers;
        draw.superNumber = superNumber;
        draw.status = "drawn";

        const ticketsForDraw =
            draw.ticketMode === "all_current" ? tickets : specialTickets.filter((t) => t.drawId === drawId);
        const allResults = ticketsForDraw.map((ticket) => this.evaluateSpecialTicket(ticket, draw));
        const winners = allResults.filter((r) => r.prizeAmount > 0);
        const totalPrizesPaid = winners.reduce((sum, r) => sum + r.prizeAmount, 0);

        this.logger.log(
            `Special draw "${drawId}" completed. Numbers: [${winningNumbers.join(", ")}] Super: ${superNumber}. Winners: ${winners.length}`
        );

        for (const winner of winners) {
            try {
                await this.creditService.addCredits(
                    winner.userId,
                    winner.prizeAmount,
                    "lotto_special_win",
                    `Sonderziehung Gewinn "${draw.name}": ${winner.prizeClass} (${winner.prizeAmount} Credits)`
                );
                await this.notificationsService.create(
                    winner.userId,
                    "coins_received",
                    "Sonderziehung Gewinn!",
                    `${winner.prizeClass}: ${winner.prizeAmount} Coins gewonnen!`,
                    "/lotto"
                );
            } catch (err) {
                this.logger.error(`Failed to credit user ${winner.userId}: ${(err as Error).message}`);
            }
        }

        return { draw, totalTickets: ticketsForDraw.length, winners, totalPrizesPaid };
    }

    async purchaseSpecialTicket(
        userId: string,
        numbers: number[],
        superNumber: number,
        drawId: string
    ): Promise<LottoTicket> {
        this.validateNumbers(numbers, superNumber);
        const draw = specialDraws.find((d) => d.id === drawId);
        if (!draw) throw new NotFoundException(`Special draw "${drawId}" not found`);
        if (draw.status === "drawn") throw new BadRequestException("Special draw has already been drawn");
        if (draw.ticketMode !== "separate")
            throw new BadRequestException("This special draw uses all existing tickets");

        const cost = draw.ticketCost ?? this.config.ticketCost;
        await this.creditService.deductCredits(
            userId,
            cost,
            "lotto_special_ticket",
            `Sonderziehung Ticket "${draw.name}"`
        );

        const ticket: LottoTicket = {
            id: `sticket-${Date.now()}`,
            userId,
            numbers: [...numbers].sort((a, b) => a - b),
            superNumber,
            drawId,
            purchasedAt: new Date().toISOString(),
            cost
        };
        specialTickets.push(ticket);
        return ticket;
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

    private evaluateSpecialTicket(ticket: LottoTicket, draw: SpecialDraw): LottoResult {
        const matchedNumbers = ticket.numbers.filter((n) => (draw.winningNumbers ?? []).includes(n));
        const matchedCount = matchedNumbers.length;
        const superNumberMatched = ticket.superNumber === draw.superNumber;
        const prizeClass = this.determinePrizeClass(matchedCount, superNumberMatched);

        let prizeAmount: number;
        if (draw.prizeMode === "single_class") {
            prizeAmount =
                prizeClass !== "no_win" && draw.singlePrizeClass === prizeClass ? (draw.singlePrizeAmount ?? 0) : 0;
        } else if (draw.prizeMode === "custom_jackpot") {
            prizeAmount =
                prizeClass === "class1" ? (draw.customJackpot ?? PRIZE_TABLE.class1) : PRIZE_TABLE[prizeClass];
        } else {
            prizeAmount = PRIZE_TABLE[prizeClass];
        }

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
