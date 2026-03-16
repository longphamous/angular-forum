import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";

import { CommunityBotService } from "./community-bot.service";

@Injectable()
export class BotSchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BotSchedulerService.name);

    constructor(
        private readonly botService: CommunityBotService,
        private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    onModuleInit(): void {
        this.registerFixedJobs();
    }

    onModuleDestroy(): void {
        this.removeAllBotJobs();
    }

    private registerFixedJobs(): void {
        // Process queue every minute
        const queueJob = new CronJob("* * * * *", () => void this.botService.processQueue(20), undefined, true, "UTC");
        this.schedulerRegistry.addCronJob("community-bot-queue-processor", queueJob);
        this.logger.log("Registered queue processor cron (every minute)");

        // Birthday check at 08:00 UTC daily
        const birthdayJob = new CronJob(
            "0 8 * * *",
            () => void this.botService.runBirthdayBots(),
            undefined,
            true,
            "UTC"
        );
        this.schedulerRegistry.addCronJob("community-bot-birthday", birthdayJob);
        this.logger.log("Registered birthday bot cron (08:00 UTC daily)");

        // Inactivity check at 09:00 UTC daily
        const inactivityJob = new CronJob(
            "0 9 * * *",
            () => void this.botService.runInactivityBots(),
            undefined,
            true,
            "UTC"
        );
        this.schedulerRegistry.addCronJob("community-bot-inactivity", inactivityJob);
        this.logger.log("Registered inactivity bot cron (09:00 UTC daily)");
    }

    private removeAllBotJobs(): void {
        const jobs = this.schedulerRegistry.getCronJobs();
        for (const [name] of jobs) {
            if (name.startsWith("community-bot-")) {
                this.schedulerRegistry.deleteCronJob(name);
            }
        }
    }
}
