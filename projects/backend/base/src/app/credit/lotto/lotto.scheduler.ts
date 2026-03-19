import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";

import { LottoService } from "./lotto.service";
import { DrawScheduleConfig, Weekday } from "./models/lotto.model";

/**
 * Manages dynamic cron jobs for the lotto draw schedule.
 *
 * One cron job is registered per configured draw day so that draws fire
 * automatically at the configured UTC time on the configured weekdays.
 *
 * Additionally runs a catch-up check every 5 minutes to handle overdue draws
 * that were missed (e.g. because the server was down during the scheduled time).
 */
@Injectable()
export class LottoScheduler implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(LottoScheduler.name);
    private readonly JOB_PREFIX = "lotto-draw-day-";
    private catchUpInterval: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly lottoService: LottoService,
        private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    async onModuleInit(): Promise<void> {
        // Small delay to let LottoService.onModuleInit() load config from DB first
        await new Promise((r) => setTimeout(r, 500));

        const config = this.lottoService.getConfig();
        this.logger.log(
            `Config loaded: drawDays=${JSON.stringify(config.drawDays)}, time=${config.drawHourUtc}:${config.drawMinuteUtc} UTC`
        );

        // Ensure at least one upcoming draw exists
        await this.lottoService.scheduleNextDraw();

        // Register cron jobs for configured draw days
        this.registerJobs(config);

        // Catch-up: check every 5 minutes for overdue draws
        this.catchUpInterval = setInterval(() => void this.catchUpOverdueDraws(), 5 * 60_000);

        // Also run catch-up immediately on startup
        await this.catchUpOverdueDraws();
    }

    onModuleDestroy(): void {
        this.removeAllJobs();
        if (this.catchUpInterval) clearInterval(this.catchUpInterval);
    }

    /**
     * Replaces all existing lotto cron jobs with jobs built from the new config.
     * Called by the controller whenever the schedule config is updated.
     */
    updateSchedule(config: DrawScheduleConfig): void {
        this.removeAllJobs();
        this.registerJobs(config);
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    private registerJobs(config: DrawScheduleConfig): void {
        const { drawDays, drawHourUtc, drawMinuteUtc } = config;

        for (const day of drawDays) {
            const jobName = `${this.JOB_PREFIX}${day}`;
            const cronExpression = this.buildCronExpression(drawMinuteUtc, drawHourUtc, day);

            const job = new CronJob(cronExpression, () => void this.runDraw(), undefined, true, "UTC");

            this.schedulerRegistry.addCronJob(jobName, job);
            this.logger.log(`Registered cron job "${jobName}" — "${cronExpression}" (UTC)`);
        }
    }

    private removeAllJobs(): void {
        const cronJobs = this.schedulerRegistry.getCronJobs();
        for (const [name] of cronJobs) {
            if (name.startsWith(this.JOB_PREFIX)) {
                this.schedulerRegistry.deleteCronJob(name);
                this.logger.log(`Removed cron job "${name}"`);
            }
        }
    }

    /**
     * Checks for any overdue pending draws and performs them.
     * This handles cases where the server was down during the scheduled time.
     */
    private async catchUpOverdueDraws(): Promise<void> {
        const now = new Date();
        const allDraws = await this.lottoService.getAllDraws();
        const overdue = allDraws.filter((d) => d.status === "pending" && new Date(d.drawDate) <= now);

        if (overdue.length === 0) return;

        this.logger.log(`Found ${overdue.length} overdue draw(s) — performing catch-up...`);

        for (const draw of overdue) {
            try {
                const result = await this.lottoService.performWeeklyDraw(draw.id);
                this.logger.log(
                    `Catch-up draw "${draw.id}" completed. ` +
                        `Tickets: ${result.totalTickets}, Winners: ${result.winners.length}`
                );
            } catch (err) {
                this.logger.error(`Failed catch-up draw "${draw.id}": ${(err as Error).message}`);
            }
        }

        // performWeeklyDraw already calls scheduleNextDraw with the correct jackpot.
        // No need to call it again here — that would overwrite the rollover jackpot.
    }

    /**
     * Triggered automatically by each cron job at the scheduled time.
     */
    private async runDraw(): Promise<void> {
        const now = new Date();
        const allDraws = await this.lottoService.getAllDraws();
        const due = allDraws.find((d) => d.status === "pending" && new Date(d.drawDate) <= now);

        if (!due) {
            this.logger.warn("Cron triggered but no pending draw due — scheduling next draw");
            await this.lottoService.scheduleNextDraw();
            return;
        }

        this.logger.log(`Auto-performing draw "${due.id}"`);
        try {
            const result = await this.lottoService.performWeeklyDraw(due.id);
            this.logger.log(
                `Draw "${due.id}" completed. ` +
                    `Tickets: ${result.totalTickets}, Winners: ${result.winners.length}, Prizes: ${result.totalPrizesPaid}`
            );
        } catch (err) {
            this.logger.error(`Failed draw "${due.id}": ${(err as Error).message}`);
        }
    }

    private buildCronExpression(minute: number, hour: number, weekday: Weekday): string {
        return `${minute} ${hour} * * ${weekday}`;
    }
}
