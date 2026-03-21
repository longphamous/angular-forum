import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { AchievementEntity } from "./entities/achievement.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { AchievementService } from "./achievement.service";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpConfigEntity } from "./entities/xp-config.entity";
import { XpEventEntity, XpEventType } from "./entities/xp-event.entity";
import { getLevelForXp, getXpProgressPercent, getXpToNextLevel, UserXpData } from "./level.config";

export interface XpConfigDto {
    eventType: string;
    xpAmount: number;
    label: string;
    description?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class GamificationService implements OnModuleInit {
    private readonly logger = new Logger(GamificationService.name);

    // Simple in-memory cache for XP config (refreshed on update or after TTL)
    private configCache: Map<string, number> | null = null;
    private configCacheAt = 0;
    private readonly CONFIG_TTL_MS = 60_000; // 1 minute

    constructor(
        @InjectRepository(UserXpEntity)
        private readonly userXpRepo: Repository<UserXpEntity>,
        @InjectRepository(XpEventEntity)
        private readonly xpEventRepo: Repository<XpEventEntity>,
        @InjectRepository(XpConfigEntity)
        private readonly xpConfigRepo: Repository<XpConfigEntity>,
        @InjectRepository(AchievementEntity)
        private readonly achievementRepo: Repository<AchievementEntity>,
        @InjectRepository(UserAchievementEntity)
        private readonly userAchievementRepo: Repository<UserAchievementEntity>,
        @InjectDataSource()
        private readonly dataSource: DataSource,
        private readonly achievementService: AchievementService
    ) {}

    onModuleInit(): void {
        // Delay recalculation to run after all modules have fully initialized,
        // avoiding concurrent query warnings from pg.
        setTimeout(() => {
            this.recalculateAllUserXp()
                .then((result) => this.logger.log(`XP recalculated on startup: ${result.updatedUsers} users updated`))
                .catch(() => this.logger.warn("XP recalculation on startup failed — will retry on next trigger"));
        }, 3000);
    }

    // ── XP Config ─────────────────────────────────────────────────────────────

    async getXpConfig(): Promise<XpConfigDto[]> {
        const rows = await this.xpConfigRepo.find({ order: { eventType: "ASC" } });
        return rows.map((r) => ({
            eventType: r.eventType,
            xpAmount: r.xpAmount,
            label: r.label,
            description: r.description
        }));
    }

    async updateXpConfig(eventType: string, xpAmount: number): Promise<XpConfigDto> {
        const row = await this.xpConfigRepo.findOneBy({ eventType });
        if (!row) {
            throw new Error(`Unknown event type: ${eventType}`);
        }
        row.xpAmount = xpAmount;
        await this.xpConfigRepo.save(row);
        this.configCache = null; // invalidate cache
        return { eventType: row.eventType, xpAmount: row.xpAmount, label: row.label, description: row.description };
    }

    // ── Award XP ──────────────────────────────────────────────────────────────

    async awardXp(userId: string, eventType: XpEventType, referenceId?: string): Promise<void> {
        const config = await this.getConfigCache();
        const amount = config.get(eventType) ?? 0;
        if (amount <= 0) return;

        let record = await this.userXpRepo.findOneBy({ userId });
        if (!record) {
            record = this.userXpRepo.create({ userId, xp: 0, level: 1 });
        }

        record.xp += amount;
        record.level = getLevelForXp(record.xp).level;
        await this.userXpRepo.save(record);

        const event = this.xpEventRepo.create({ userId, eventType, xpGained: amount, referenceId });
        await this.xpEventRepo.save(event);

        // Fire-and-forget achievement check
        void this.achievementService.checkAndAward(userId, eventType).catch(() => undefined);
    }

    // ── Read XP ───────────────────────────────────────────────────────────────

    async getUserXpData(userId: string): Promise<UserXpData> {
        const record = await this.userXpRepo.findOneBy({ userId });
        return this.toXpData(record?.xp ?? 0);
    }

    async getUserXpDataBatch(userIds: string[]): Promise<Map<string, UserXpData>> {
        if (!userIds.length) return new Map();
        const records = await this.userXpRepo.findBy({ userId: In(userIds) });
        const map = new Map<string, UserXpData>(records.map((r) => [r.userId, this.toXpData(r.xp)]));
        for (const id of userIds) {
            if (!map.has(id)) map.set(id, this.toXpData(0));
        }
        return map;
    }

    // ── Recalculate ───────────────────────────────────────────────────────────

    async recalculateAllUserXp(): Promise<{ updatedUsers: number }> {
        const config = await this.getConfigCache();
        const threadXp = config.get("create_thread") ?? 10;
        const postXp = config.get("create_post") ?? 5;
        const receiveXp = config.get("receive_reaction") ?? 3;
        const giveXp = config.get("give_reaction") ?? 1;

        // 1. Calculate activity-based XP per user
        const activityResult = await this.dataSource.query<{ user_id: string; total_xp: number }[]>(
            `
            WITH
            thread_counts AS (
                SELECT author_id AS user_id, COUNT(*) AS cnt
                FROM forum_threads
                WHERE deleted_at IS NULL
                GROUP BY author_id
            ),
            post_counts AS (
                SELECT author_id AS user_id, COUNT(*) AS cnt
                FROM forum_posts
                WHERE deleted_at IS NULL AND is_first_post = false
                GROUP BY author_id
            ),
            reactions_received AS (
                SELECT fp.author_id AS user_id, COUNT(*) AS cnt
                FROM forum_post_reactions fpr
                JOIN forum_posts fp ON fp.id = fpr.post_id
                GROUP BY fp.author_id
            ),
            reactions_given AS (
                SELECT user_id, COUNT(*) AS cnt
                FROM forum_post_reactions
                GROUP BY user_id
            )
            SELECT
                u.id AS user_id,
                (COALESCE((SELECT cnt FROM thread_counts WHERE user_id = u.id), 0) * $1 +
                 COALESCE((SELECT cnt FROM post_counts   WHERE user_id = u.id), 0) * $2 +
                 COALESCE((SELECT cnt FROM reactions_received WHERE user_id = u.id), 0) * $3 +
                 COALESCE((SELECT cnt FROM reactions_given     WHERE user_id = u.id), 0) * $4
                ) AS total_xp
            FROM users u
        `,
            [threadXp, postXp, receiveXp, giveXp]
        );

        // 2. Calculate achievement-based XP per user
        const achievementXpMap = new Map<string, number>();
        const achievements = await this.achievementRepo.find({ where: { isActive: true } });
        const achievementXpLookup = new Map(achievements.map((a) => [a.id, a.xpReward]));

        const allUserAchievements = await this.userAchievementRepo.find();
        for (const ua of allUserAchievements) {
            const xpReward = achievementXpLookup.get(ua.achievementId) ?? 0;
            if (xpReward > 0) {
                achievementXpMap.set(ua.userId, (achievementXpMap.get(ua.userId) ?? 0) + xpReward);
            }
        }

        // 3. Merge and upsert
        for (const row of activityResult) {
            const activityXp = Number(row.total_xp);
            const achievementXp = achievementXpMap.get(row.user_id) ?? 0;
            const totalXp = activityXp + achievementXp;
            const level = getLevelForXp(totalXp).level;
            await this.userXpRepo.upsert({ userId: row.user_id, xp: totalXp, level }, { conflictPaths: ["userId"] });
        }

        // Handle users who only have achievements but no activity rows
        for (const [userId, xp] of achievementXpMap) {
            if (!activityResult.some((r) => r.user_id === userId)) {
                const level = getLevelForXp(xp).level;
                await this.userXpRepo.upsert({ userId, xp, level }, { conflictPaths: ["userId"] });
            }
        }

        return { updatedUsers: activityResult.length + [...achievementXpMap.keys()].filter(
            (uid) => !activityResult.some((r) => r.user_id === uid)
        ).length };
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async getConfigCache(): Promise<Map<string, number>> {
        if (this.configCache && Date.now() - this.configCacheAt < this.CONFIG_TTL_MS) {
            return this.configCache;
        }
        const rows = await this.xpConfigRepo.find();
        this.configCache = new Map(rows.map((r) => [r.eventType, r.xpAmount]));
        this.configCacheAt = Date.now();
        return this.configCache;
    }

    private toXpData(xp: number): UserXpData {
        const levelInfo = getLevelForXp(xp);
        return {
            xp,
            level: levelInfo.level,
            levelName: levelInfo.name,
            xpToNextLevel: getXpToNextLevel(xp),
            xpProgressPercent: getXpProgressPercent(xp)
        };
    }
}
