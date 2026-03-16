import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity } from "../user/entities/user.entity";
import { CreateBotDto, UpdateBotDto } from "./dto/create-bot.dto";
import { BotLogEntity } from "./entities/bot-log.entity";
import { BotNotificationQueueEntity } from "./entities/bot-notification-queue.entity";
import { CommunityBotEntity } from "./entities/community-bot.entity";
import {
    ActionConfig,
    BotCondition,
    BotDto,
    BotLogDto,
    BotQueueItemDto,
    BotStats,
    TriggerConfig
} from "./models/bot.model";

export interface TriggerContext {
    user?: UserEntity;
    threadTitle?: string;
    forumId?: string;
    forumName?: string;
    inactiveDays?: number;
    oldGroupId?: string;
    newGroupId?: string;
    extra?: Record<string, unknown>;
}

@Injectable()
export class CommunityBotService {
    private readonly logger = new Logger(CommunityBotService.name);

    constructor(
        @InjectRepository(CommunityBotEntity)
        private readonly botRepo: Repository<CommunityBotEntity>,
        @InjectRepository(BotLogEntity)
        private readonly logRepo: Repository<BotLogEntity>,
        @InjectRepository(BotNotificationQueueEntity)
        private readonly queueRepo: Repository<BotNotificationQueueEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    // ─── CRUD ────────────────────────────────────────────────────────────────

    async findAll(): Promise<BotDto[]> {
        const bots = await this.botRepo.find({ order: { createdAt: "DESC" } });
        return bots.map((b) => this.toDto(b));
    }

    async findOne(id: string): Promise<BotDto | null> {
        const bot = await this.botRepo.findOne({ where: { id } });
        return bot ? this.toDto(bot) : null;
    }

    async create(dto: CreateBotDto): Promise<BotDto> {
        const bot = this.botRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            enabled: dto.enabled ?? true,
            testMode: dto.testMode ?? false,
            trigger: dto.trigger,
            triggerConfig: dto.triggerConfig ?? null,
            conditions: dto.conditions ?? null,
            action: dto.action,
            actionConfig: dto.actionConfig ?? null,
            language: dto.language ?? "auto"
        });
        const saved = await this.botRepo.save(bot);
        return this.toDto(saved);
    }

    async update(id: string, dto: UpdateBotDto): Promise<BotDto | null> {
        const bot = await this.botRepo.findOne({ where: { id } });
        if (!bot) return null;
        Object.assign(bot, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.enabled !== undefined && { enabled: dto.enabled }),
            ...(dto.testMode !== undefined && { testMode: dto.testMode }),
            ...(dto.trigger !== undefined && { trigger: dto.trigger }),
            ...(dto.triggerConfig !== undefined && { triggerConfig: dto.triggerConfig }),
            ...(dto.conditions !== undefined && { conditions: dto.conditions }),
            ...(dto.action !== undefined && { action: dto.action }),
            ...(dto.actionConfig !== undefined && { actionConfig: dto.actionConfig }),
            ...(dto.language !== undefined && { language: dto.language })
        });
        const saved = await this.botRepo.save(bot);
        return this.toDto(saved);
    }

    async remove(id: string): Promise<void> {
        await this.botRepo.delete(id);
    }

    async toggleEnabled(id: string): Promise<BotDto | null> {
        const bot = await this.botRepo.findOne({ where: { id } });
        if (!bot) return null;
        bot.enabled = !bot.enabled;
        return this.toDto(await this.botRepo.save(bot));
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    async getStats(): Promise<BotStats> {
        const [total, enabled] = await Promise.all([
            this.botRepo.count(),
            this.botRepo.count({ where: { enabled: true } })
        ]);
        const pendingQueue = await this.queueRepo.count({ where: { status: "pending" } });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const logsToday = await this.logRepo
            .createQueryBuilder("l")
            .where("l.created_at >= :start", { start: todayStart })
            .getCount();
        return { total, enabled, pendingQueue, logsToday };
    }

    // ─── Logs ─────────────────────────────────────────────────────────────────

    async getLogs(limit = 100, offset = 0, botId?: string): Promise<{ items: BotLogDto[]; total: number }> {
        const qb = this.logRepo.createQueryBuilder("l").orderBy("l.created_at", "DESC").skip(offset).take(limit);
        if (botId) qb.where("l.bot_id = :botId", { botId });
        const [logs, total] = await qb.getManyAndCount();
        return { items: logs.map((l) => this.toLogDto(l)), total };
    }

    async clearLogs(olderThanDays = 30): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        const result = await this.logRepo
            .createQueryBuilder()
            .delete()
            .where("created_at < :cutoff", { cutoff })
            .execute();
        return result.affected ?? 0;
    }

    // ─── Queue ────────────────────────────────────────────────────────────────

    async getQueue(limit = 50): Promise<BotQueueItemDto[]> {
        const items = await this.queueRepo.find({
            where: { status: "pending" },
            order: { createdAt: "ASC" },
            take: limit
        });
        return items.map((q) => this.toQueueDto(q));
    }

    // ─── Trigger dispatchers (called by other services / scheduler) ───────────

    async onNewUser(user: UserEntity): Promise<void> {
        await this.dispatchTrigger("new_user", { user });
    }

    async onNewThread(context: {
        threadId: string;
        threadTitle: string;
        forumId: string;
        forumName: string;
        authorId: string;
    }): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id: context.authorId } });
        await this.dispatchTrigger("new_thread", {
            user: user ?? undefined,
            threadTitle: context.threadTitle,
            forumId: context.forumId,
            forumName: context.forumName
        });
    }

    async onUserGroupChange(userId: string, oldGroupId: string | null, newGroupId: string): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        await this.dispatchTrigger("user_group_change", {
            user: user ?? undefined,
            oldGroupId: oldGroupId ?? undefined,
            newGroupId
        });
    }

    async runBirthdayBots(): Promise<void> {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Find users with birthday today (ignoring year)
        const users = await this.userRepo
            .createQueryBuilder("u")
            .where("EXTRACT(MONTH FROM u.birthday) = :month", { month })
            .andWhere("EXTRACT(DAY FROM u.birthday) = :day", { day })
            .andWhere("u.status = 'active'")
            .getMany();

        for (const user of users) {
            await this.dispatchTrigger("user_birthday", { user });
        }
    }

    async runInactivityBots(): Promise<void> {
        const bots = await this.botRepo.find({ where: { trigger: "user_inactivity", enabled: true } });
        for (const bot of bots) {
            const cfg = bot.triggerConfig as TriggerConfig | null;
            const days = cfg?.inactiveDays ?? 30;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            const users = await this.userRepo
                .createQueryBuilder("u")
                .where("u.last_seen_at < :cutoff OR (u.last_seen_at IS NULL AND u.created_at < :cutoff)", { cutoff })
                .andWhere("u.status = 'active'")
                .getMany();

            for (const user of users) {
                await this.processBotForUser(bot, { user, inactiveDays: days });
            }
            await this.botRepo.update(bot.id, { lastRunAt: new Date(), runCount: () => "run_count + 1" });
        }
    }

    async runScheduledBots(): Promise<void> {
        // Scheduled bots are handled by the scheduler service via dynamic cron jobs
        // This method is a placeholder for manual triggers
    }

    async testBot(id: string): Promise<BotLogDto[]> {
        const bot = await this.botRepo.findOne({ where: { id } });
        if (!bot) return [];

        const wasTestMode = bot.testMode;
        bot.testMode = true;

        // Use a dummy user context for testing
        const dummyUser = {
            id: "test",
            username: "TestUser",
            displayName: "Test User",
            email: "test@example.com"
        } as UserEntity;
        const logs: BotLogEntity[] = [];

        const log = this.logRepo.create({
            botId: bot.id,
            botName: bot.name,
            trigger: bot.trigger,
            action: bot.action,
            status: "test",
            targetUserId: dummyUser.id,
            targetUserName: dummyUser.username,
            message: `[TEST MODE] Bot "${bot.name}" would execute: ${bot.action}`,
            details: {
                triggerConfig: bot.triggerConfig,
                conditions: bot.conditions,
                actionConfig: bot.actionConfig,
                resolvedTemplate: this.resolveTemplate(bot.actionConfig?.notificationBody ?? "", { user: dummyUser })
            }
        });
        logs.push(await this.logRepo.save(log));

        if (!wasTestMode) bot.testMode = false;
        return logs.map((l) => this.toLogDto(l));
    }

    // ─── Queue processing (called by scheduler) ───────────────────────────────

    async processQueue(batchSize = 10): Promise<void> {
        const items = await this.queueRepo.find({
            where: { status: "pending" },
            order: { createdAt: "ASC" },
            take: batchSize
        });

        for (const item of items) {
            await this.queueRepo.update(item.id, { status: "processing" });
            try {
                await this.executeQueueItem(item);
                await this.queueRepo.update(item.id, { status: "done", processedAt: new Date() });
            } catch (err) {
                const retries = item.retries + 1;
                await this.queueRepo.update(item.id, {
                    status: retries >= 3 ? "failed" : "pending",
                    retries,
                    errorMessage: (err as Error).message
                });
                this.logger.error(`Queue item ${item.id} failed: ${(err as Error).message}`);
            }
        }
    }

    // ─── Core dispatch logic ──────────────────────────────────────────────────

    private async dispatchTrigger(trigger: CommunityBotEntity["trigger"], ctx: TriggerContext): Promise<void> {
        const bots = await this.botRepo.find({ where: { trigger, enabled: true } });
        for (const bot of bots) {
            if (ctx.user) {
                await this.processBotForUser(bot, ctx);
            } else {
                await this.processBotGlobal(bot, ctx);
            }
        }
    }

    private async processBotForUser(bot: CommunityBotEntity, ctx: TriggerContext): Promise<void> {
        try {
            // Evaluate conditions
            if (ctx.user && !this.evaluateConditions(bot.conditions ?? [], ctx.user)) {
                return; // Conditions not met, skip
            }

            if (bot.testMode) {
                await this.logRepo.save(
                    this.logRepo.create({
                        botId: bot.id,
                        botName: bot.name,
                        trigger: bot.trigger,
                        action: bot.action,
                        status: "test",
                        targetUserId: ctx.user?.id ?? null,
                        targetUserName: ctx.user?.username ?? null,
                        message: `[TEST] Would execute ${bot.action}`,
                        details: { ctx: { threadTitle: ctx.threadTitle, forumName: ctx.forumName } }
                    })
                );
                return;
            }

            await this.executeAction(bot, ctx);
            await this.logRepo.save(
                this.logRepo.create({
                    botId: bot.id,
                    botName: bot.name,
                    trigger: bot.trigger,
                    action: bot.action,
                    status: "success",
                    targetUserId: ctx.user?.id ?? null,
                    targetUserName: ctx.user?.username ?? null,
                    message: `Executed ${bot.action} for user ${ctx.user?.username ?? "unknown"}`
                })
            );
            await this.botRepo.update(bot.id, { lastRunAt: new Date(), runCount: () => "run_count + 1" });
        } catch (err) {
            await this.logRepo.save(
                this.logRepo.create({
                    botId: bot.id,
                    botName: bot.name,
                    trigger: bot.trigger,
                    action: bot.action,
                    status: "failed",
                    targetUserId: ctx.user?.id ?? null,
                    targetUserName: ctx.user?.username ?? null,
                    message: (err as Error).message
                })
            );
        }
    }

    private async processBotGlobal(bot: CommunityBotEntity, ctx: TriggerContext): Promise<void> {
        await this.processBotForUser(bot, ctx);
    }

    private async executeAction(bot: CommunityBotEntity, ctx: TriggerContext): Promise<void> {
        const cfg = bot.actionConfig as ActionConfig | null;

        switch (bot.action) {
            case "send_notification": {
                if (!ctx.user?.id) return;
                const title = this.resolveTemplate(cfg?.notificationTitle ?? "Community Bot", ctx);
                const body = this.resolveTemplate(cfg?.notificationBody ?? "", ctx);
                const link = cfg?.notificationLink ?? undefined;
                // Enqueue for background processing
                await this.queueRepo.save(
                    this.queueRepo.create({
                        botId: bot.id,
                        botName: bot.name,
                        type: "notification",
                        payload: { userId: ctx.user.id, title, body, link }
                    })
                );
                break;
            }
            case "send_private_message": {
                // Log only for now - message sending would integrate with MessagesService
                this.logger.log(
                    `[Bot ${bot.name}] Would send PM to ${ctx.user?.username ?? "unknown"}: ${cfg?.messageSubject}`
                );
                break;
            }
            case "log_only":
            default:
                // Already logged by caller
                break;
        }
    }

    private async executeQueueItem(item: BotNotificationQueueEntity): Promise<void> {
        if (item.type === "notification") {
            const p = item.payload as { userId: string; title: string; body: string; link?: string };
            await this.notificationsService.create(p.userId, "system", p.title, p.body, p.link);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private evaluateConditions(conditions: BotCondition[], user: UserEntity): boolean {
        for (const cond of conditions) {
            if (!this.evaluateCondition(cond, user)) return false;
        }
        return true;
    }

    private evaluateCondition(cond: BotCondition, user: UserEntity): boolean {
        let actual: string | number;
        switch (cond.field) {
            case "user_role":
                actual = user.role;
                break;
            case "user_group_id":
                // Check if user has group - simplified
                return true;
            case "user_post_count":
                return true; // Would need postCount field
            case "user_registration_days": {
                const days = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
                actual = days;
                break;
            }
            default:
                return true;
        }
        const val = cond.value;
        switch (cond.operator) {
            case "eq":
                return actual === val;
            case "ne":
                return actual !== val;
            case "gt":
                return typeof actual === "number" && typeof val === "number" && actual > val;
            case "lt":
                return typeof actual === "number" && typeof val === "number" && actual < val;
            case "gte":
                return typeof actual === "number" && typeof val === "number" && actual >= val;
            case "lte":
                return typeof actual === "number" && typeof val === "number" && actual <= val;
            default:
                return true;
        }
    }

    resolveTemplate(template: string, ctx: TriggerContext): string {
        const user = ctx.user;
        return template
            .replace(/\{\{username\}\}/g, user?.username ?? "")
            .replace(/\{\{displayName\}\}/g, user?.displayName ?? user?.username ?? "")
            .replace(/\{\{email\}\}/g, user?.email ?? "")
            .replace(/\{\{threadTitle\}\}/g, ctx.threadTitle ?? "")
            .replace(/\{\{forumName\}\}/g, ctx.forumName ?? "")
            .replace(/\{\{inactiveDays\}\}/g, String(ctx.inactiveDays ?? ""))
            .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("de-DE"));
    }

    private toDto(bot: CommunityBotEntity): BotDto {
        return {
            id: bot.id,
            name: bot.name,
            description: bot.description,
            enabled: bot.enabled,
            testMode: bot.testMode,
            trigger: bot.trigger,
            triggerConfig: bot.triggerConfig,
            conditions: bot.conditions,
            action: bot.action,
            actionConfig: bot.actionConfig,
            language: bot.language,
            lastRunAt: bot.lastRunAt,
            runCount: bot.runCount,
            createdAt: bot.createdAt,
            updatedAt: bot.updatedAt
        };
    }

    private toLogDto(log: BotLogEntity): BotLogDto {
        return {
            id: log.id,
            botId: log.botId,
            botName: log.botName,
            trigger: log.trigger,
            action: log.action,
            status: log.status,
            targetUserId: log.targetUserId,
            targetUserName: log.targetUserName,
            message: log.message,
            details: log.details,
            createdAt: log.createdAt
        };
    }

    private toQueueDto(q: BotNotificationQueueEntity): BotQueueItemDto {
        return {
            id: q.id,
            botId: q.botId,
            botName: q.botName,
            type: q.type,
            status: q.status,
            retries: q.retries,
            createdAt: q.createdAt
        };
    }
}
