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
 * When the config is updated via updateSchedule(), all existing jobs are
 * removed and replaced with new ones matching the new config.
 */
@Injectable()
export class LottoScheduler implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(LottoScheduler.name);
    private readonly JOB_PREFIX = "lotto-draw-day-";

    constructor(
        private readonly lottoService: LottoService,
        private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    onModuleInit(): void {
        // Ensure at least one upcoming draw exists on startup
        this.lottoService.scheduleNextDraw();
        this.registerJobs(this.lottoService.getConfig());
    }

    onModuleDestroy(): void {
        this.removeAllJobs();
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

        // Cron expression: "<minute> <hour> * * <weekday>"
        for (const day of drawDays) {
            const jobName = `${this.JOB_PREFIX}${day}`;
            const cronExpression = this.buildCronExpression(drawMinuteUtc, drawHourUtc, day);

            const job = new CronJob(cronExpression, () => this.runDraw(), undefined, true, "UTC");

            this.schedulerRegistry.addCronJob(jobName, job);
            this.logger.log(`Registered cron job "${jobName}" with expression "${cronExpression}" (UTC)`);
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
     * Triggered automatically by each cron job.
     * Finds the next pending draw whose drawDate is in the past (or now),
     * executes it, and the service will schedule the following one automatically.
     */
    private runDraw(): void {
        const now = new Date();
        const allDraws = this.lottoService.getAllDraws();
        const due = allDraws.find((d) => d.status === "pending" && new Date(d.drawDate) <= now);

        if (!due) {
            this.logger.warn("Scheduled draw triggered but no pending draw found – creating next draw");
            this.lottoService.scheduleNextDraw();
            return;
        }

        this.logger.log(`Auto-performing draw "${due.id}"`);
        try {
            const result = this.lottoService.performWeeklyDraw(due.id);
            this.logger.log(
                `Draw "${due.id}" completed automatically. ` +
                    `Tickets: ${result.totalTickets}, Winners: ${result.winners.length}, Prizes paid: ${result.totalPrizesPaid}`
            );
        } catch (err) {
            this.logger.error(`Failed to perform draw "${due.id}": ${(err as Error).message}`);
        }
    }

    /** Builds a standard cron expression for a given minute, hour and weekday (0=Sun, 6=Sat). */
    private buildCronExpression(minute: number, hour: number, weekday: Weekday): string {
        return `${minute} ${hour} * * ${weekday}`;
    }
}
