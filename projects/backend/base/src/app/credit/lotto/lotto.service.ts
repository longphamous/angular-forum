import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../../notifications/notifications.service";
import { CreditService } from "../credit.service";
import { LottoConfigEntity } from "./entities/lotto-config.entity";
import { LottoDrawEntity } from "./entities/lotto-draw.entity";
import { LottoSpecialDrawEntity } from "./entities/lotto-special-draw.entity";
import { LottoStatsEntity } from "./entities/lotto-stats.entity";
import { LottoTicketEntity } from "./entities/lotto-ticket.entity";
import {
    CreateSpecialDrawDto,
    DrawHistoryEntry,
    DrawResult,
    DrawScheduleConfig,
    LottoDraw,
    LottoFieldResult,
    LottoPrizeClass,
    LottoResult,
    LottoStats,
    LottoTicket,
    SpecialDraw,
    SpecialDrawResult,
    Weekday
} from "./models/lotto.model";

/**
 * Prize pool distribution — modeled after German Lotto 6 aus 49.
 *
 * 50% of ticket revenue goes into the prize pool.
 * The pool is split across classes 1-8 by percentage.
 * Within each class, the amount is divided equally among all winners.
 * Class 9 has a fixed payout (5 credits per winner).
 *
 * If a class has no winners, its share rolls into the jackpot.
 */
const POOL_SHARE: Record<string, number> = {
    class1: 0.128, // 12.8%
    class2: 0.1, // 10.0%
    class3: 0.05, //  5.0%
    class4: 0.15, // 15.0%
    class5: 0.05, //  5.0%
    class6: 0.1, // 10.0%
    class7: 0.1, // 10.0%
    class8: 0.322 // 32.2% (remainder)
};

/** Class 9 always pays a fixed amount per winner. */
const CLASS_9_FIXED = 5;

/** Minimum payout per winner in each class (safety net). */
const MIN_PAYOUT: Record<string, number> = {
    class1: 100_000,
    class2: 10_000,
    class3: 1_000,
    class4: 100,
    class5: 50,
    class6: 20,
    class7: 10,
    class8: 5,
    class9: CLASS_9_FIXED,
    no_win: 0
};

/**
 * Legacy fixed table — used as fallback when there are 0 tickets (no pool).
 */
const PRIZE_TABLE: Record<LottoPrizeClass, number> = {
    class1: 0,
    class2: 0,
    class3: 0,
    class4: 0,
    class5: 0,
    class6: 0,
    class7: 0,
    class8: 0,
    class9: CLASS_9_FIXED,
    no_win: 0
};

const DEFAULT_CONFIG: DrawScheduleConfig = {
    drawDays: [6],
    drawHourUtc: 19,
    drawMinuteUtc: 0,
    baseJackpot: 1_000_000,
    rolloverPercentage: 50,
    ticketCost: 2
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawEntityToModel(e: LottoDrawEntity, totalTickets?: number): LottoDraw {
    return {
        id: e.id,
        drawDate: e.drawDate.toISOString(),
        winningNumbers: e.winningNumbers,
        superNumber: e.superNumber,
        jackpot: e.jackpot,
        status: e.status,
        totalTickets
    };
}

function ticketEntityToModel(e: LottoTicketEntity): LottoTicket {
    // Backward compat: if entity still has old `numbers` (single array), wrap it
    const fields: number[][] = Array.isArray(e.fields?.[0]) ? e.fields : [e.fields as unknown as number[]];
    return {
        id: e.id,
        userId: e.userId,
        fields,
        superNumber: e.superNumber,
        drawId: e.drawId,
        purchasedAt: e.purchasedAt.toISOString(),
        cost: e.cost,
        totalDraws: e.totalDraws ?? undefined,
        groupId: e.groupId ?? undefined
    };
}

function specialEntityToModel(e: LottoSpecialDrawEntity, totalTickets?: number): SpecialDraw {
    return {
        id: e.id,
        name: e.name,
        drawDate: e.drawDate.toISOString(),
        ticketMode: e.ticketMode,
        prizeMode: e.prizeMode,
        customJackpot: e.customJackpot ?? undefined,
        singlePrizeClass: (e.singlePrizeClass as LottoPrizeClass) ?? undefined,
        singlePrizeAmount: e.singlePrizeAmount ?? undefined,
        ticketCost: e.ticketCost ?? undefined,
        status: e.status,
        winningNumbers: e.winningNumbers ?? undefined,
        superNumber: e.superNumber ?? undefined,
        totalTickets,
        createdAt: e.createdAt.toISOString()
    };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class LottoService implements OnModuleInit {
    private readonly logger = new Logger(LottoService.name);
    private configCache: DrawScheduleConfig = { ...DEFAULT_CONFIG };

    constructor(
        @Inject(forwardRef(() => CreditService)) private readonly creditService: CreditService,
        private readonly notificationsService: NotificationsService,
        @InjectRepository(LottoDrawEntity) private readonly drawRepo: Repository<LottoDrawEntity>,
        @InjectRepository(LottoTicketEntity) private readonly ticketRepo: Repository<LottoTicketEntity>,
        @InjectRepository(LottoSpecialDrawEntity) private readonly specialDrawRepo: Repository<LottoSpecialDrawEntity>,
        @InjectRepository(LottoConfigEntity) private readonly configRepo: Repository<LottoConfigEntity>,
        @InjectRepository(LottoStatsEntity) private readonly statsRepo: Repository<LottoStatsEntity>
    ) {}

    async onModuleInit(): Promise<void> {
        await this.loadConfig();
        await this.ensureStats();
    }

    // ─── Config (persisted) ──────────────────────────────────────────────────

    private async loadConfig(): Promise<void> {
        let entity = await this.configRepo.findOneBy({ id: "default" });
        if (!entity) {
            entity = this.configRepo.create({
                id: "default",
                ...DEFAULT_CONFIG
            });
            await this.configRepo.save(entity);
            this.logger.log("Created default lotto config in DB");
        }
        this.configCache = {
            drawDays: entity.drawDays as Weekday[],
            drawHourUtc: entity.drawHourUtc,
            drawMinuteUtc: entity.drawMinuteUtc,
            baseJackpot: entity.baseJackpot,
            rolloverPercentage: entity.rolloverPercentage,
            ticketCost: entity.ticketCost
        };
    }

    getConfig(): DrawScheduleConfig {
        return { ...this.configCache };
    }

    async updateConfig(partial: Partial<DrawScheduleConfig>): Promise<DrawScheduleConfig> {
        if (partial.drawDays !== undefined) {
            if (!Array.isArray(partial.drawDays) || partial.drawDays.length === 0)
                throw new BadRequestException("drawDays must be a non-empty array");
            if (!partial.drawDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))
                throw new BadRequestException("drawDays values must be integers between 0 and 6");
        }
        if (partial.drawHourUtc !== undefined && (partial.drawHourUtc < 0 || partial.drawHourUtc > 23))
            throw new BadRequestException("drawHourUtc must be between 0 and 23");
        if (partial.drawMinuteUtc !== undefined && (partial.drawMinuteUtc < 0 || partial.drawMinuteUtc > 59))
            throw new BadRequestException("drawMinuteUtc must be between 0 and 59");
        if (
            partial.rolloverPercentage !== undefined &&
            (partial.rolloverPercentage < 0 || partial.rolloverPercentage > 100)
        )
            throw new BadRequestException("rolloverPercentage must be between 0 and 100");
        if (partial.baseJackpot !== undefined && partial.baseJackpot <= 0)
            throw new BadRequestException("baseJackpot must be greater than 0");
        if (partial.ticketCost !== undefined && partial.ticketCost <= 0)
            throw new BadRequestException("ticketCost must be greater than 0");

        const scheduleChanged =
            partial.drawDays !== undefined || partial.drawHourUtc !== undefined || partial.drawMinuteUtc !== undefined;

        this.configCache = { ...this.configCache, ...partial };

        // Persist to DB
        await this.configRepo.update("default", {
            drawDays: this.configCache.drawDays,
            drawHourUtc: this.configCache.drawHourUtc,
            drawMinuteUtc: this.configCache.drawMinuteUtc,
            baseJackpot: this.configCache.baseJackpot,
            rolloverPercentage: this.configCache.rolloverPercentage,
            ticketCost: this.configCache.ticketCost
        });

        this.logger.log(`Config updated and persisted: ${JSON.stringify(this.configCache)}`);

        if (scheduleChanged) {
            // Preserve the jackpot from the current pending draw before rescheduling
            const currentPending = await this.drawRepo.findOne({
                where: { status: "pending" },
                order: { drawDate: "ASC" }
            });
            const preservedJackpot = currentPending?.jackpot ?? this.configCache.baseJackpot;

            await this.drawRepo.delete({ status: "pending" });
            await this.scheduleNextDraw(preservedJackpot);
            this.logger.log(`Pending draws rescheduled after config change (jackpot preserved: ${preservedJackpot})`);
        }

        return { ...this.configCache };
    }

    // ─── Draws ───────────────────────────────────────────────────────────────

    async getAllDraws(): Promise<LottoDraw[]> {
        const entities = await this.drawRepo.find({ order: { drawDate: "DESC" } });
        // Self-healing: ensure at least one pending draw exists
        if (!entities.some((e) => e.status === "pending")) {
            await this.scheduleNextDraw();
        }
        const all = entities.length > 0 ? entities : await this.drawRepo.find({ order: { drawDate: "DESC" } });
        const result: LottoDraw[] = [];
        for (const e of all) {
            const count = await this.ticketRepo.count({ where: { drawId: e.id } });
            result.push(drawEntityToModel(e, count));
        }
        return result;
    }

    async getDrawById(id: string): Promise<LottoDraw> {
        const entity = await this.drawRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException(`Draw "${id}" not found`);
        const count = await this.ticketRepo.count({ where: { drawId: id } });
        return drawEntityToModel(entity, count);
    }

    async getNextDraw(): Promise<LottoDraw | null> {
        let entity = await this.drawRepo.findOne({ where: { status: "pending" }, order: { drawDate: "ASC" } });
        if (!entity) {
            // Self-healing: create a draw if none exists
            const created = await this.scheduleNextDraw();
            entity = await this.drawRepo.findOneBy({ id: created.id });
            if (!entity) return null;
        }
        const count = await this.ticketRepo.count({ where: { drawId: entity.id } });
        return drawEntityToModel(entity, count);
    }

    async getLastDraw(): Promise<LottoDraw | null> {
        const entity = await this.drawRepo.findOne({ where: { status: "drawn" }, order: { drawDate: "DESC" } });
        if (!entity) return null;
        const count = await this.ticketRepo.count({ where: { drawId: entity.id } });
        return drawEntityToModel(entity, count);
    }

    async performWeeklyDraw(drawId: string): Promise<DrawResult> {
        const draw = await this.drawRepo.findOneBy({ id: drawId });
        if (!draw) throw new NotFoundException(`Draw "${drawId}" not found`);
        if (draw.status === "drawn") throw new BadRequestException(`Draw "${drawId}" has already been drawn`);

        draw.winningNumbers = this.drawUniqueNumbers(1, 49, 6);
        draw.superNumber = Math.floor(Math.random() * 10);
        draw.status = "drawn";
        await this.drawRepo.save(draw);

        const ticketEntities = await this.ticketRepo.find({ where: { drawId } });
        const drawModel = drawEntityToModel(draw);
        const ticketModels = ticketEntities.map(ticketEntityToModel);

        // ── Pool-based prize calculation (like real Lotto 6aus49) ──────────
        // Step 1: Determine prize class for each field of each ticket
        const allFieldResults: {
            ticket: LottoTicket;
            fieldIndex: number;
            nums: number[];
            pc: LottoPrizeClass;
            matched: number[];
            superMatched: boolean;
        }[] = [];
        for (const ticket of ticketModels) {
            const superMatched = ticket.superNumber === drawModel.superNumber;
            for (let fi = 0; fi < ticket.fields.length; fi++) {
                const nums = ticket.fields[fi];
                const matched = nums.filter((n) => drawModel.winningNumbers.includes(n));
                const pc = this.determinePrizeClass(matched.length, superMatched);
                allFieldResults.push({ ticket, fieldIndex: fi, nums, pc, matched, superMatched });
            }
        }

        // Step 2: Count winners per class
        const winnersPerClass = new Map<LottoPrizeClass, number>();
        for (const fr of allFieldResults) {
            if (fr.pc !== "no_win") {
                winnersPerClass.set(fr.pc, (winnersPerClass.get(fr.pc) ?? 0) + 1);
            }
        }

        // ── Pool-based prize calculation (like German Lotto 6aus49) ──────
        //
        // Revenue pool = 50% of ticket revenue (this draw's sales only).
        // Jackpot = separate accumulated pot, only used for class 1.
        // Classes 2-8 are paid from the revenue pool only.
        // Class 9 = fixed amount per winner (always 5 credits).
        //
        // If a class has no winners, its revenue-pool share rolls into the
        // jackpot for the next draw. The jackpot itself also rolls if not won.

        const totalRevenue = ticketModels.reduce((sum, t) => sum + t.cost, 0);
        const revenuePool = Math.floor(totalRevenue * (this.configCache.rolloverPercentage / 100));

        // Step 4: Calculate payout per winner in each class
        const payoutPerWinner = new Map<LottoPrizeClass, number>();
        let unclaimedPool = 0; // from classes 2-8 with no winners

        // Class 1 (Jackpot): winners get the accumulated jackpot + class 1's share of revenue
        const class1Revenue = Math.floor(revenuePool * (POOL_SHARE["class1"] ?? 0));
        const class1Total = draw.jackpot + class1Revenue;
        const class1Winners = winnersPerClass.get("class1" as LottoPrizeClass) ?? 0;
        if (class1Winners > 0) {
            payoutPerWinner.set("class1" as LottoPrizeClass, Math.floor(class1Total / class1Winners));
        }
        // If not won, the entire class1Total rolls over (handled below)

        // Classes 2-8: paid from revenue pool only
        for (const [cls, share] of Object.entries(POOL_SHARE)) {
            if (cls === "class1") continue; // already handled
            const classPool = Math.floor(revenuePool * share);
            const winnerCount = winnersPerClass.get(cls as LottoPrizeClass) ?? 0;
            if (winnerCount > 0) {
                const perWinner = Math.max(MIN_PAYOUT[cls] ?? 1, Math.floor(classPool / winnerCount));
                payoutPerWinner.set(cls as LottoPrizeClass, perWinner);
            } else {
                unclaimedPool += classPool;
            }
        }
        // Class 9: fixed
        payoutPerWinner.set("class9", CLASS_9_FIXED);

        this.logger.log(
            `Pool calculation: revenue=${totalRevenue}, revenuePool=${revenuePool}, ` +
                `jackpot=${draw.jackpot}, class1Total=${class1Total}, unclaimed=${unclaimedPool}`
        );

        // Step 5: Build results with calculated amounts
        const ticketResults = new Map<string, LottoResult>();
        for (const fr of allFieldResults) {
            const amount = fr.pc === "no_win" ? 0 : (payoutPerWinner.get(fr.pc) ?? 0);
            let result = ticketResults.get(fr.ticket.id);
            if (!result) {
                result = {
                    ticketId: fr.ticket.id,
                    userId: fr.ticket.userId,
                    drawId: drawModel.id,
                    matchedNumbers: fr.matched,
                    matchedCount: fr.matched.length,
                    superNumberMatched: fr.superMatched,
                    prizeClass: fr.pc,
                    prizeAmount: 0,
                    fieldResults: []
                };
                ticketResults.set(fr.ticket.id, result);
            }
            result.fieldResults.push({
                fieldIndex: fr.fieldIndex,
                numbers: fr.nums,
                matchedNumbers: fr.matched,
                matchedCount: fr.matched.length,
                superNumberMatched: fr.superMatched,
                prizeClass: fr.pc,
                prizeAmount: amount
            });
            result.prizeAmount += amount;
            // Track best field for summary
            if (fr.matched.length > result.matchedCount || (fr.matched.length === result.matchedCount && amount > 0)) {
                result.matchedNumbers = fr.matched;
                result.matchedCount = fr.matched.length;
                result.prizeClass = fr.pc;
            }
        }

        const allResults = [...ticketResults.values()];
        const winners = allResults.filter((r) => r.prizeAmount > 0);
        const totalPrizesPaid = winners.reduce((sum, r) => sum + r.prizeAmount, 0);

        this.logger.log(
            `Draw "${drawId}" completed. RevenuePool: ${revenuePool}, Winners: ${winners.length}, Paid: ${totalPrizesPaid}, Unclaimed: ${unclaimedPool}`
        );

        // ── Credit winners ────────────────────────────────────────────────
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

        // ── Schedule next draw with rollover ──────────────────────────────
        // If jackpot WON:   next = baseJackpot + unclaimed (fresh start)
        // If jackpot NOT won: next = old jackpot + class1Revenue + unclaimed (accumulates)
        const hasJackpotWinner = class1Winners > 0;
        let nextJackpot: number;
        if (hasJackpotWinner) {
            // Jackpot was won — reset to base + any unclaimed from other classes
            nextJackpot = this.configCache.baseJackpot + unclaimedPool;
        } else {
            // Jackpot not won — old jackpot carries over + new revenue share + unclaimed
            nextJackpot = draw.jackpot + class1Revenue + unclaimedPool;
        }
        this.logger.log(
            hasJackpotWinner
                ? `Jackpot WON! Next: base=${this.configCache.baseJackpot} + unclaimed=${unclaimedPool} = ${nextJackpot}`
                : `No jackpot winner. Next: oldJackpot=${draw.jackpot} + class1Rev=${class1Revenue} + unclaimed=${unclaimedPool} = ${nextJackpot}`
        );
        await this.scheduleNextDraw(nextJackpot);

        // Persist stats
        await this.updateStatsAfterDraw(draw.winningNumbers, draw.jackpot, ticketModels.length, totalPrizesPaid);

        return { draw: drawModel, totalTickets: ticketModels.length, winners, totalPrizesPaid };
    }

    async scheduleNextDraw(jackpot?: number): Promise<LottoDraw> {
        const effectiveJackpot = jackpot ?? this.configCache.baseJackpot;

        // Check if there's already a pending draw — just update its jackpot
        const existingPending = await this.drawRepo.findOne({
            where: { status: "pending" },
            order: { drawDate: "ASC" }
        });
        if (existingPending) {
            // Only update if the new jackpot is higher (rollover grows)
            // or if explicitly provided (from performWeeklyDraw with exact value)
            if (jackpot !== undefined && existingPending.jackpot !== effectiveJackpot) {
                existingPending.jackpot = effectiveJackpot;
                await this.drawRepo.save(existingPending);
                this.logger.log(`Updated jackpot on "${existingPending.id}" to ${effectiveJackpot}`);
            }
            return drawEntityToModel(existingPending);
        }

        // No pending draw — create a new one
        const nextDate = this.nextDrawDate();
        const id = `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const entity = this.drawRepo.create({
            id,
            drawDate: nextDate,
            winningNumbers: [],
            superNumber: -1,
            jackpot: effectiveJackpot,
            status: "pending"
        });
        await this.drawRepo.save(entity);
        this.logger.log(`Next draw scheduled: "${id}" on ${nextDate.toISOString()} with jackpot ${effectiveJackpot}`);
        return drawEntityToModel(entity);
    }

    // ─── Tickets ─────────────────────────────────────────────────────────────

    async getTicketsByUser(userId: string): Promise<(LottoTicket & { remainingDraws?: number })[]> {
        const entities = await this.ticketRepo.find({ where: { userId }, order: { purchasedAt: "DESC" } });
        const tickets = entities.map(ticketEntityToModel);

        // Calculate remaining draws for grouped tickets
        const groupPendingCounts = new Map<string, number>();
        for (const entity of entities) {
            if (entity.groupId) {
                const draw = await this.drawRepo.findOneBy({ id: entity.drawId });
                if (draw && draw.status === "pending") {
                    groupPendingCounts.set(entity.groupId, (groupPendingCounts.get(entity.groupId) ?? 0) + 1);
                }
            }
        }

        return tickets.map((t) => ({
            ...t,
            remainingDraws: t.groupId ? (groupPendingCounts.get(t.groupId) ?? 0) : undefined
        }));
    }

    async purchaseTicket(
        userId: string,
        fields: number[][],
        superNumber: number,
        drawId: string,
        drawCount = 1
    ): Promise<LottoTicket[]> {
        if (!fields.length || fields.length > 12) throw new BadRequestException("1 to 12 fields required");
        for (const nums of fields) this.validateNumbers(nums, superNumber);

        const fieldCount = fields.length;
        const totalCost = this.configCache.ticketCost * fieldCount * Math.max(1, drawCount);

        await this.creditService.deductCredits(
            userId,
            totalCost,
            "lotto_ticket",
            `Lotto Ticket (${fieldCount} Felder, ${drawCount} Ziehung${drawCount > 1 ? "en" : ""})`
        );

        await this.notificationsService.create(
            userId,
            "system",
            "Lottoticket gekauft",
            `Du hast ein Ticket mit ${fieldCount} Feld${fieldCount > 1 ? "ern" : ""} für ${drawCount} Ziehung${drawCount > 1 ? "en" : ""} gekauft.`,
            "/lotto"
        );

        const sortedFields = fields.map((nums) => [...nums].sort((a, b) => a - b));
        const created: LottoTicket[] = [];
        let currentDrawId = drawId;
        const groupId = drawCount > 1 ? `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : undefined;

        for (let i = 0; i < Math.max(1, drawCount); i++) {
            const draw = await this.drawRepo.findOneBy({ id: currentDrawId });
            if (!draw) throw new BadRequestException(`Draw "${currentDrawId}" not found`);
            if (draw.status === "drawn")
                throw new BadRequestException(`Draw "${currentDrawId}" has already taken place`);

            const entity = this.ticketRepo.create({
                id: `ticket-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
                userId,
                fields: sortedFields,
                superNumber,
                drawId: currentDrawId,
                cost: this.configCache.ticketCost * fieldCount,
                totalDraws: drawCount > 1 ? drawCount : undefined,
                groupId
            });
            await this.ticketRepo.save(entity);
            created.push(ticketEntityToModel(entity));

            if (i < drawCount - 1) {
                const currentDrawDate = new Date(draw.drawDate);
                // Look for an existing pending draw after the current one
                const subsequent = await this.drawRepo
                    .createQueryBuilder("d")
                    .where("d.status = :status", { status: "pending" })
                    .andWhere("d.draw_date > :date", { date: currentDrawDate.toISOString() })
                    .andWhere("d.id != :currentId", { currentId: currentDrawId })
                    .orderBy("d.draw_date", "ASC")
                    .getOne();
                if (subsequent) {
                    currentDrawId = subsequent.id;
                } else {
                    // Calculate the next draw date relative to the current draw, not "now"
                    const nextDate = this.nextDrawDateAfter(currentDrawDate);
                    const newId = `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                    const newDraw = this.drawRepo.create({
                        id: newId,
                        drawDate: nextDate,
                        winningNumbers: [],
                        superNumber: -1,
                        jackpot: this.configCache.baseJackpot,
                        status: "pending"
                    });
                    await this.drawRepo.save(newDraw);
                    this.logger.log(`Multi-draw: scheduled "${newId}" on ${nextDate.toISOString()}`);
                    currentDrawId = newId;
                }
            }
        }
        await this.updateStatsTicketCount();
        return created;
    }

    // ─── Results ─────────────────────────────────────────────────────────────

    async getDrawResults(drawId: string): Promise<DrawResult> {
        const draw = await this.drawRepo.findOneBy({ id: drawId });
        if (!draw) throw new NotFoundException(`Draw "${drawId}" not found`);
        if (draw.status !== "drawn") throw new BadRequestException(`Draw "${drawId}" has not been drawn yet`);

        const drawModel = drawEntityToModel(draw);
        const ticketEntities = await this.ticketRepo.find({ where: { drawId } });
        const ticketModels = ticketEntities.map(ticketEntityToModel);
        const results = ticketModels.map((t) => this.evaluateTicket(t, drawModel));
        const winners = results.filter((r) => r.prizeAmount > 0);
        return {
            draw: drawModel,
            totalTickets: ticketModels.length,
            winners,
            totalPrizesPaid: winners.reduce((s, r) => s + r.prizeAmount, 0)
        };
    }

    async getDrawHistory(): Promise<DrawHistoryEntry[]> {
        const history: DrawHistoryEntry[] = [];

        const drawnDraws = await this.drawRepo.find({ where: { status: "drawn" }, order: { drawDate: "DESC" } });
        for (const draw of drawnDraws) {
            const ticketEntities = await this.ticketRepo.find({ where: { drawId: draw.id } });
            const drawModel = drawEntityToModel(draw);
            const results = ticketEntities.map(ticketEntityToModel).map((t) => this.evaluateTicket(t, drawModel));
            const winners = results.filter((r) => r.prizeAmount > 0);
            history.push(this.buildHistoryEntry(draw.id, "regular", drawModel, ticketEntities.length, winners));
        }

        const drawnSpecials = await this.specialDrawRepo.find({
            where: { status: "drawn" },
            order: { drawDate: "DESC" }
        });
        for (const sd of drawnSpecials) {
            const sdModel = specialEntityToModel(sd);
            const ticketEntities =
                sd.ticketMode === "all_current"
                    ? await this.ticketRepo.find()
                    : await this.ticketRepo.find({ where: { drawId: sd.id } });
            const mockDraw: LottoDraw = {
                id: sd.id,
                drawDate: sd.drawDate.toISOString(),
                winningNumbers: sd.winningNumbers ?? [],
                superNumber: sd.superNumber ?? 0,
                jackpot: sd.customJackpot ?? 0,
                status: "drawn"
            };
            const results = ticketEntities.map(ticketEntityToModel).map((t) => this.evaluateSpecialTicket(t, sdModel));
            const winners = results.filter((r) => r.prizeAmount > 0);
            history.push(this.buildHistoryEntry(sd.id, "special", mockDraw, ticketEntities.length, winners, sd.name));
        }

        return history.sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
    }

    async getUserResults(userId: string, drawId?: string): Promise<LottoResult[]> {
        const where: Record<string, string> = { userId };
        if (drawId) where["drawId"] = drawId;
        const userTickets = await this.ticketRepo.find({ where });

        const results: LottoResult[] = [];
        for (const te of userTickets) {
            const draw = await this.drawRepo.findOneBy({ id: te.drawId });
            if (!draw || draw.status !== "drawn") continue;
            results.push(this.evaluateTicket(ticketEntityToModel(te), drawEntityToModel(draw)));
        }
        return results;
    }

    async getStats(): Promise<LottoStats> {
        const stats = await this.statsRepo.findOneBy({ id: "default" });
        const freq = stats?.numberFrequency ?? {};

        // Build sorted frequency list for all 49 numbers
        const numberFrequency = Array.from({ length: 49 }, (_, i) => ({
            number: i + 1,
            count: freq[String(i + 1)] ?? 0
        }));
        const sorted = [...numberFrequency].sort((a, b) => b.count - a.count);
        const hotNumbers = sorted.slice(0, 10).map((e) => e.number);
        const coldNumbers = sorted.slice(-10).map((e) => e.number);

        return {
            totalDraws: stats?.totalDraws ?? 0,
            totalTicketsSold: stats?.totalTicketsSold ?? 0,
            totalPrizePaid: Number(stats?.totalPrizePaid ?? 0),
            biggestJackpot: stats?.biggestJackpot ?? 0,
            lastDraw: await this.getLastDraw(),
            nextDraw: await this.getNextDraw(),
            hotNumbers,
            coldNumbers,
            numberFrequency
        };
    }

    // ─── Stats persistence ───────────────────────────────────────────────────

    /** Ensure the singleton stats row exists. If not, rebuild from DB. */
    private async ensureStats(): Promise<void> {
        const stats = await this.statsRepo.findOneBy({ id: "default" });
        if (!stats) {
            this.logger.log("Stats row missing — rebuilding from historical data...");
            await this.rebuildStats();
        } else if (stats.totalDraws === 0) {
            // Might be a fresh row but with existing draws — check
            const drawCount = await this.drawRepo.count({ where: { status: "drawn" } });
            if (drawCount > 0) {
                this.logger.log("Stats are stale — rebuilding...");
                await this.rebuildStats();
            }
        }
    }

    /** Full rebuild of stats from all historical draws — only runs once or on demand. */
    async rebuildStats(): Promise<void> {
        const drawnDraws = await this.drawRepo.find({ where: { status: "drawn" } });
        const allDraws = await this.drawRepo.find();
        const ticketCount = await this.ticketRepo.count();

        const numberFrequency: Record<string, number> = {};
        for (let n = 1; n <= 49; n++) numberFrequency[String(n)] = 0;

        let totalPrizePaid = 0;

        for (const draw of drawnDraws) {
            // Count winning number frequencies
            for (const n of draw.winningNumbers) {
                numberFrequency[String(n)] = (numberFrequency[String(n)] ?? 0) + 1;
            }

            // Calculate prizes paid for this draw
            const ticketEntities = await this.ticketRepo.find({ where: { drawId: draw.id } });
            const drawModel = drawEntityToModel(draw);
            for (const te of ticketEntities) {
                totalPrizePaid += this.evaluateTicket(ticketEntityToModel(te), drawModel).prizeAmount;
            }
        }

        // Also count special draws
        const drawnSpecials = await this.specialDrawRepo.find({ where: { status: "drawn" } });
        for (const sd of drawnSpecials) {
            if (sd.winningNumbers) {
                for (const n of sd.winningNumbers) {
                    numberFrequency[String(n)] = (numberFrequency[String(n)] ?? 0) + 1;
                }
            }
        }

        const biggest = allDraws.length > 0 ? Math.max(...allDraws.map((d) => d.jackpot)) : 0;

        await this.statsRepo.save({
            id: "default",
            totalDraws: drawnDraws.length + drawnSpecials.length,
            totalTicketsSold: ticketCount,
            totalPrizePaid,
            biggestJackpot: biggest,
            numberFrequency
        });

        this.logger.log(
            `Stats rebuilt: ${drawnDraws.length + drawnSpecials.length} draws, ${ticketCount} tickets, ${totalPrizePaid} paid`
        );
    }

    /** Incrementally update stats after a single draw completes. */
    private async updateStatsAfterDraw(
        winningNumbers: number[],
        jackpot: number,
        ticketCount: number,
        prizesPaid: number
    ): Promise<void> {
        let stats = await this.statsRepo.findOneBy({ id: "default" });
        if (!stats) {
            stats = this.statsRepo.create({
                id: "default",
                totalDraws: 0,
                totalTicketsSold: 0,
                totalPrizePaid: 0,
                biggestJackpot: 0,
                numberFrequency: {}
            });
        }

        stats.totalDraws += 1;
        stats.totalTicketsSold = await this.ticketRepo.count(); // accurate total
        stats.totalPrizePaid = Number(stats.totalPrizePaid) + prizesPaid;
        if (jackpot > stats.biggestJackpot) stats.biggestJackpot = jackpot;

        // Update number frequency
        const freq = stats.numberFrequency ?? {};
        for (const n of winningNumbers) {
            freq[String(n)] = (freq[String(n)] ?? 0) + 1;
        }
        stats.numberFrequency = freq;

        await this.statsRepo.save(stats);
    }

    /** Update ticket count in stats (called after purchase). */
    private async updateStatsTicketCount(): Promise<void> {
        const count = await this.ticketRepo.count();
        await this.statsRepo.update("default", { totalTicketsSold: count });
    }

    // ─── Schedule helpers ────────────────────────────────────────────────────

    nextDrawDate(): Date {
        return this.nextDrawDateAfter(new Date());
    }

    nextDrawDateAfter(after: Date): Date {
        const { drawDays, drawHourUtc, drawMinuteUtc } = this.configCache;
        // Start from offset 0 (today) so that a draw later today is not skipped
        for (let offset = 0; offset <= 7; offset++) {
            const candidate = new Date(after);
            candidate.setUTCDate(after.getUTCDate() + offset);
            candidate.setUTCHours(drawHourUtc, drawMinuteUtc, 0, 0);
            if (drawDays.includes(candidate.getUTCDay() as Weekday) && candidate > after) return candidate;
        }
        // Fallback: next occurrence of the first configured day
        const fallback = new Date(after);
        fallback.setUTCDate(after.getUTCDate() + 1);
        fallback.setUTCHours(drawHourUtc, drawMinuteUtc, 0, 0);
        while (!drawDays.includes(fallback.getUTCDay() as Weekday)) {
            fallback.setUTCDate(fallback.getUTCDate() + 1);
        }
        return fallback;
    }

    // ─── Special draws ───────────────────────────────────────────────────────

    async createSpecialDraw(dto: CreateSpecialDrawDto): Promise<SpecialDraw> {
        if (!dto.name?.trim()) throw new BadRequestException("name is required");
        if (!dto.drawDate) throw new BadRequestException("drawDate is required");
        if (new Date(dto.drawDate) <= new Date()) throw new BadRequestException("drawDate must be in the future");

        const entity = this.specialDrawRepo.create({
            id: `special-${Date.now()}`,
            name: dto.name.trim(),
            drawDate: new Date(dto.drawDate),
            ticketMode: dto.ticketMode ?? "separate",
            prizeMode: dto.prizeMode ?? "standard",
            customJackpot: dto.customJackpot ?? undefined,
            singlePrizeClass: dto.singlePrizeClass ?? undefined,
            singlePrizeAmount: dto.singlePrizeAmount ?? undefined,
            ticketCost: dto.ticketCost ?? undefined,
            status: "pending"
        });
        await this.specialDrawRepo.save(entity);
        this.logger.log(`Special draw created: "${entity.id}"`);
        return specialEntityToModel(entity);
    }

    async getAllSpecialDraws(): Promise<SpecialDraw[]> {
        const entities = await this.specialDrawRepo.find({ order: { drawDate: "DESC" } });
        const result: SpecialDraw[] = [];
        for (const e of entities) {
            const count =
                e.ticketMode === "all_current"
                    ? await this.ticketRepo.count()
                    : await this.ticketRepo.count({ where: { drawId: e.id } });
            result.push(specialEntityToModel(e, count));
        }
        return result;
    }

    async performSpecialDraw(drawId: string): Promise<SpecialDrawResult> {
        const draw = await this.specialDrawRepo.findOneBy({ id: drawId });
        if (!draw) throw new NotFoundException(`Special draw "${drawId}" not found`);
        if (draw.status === "drawn") throw new BadRequestException(`Special draw "${drawId}" has already been drawn`);

        draw.winningNumbers = this.drawUniqueNumbers(1, 49, 6);
        draw.superNumber = Math.floor(Math.random() * 10);
        draw.status = "drawn";
        await this.specialDrawRepo.save(draw);

        const sdModel = specialEntityToModel(draw);
        const ticketEntities =
            draw.ticketMode === "all_current"
                ? await this.ticketRepo.find()
                : await this.ticketRepo.find({ where: { drawId } });
        const ticketModels = ticketEntities.map(ticketEntityToModel);
        const allResults = ticketModels.map((t) => this.evaluateSpecialTicket(t, sdModel));
        const winners = allResults.filter((r) => r.prizeAmount > 0);
        const totalPrizesPaid = winners.reduce((sum, r) => sum + r.prizeAmount, 0);

        for (const winner of winners) {
            try {
                await this.creditService.addCredits(
                    winner.userId,
                    winner.prizeAmount,
                    "lotto_special_win",
                    `Sonderziehung Gewinn "${draw.name}": ${winner.prizeClass}`
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

        // Persist stats incrementally
        await this.updateStatsAfterDraw(
            draw.winningNumbers ?? [],
            draw.customJackpot ?? 0,
            ticketModels.length,
            totalPrizesPaid
        );

        return { draw: sdModel, totalTickets: ticketModels.length, winners, totalPrizesPaid };
    }

    async purchaseSpecialTicket(
        userId: string,
        fields: number[][],
        superNumber: number,
        drawId: string
    ): Promise<LottoTicket> {
        if (!fields.length || fields.length > 12) throw new BadRequestException("1 to 12 fields required");
        for (const nums of fields) this.validateNumbers(nums, superNumber);

        const draw = await this.specialDrawRepo.findOneBy({ id: drawId });
        if (!draw) throw new NotFoundException(`Special draw "${drawId}" not found`);
        if (draw.status === "drawn") throw new BadRequestException("Special draw has already been drawn");
        if (draw.ticketMode !== "separate")
            throw new BadRequestException("This special draw uses all existing tickets");

        const costPerField = draw.ticketCost ?? this.configCache.ticketCost;
        const totalCost = costPerField * fields.length;
        await this.creditService.deductCredits(
            userId,
            totalCost,
            "lotto_special_ticket",
            `Sonderziehung Ticket "${draw.name}"`
        );

        const entity = this.ticketRepo.create({
            id: `sticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId,
            fields: fields.map((nums) => [...nums].sort((a, b) => a - b)),
            superNumber,
            drawId,
            cost: totalCost
        });
        await this.ticketRepo.save(entity);
        await this.updateStatsTicketCount();
        return ticketEntityToModel(entity);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private buildHistoryEntry(
        id: string,
        type: "regular" | "special",
        draw: LottoDraw,
        totalTickets: number,
        winners: LottoResult[],
        name?: string
    ): DrawHistoryEntry {
        const classCounts = new Map<LottoPrizeClass, { count: number; amount: number }>();
        for (const r of winners) {
            const entry = classCounts.get(r.prizeClass) ?? { count: 0, amount: 0 };
            entry.count += 1;
            entry.amount += r.prizeAmount;
            classCounts.set(r.prizeClass, entry);
        }
        return {
            id,
            type,
            name,
            drawDate: draw.drawDate,
            winningNumbers: draw.winningNumbers,
            superNumber: draw.superNumber,
            jackpot: draw.jackpot,
            totalTickets,
            totalWinners: winners.length,
            totalPrizesPaid: winners.reduce((s, r) => s + r.prizeAmount, 0),
            winnersByClass: [...classCounts.entries()].map(([prizeClass, data]) => ({ prizeClass, ...data }))
        };
    }

    private evaluateTicket(ticket: LottoTicket, draw: LottoDraw): LottoResult {
        const superMatched = ticket.superNumber === draw.superNumber;
        const fieldResults: LottoFieldResult[] = ticket.fields.map((nums, idx) => {
            const matched = nums.filter((n) => draw.winningNumbers.includes(n));
            const pc = this.determinePrizeClass(matched.length, superMatched);
            return {
                fieldIndex: idx,
                numbers: nums,
                matchedNumbers: matched,
                matchedCount: matched.length,
                superNumberMatched: superMatched,
                prizeClass: pc,
                prizeAmount: pc === "class1" ? draw.jackpot : PRIZE_TABLE[pc]
            };
        });

        const totalPrize = fieldResults.reduce((s, f) => s + f.prizeAmount, 0);
        const best = fieldResults.reduce((a, b) => (b.prizeAmount > a.prizeAmount ? b : a), fieldResults[0]);

        return {
            ticketId: ticket.id,
            userId: ticket.userId,
            drawId: draw.id,
            matchedNumbers: best.matchedNumbers,
            matchedCount: best.matchedCount,
            superNumberMatched: superMatched,
            prizeClass: best.prizeClass,
            prizeAmount: totalPrize,
            fieldResults
        };
    }

    private evaluateSpecialTicket(ticket: LottoTicket, draw: SpecialDraw): LottoResult {
        const superMatched = ticket.superNumber === (draw.superNumber ?? -1);
        const fieldResults: LottoFieldResult[] = ticket.fields.map((nums, idx) => {
            const matched = nums.filter((n) => (draw.winningNumbers ?? []).includes(n));
            const pc = this.determinePrizeClass(matched.length, superMatched);

            let amount: number;
            if (draw.prizeMode === "single_class") {
                amount = pc !== "no_win" && draw.singlePrizeClass === pc ? (draw.singlePrizeAmount ?? 0) : 0;
            } else if (draw.prizeMode === "custom_jackpot") {
                amount = pc === "class1" ? (draw.customJackpot ?? PRIZE_TABLE.class1) : PRIZE_TABLE[pc];
            } else {
                amount = PRIZE_TABLE[pc];
            }

            return {
                fieldIndex: idx,
                numbers: nums,
                matchedNumbers: matched,
                matchedCount: matched.length,
                superNumberMatched: superMatched,
                prizeClass: pc,
                prizeAmount: amount
            };
        });

        const totalPrize = fieldResults.reduce((s, f) => s + f.prizeAmount, 0);
        const best = fieldResults.reduce((a, b) => (b.prizeAmount > a.prizeAmount ? b : a), fieldResults[0]);

        return {
            ticketId: ticket.id,
            userId: ticket.userId,
            drawId: draw.id,
            matchedNumbers: best.matchedNumbers,
            matchedCount: best.matchedCount,
            superNumberMatched: superMatched,
            prizeClass: best.prizeClass,
            prizeAmount: totalPrize,
            fieldResults
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
        if (numbers.length !== 6) throw new BadRequestException("Exactly 6 numbers must be provided");
        if (new Set(numbers).size !== 6) throw new BadRequestException("Numbers must be unique");
        if (numbers.some((n) => n < 1 || n > 49)) throw new BadRequestException("Numbers must be between 1 and 49");
        if (superNumber < 0 || superNumber > 9) throw new BadRequestException("Super number must be between 0 and 9");
    }
}
