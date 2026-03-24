import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { PushAchievementUnlocked } from "../push/push-event.types";
import { AchievementCategoryEntity } from "./entities/achievement-category.entity";
import { AchievementEntity } from "./entities/achievement.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpEventEntity, XpEventType } from "./entities/xp-event.entity";

export interface AchievementDto {
    id: string;
    key: string;
    name: string;
    description?: string;
    icon: string;
    rarity: string;
    triggerType: string;
    triggerValue: number;
    xpReward: number;
    category: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserAchievementDto extends AchievementDto {
    earnedAt: string;
    source: "auto" | "manual";
    grantedBy: string | null;
}

export interface AchievementCategoryDto {
    id: string;
    key: string;
    name: string;
    description?: string;
    icon: string;
    position: number;
}

export interface AchievementHistoryDto {
    id: string;
    achievementId: string;
    achievementName: string;
    achievementIcon: string;
    userId: string;
    username: string;
    displayName: string;
    source: "auto" | "manual";
    grantedBy: string | null;
    grantedByName: string | null;
    earnedAt: string;
}

export interface AchievementProgressDto extends AchievementDto {
    earned: boolean;
    earnedAt: string | null;
    currentValue: number;
    progressPercent: number;
}

export interface CreateAchievementDto {
    key: string;
    name: string;
    description?: string;
    icon: string;
    rarity: string;
    triggerType: string;
    triggerValue: number;
    xpReward?: number;
    category?: string;
    isActive?: boolean;
}

const EVENT_TO_TRIGGER: Partial<Record<XpEventType, string>> = {
    create_post: "post_count",
    create_thread: "thread_count",
    receive_reaction: "reaction_received_count",
    give_reaction: "reaction_given_count",
    create_clip: "clip_count",
    create_blog_post: "blog_post_count",
    upload_gallery: "gallery_upload_count",
    create_lexicon_article: "lexicon_article_count",
    create_recipe: "recipe_count",
    buy_lotto_ticket: "lotto_ticket_count"
};

@Injectable()
export class AchievementService {
    constructor(
        @InjectRepository(AchievementEntity)
        private readonly achievementRepo: Repository<AchievementEntity>,
        @InjectRepository(UserAchievementEntity)
        private readonly userAchievementRepo: Repository<UserAchievementEntity>,
        @InjectRepository(XpEventEntity)
        private readonly xpEventRepo: Repository<XpEventEntity>,
        @InjectRepository(UserXpEntity)
        private readonly userXpRepo: Repository<UserXpEntity>,
        @InjectRepository(AchievementCategoryEntity)
        private readonly categoryRepo: Repository<AchievementCategoryEntity>,
        private readonly notificationsService: NotificationsService,
        private readonly pushService: PushService
    ) {}

    // ── Detail ──────────────────────────────────────────────────────────────

    async getAchievementDetail(achievementId: string): Promise<object> {
        const achievement = await this.achievementRepo.findOneBy({ id: achievementId });
        if (!achievement) throw new NotFoundException("Achievement not found");

        const earned = await this.userAchievementRepo.find({
            where: { achievementId },
            order: { earnedAt: "DESC" }
        });

        const { UserEntity } = await import("../user/entities/user.entity");
        const userRepo = this.userAchievementRepo.manager.getRepository(UserEntity);
        const userIds = earned.map((e) => e.userId);
        const users = userIds.length ? await userRepo.find({ where: { id: In(userIds) } }) : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        const recipients = earned.map((e) => {
            const user = userMap.get(e.userId);
            return {
                userId: e.userId,
                username: user?.username ?? "unknown",
                displayName: user?.displayName ?? "Unknown",
                avatarUrl: user?.avatarUrl ?? null,
                source: e.source ?? "auto",
                grantedBy: e.grantedBy ?? null,
                earnedAt: e.earnedAt.toISOString()
            };
        });

        return {
            ...this.toDto(achievement),
            totalGranted: earned.length,
            recipients
        };
    }

    // ── Admin CRUD ─────────────────────────────────────────────────────────────

    async getAllAchievements(includeInactive = false): Promise<AchievementDto[]> {
        const rows = await this.achievementRepo.find({
            where: includeInactive ? {} : { isActive: true },
            order: { rarity: "ASC", triggerValue: "ASC" }
        });
        return rows.map((r) => this.toDto(r));
    }

    async createAchievement(dto: CreateAchievementDto): Promise<AchievementDto> {
        const entity = this.achievementRepo.create({
            ...dto,
            isActive: dto.isActive ?? true
        });
        const saved = await this.achievementRepo.save(entity);
        return this.toDto(saved);
    }

    async updateAchievement(id: string, dto: Partial<CreateAchievementDto>): Promise<AchievementDto> {
        const entity = await this.achievementRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException("Achievement not found");
        Object.assign(entity, dto);
        const saved = await this.achievementRepo.save(entity);
        return this.toDto(saved);
    }

    async deleteAchievement(id: string): Promise<void> {
        const result = await this.achievementRepo.delete(id);
        if (!result.affected) throw new NotFoundException("Achievement not found");
    }

    // ── User Achievements ──────────────────────────────────────────────────────

    async getUserAchievements(userId: string): Promise<UserAchievementDto[]> {
        const earned = await this.userAchievementRepo.findBy({ userId });
        if (!earned.length) return [];

        const ids = earned.map((e) => e.achievementId);
        const achievements = await this.achievementRepo.find({ where: { id: In(ids) } });
        const achievementMap = new Map(achievements.map((a) => [a.id, a]));

        return earned
            .map((e) => {
                const a = achievementMap.get(e.achievementId);
                if (!a) return null;
                return {
                    ...this.toDto(a),
                    earnedAt: e.earnedAt.toISOString(),
                    source: e.source ?? "auto",
                    grantedBy: e.grantedBy ?? null
                };
            })
            .filter((a): a is UserAchievementDto => a !== null)
            .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
    }

    // ── Progress (all achievements with user progress) ────────────────────────

    async getUserProgress(userId: string): Promise<AchievementProgressDto[]> {
        const allActive = await this.achievementRepo.find({
            where: { isActive: true },
            order: { category: "ASC", rarity: "ASC", triggerValue: "ASC" }
        });
        if (!allActive.length) return [];

        const earned = await this.userAchievementRepo.findBy({ userId });
        const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

        const userXp = await this.userXpRepo.findOneBy({ userId });
        const currentXp = userXp?.xp ?? 0;
        const currentLevel = userXp?.level ?? 1;

        const countMap: Record<string, number> = {
            level_reached: currentLevel,
            xp_total: currentXp
        };

        const eventTypes: { trigger: string; event: string }[] = [
            { trigger: "post_count", event: "create_post" },
            { trigger: "thread_count", event: "create_thread" },
            { trigger: "reaction_received_count", event: "receive_reaction" },
            { trigger: "reaction_given_count", event: "give_reaction" }
        ];
        for (const { trigger, event } of eventTypes) {
            if (allActive.some((a) => a.triggerType === trigger)) {
                countMap[trigger] = await this.xpEventRepo.countBy({ userId, eventType: event as XpEventType });
            }
        }

        return allActive.map((a) => {
            const isEarned = earnedMap.has(a.id);
            const currentValue = countMap[a.triggerType] ?? 0;
            const progressPercent = Math.min(100, Math.round((currentValue / a.triggerValue) * 100));
            return {
                ...this.toDto(a),
                earned: isEarned,
                earnedAt: isEarned ? earnedMap.get(a.id)!.toISOString() : null,
                currentValue,
                progressPercent
            };
        });
    }

    // ── Check & Award ──────────────────────────────────────────────────────────

    async checkAndAward(userId: string, eventType: XpEventType): Promise<void> {
        const triggerType = EVENT_TO_TRIGGER[eventType];
        const triggersToCheck = new Set<string>(["level_reached", "xp_total"]);
        if (triggerType) triggersToCheck.add(triggerType);

        const allActive = await this.achievementRepo.find({ where: { isActive: true } });
        const relevant = allActive.filter((a) => triggersToCheck.has(a.triggerType));
        if (!relevant.length) return;

        const alreadyEarned = await this.userAchievementRepo.findBy({ userId });
        const earnedIds = new Set(alreadyEarned.map((e) => e.achievementId));

        const userXp = await this.userXpRepo.findOneBy({ userId });
        const currentXp = userXp?.xp ?? 0;
        const currentLevel = userXp?.level ?? 1;

        const countMap: Record<string, number> = {
            level_reached: currentLevel,
            xp_total: currentXp
        };

        if (triggerType) {
            const eventTypeForTrigger: Record<string, XpEventType> = {
                post_count: "create_post",
                thread_count: "create_thread",
                reaction_received_count: "receive_reaction",
                reaction_given_count: "give_reaction",
                clip_count: "create_clip",
                blog_post_count: "create_blog_post",
                gallery_upload_count: "upload_gallery",
                lexicon_article_count: "create_lexicon_article",
                recipe_count: "create_recipe",
                lotto_ticket_count: "buy_lotto_ticket"
            };
            const evType = eventTypeForTrigger[triggerType];
            if (evType) {
                countMap[triggerType] = await this.xpEventRepo.countBy({ userId, eventType: evType });
            }
        }

        for (const achievement of relevant) {
            if (earnedIds.has(achievement.id)) continue;
            const currentValue = countMap[achievement.triggerType] ?? 0;
            if (currentValue >= achievement.triggerValue) {
                await this.userAchievementRepo.save(
                    this.userAchievementRepo.create({ userId, achievementId: achievement.id })
                );
                if (achievement.xpReward > 0) {
                    await this.awardAchievementXp(userId, achievement.xpReward);
                }

                // Send notification
                void this.notificationsService.create(
                    userId,
                    "achievement_unlocked",
                    `Achievement: ${achievement.name}`,
                    achievement.description ?? `Du hast "${achievement.name}" freigeschaltet!`,
                    "/achievements",
                    { achievementId: achievement.id, icon: achievement.icon, rarity: achievement.rarity }
                );

                // Send real-time push event for animated overlay
                const pushPayload: PushAchievementUnlocked = {
                    achievementId: achievement.id,
                    name: achievement.name,
                    description: achievement.description ?? "",
                    icon: achievement.icon,
                    rarity: achievement.rarity,
                    xpReward: achievement.xpReward
                };
                this.pushService.sendToUser(userId, "achievement:unlocked", pushPayload);
            }
        }
    }

    // ── Private ────────────────────────────────────────────────────────────────

    // ── Manual Grant / Revoke ──────────────────────────────────────────────

    async grantAchievement(userId: string, achievementId: string, grantedByUserId: string): Promise<UserAchievementDto> {
        const achievement = await this.achievementRepo.findOneBy({ id: achievementId });
        if (!achievement) throw new NotFoundException("Achievement not found");

        const existing = await this.userAchievementRepo.findOneBy({ userId, achievementId });
        if (existing) throw new BadRequestException("User already has this achievement");

        const entity = this.userAchievementRepo.create({
            userId,
            achievementId,
            source: "manual",
            grantedBy: grantedByUserId
        });
        await this.userAchievementRepo.save(entity);

        if (achievement.xpReward > 0) {
            await this.awardAchievementXp(userId, achievement.xpReward);
        }

        void this.notificationsService.create(
            userId,
            "achievement_unlocked",
            `Achievement: ${achievement.name}`,
            achievement.description ?? `Du hast "${achievement.name}" erhalten!`,
            "/achievements",
            { achievementId: achievement.id, icon: achievement.icon, rarity: achievement.rarity }
        );

        const pushPayload: PushAchievementUnlocked = {
            achievementId: achievement.id,
            name: achievement.name,
            description: achievement.description ?? "",
            icon: achievement.icon,
            rarity: achievement.rarity,
            xpReward: achievement.xpReward
        };
        this.pushService.sendToUser(userId, "achievement:unlocked", pushPayload);

        return {
            ...this.toDto(achievement),
            earnedAt: entity.earnedAt.toISOString(),
            source: "manual",
            grantedBy: grantedByUserId
        };
    }

    async revokeAchievement(userId: string, achievementId: string): Promise<void> {
        const result = await this.userAchievementRepo.delete({ userId, achievementId });
        if (!result.affected) throw new NotFoundException("User achievement not found");
    }

    // ── Categories ──────────────────────────────────────────────────────────

    async getCategories(): Promise<AchievementCategoryDto[]> {
        const rows = await this.categoryRepo.find({ order: { position: "ASC", name: "ASC" } });
        return rows.map((r) => ({
            id: r.id,
            key: r.key,
            name: r.name,
            description: r.description,
            icon: r.icon,
            position: r.position
        }));
    }

    async createCategory(dto: { key: string; name: string; description?: string; icon?: string; position?: number }): Promise<AchievementCategoryDto> {
        const entity = this.categoryRepo.create({
            key: dto.key,
            name: dto.name,
            description: dto.description,
            icon: dto.icon ?? "pi pi-folder",
            position: dto.position ?? 0
        });
        const saved = await this.categoryRepo.save(entity);
        return { id: saved.id, key: saved.key, name: saved.name, description: saved.description, icon: saved.icon, position: saved.position };
    }

    async updateCategory(id: string, dto: Partial<{ key: string; name: string; description: string; icon: string; position: number }>): Promise<AchievementCategoryDto> {
        const entity = await this.categoryRepo.findOneBy({ id });
        if (!entity) throw new NotFoundException("Category not found");
        Object.assign(entity, dto);
        const saved = await this.categoryRepo.save(entity);
        return { id: saved.id, key: saved.key, name: saved.name, description: saved.description, icon: saved.icon, position: saved.position };
    }

    async deleteCategory(id: string): Promise<void> {
        const result = await this.categoryRepo.delete(id);
        if (!result.affected) throw new NotFoundException("Category not found");
    }

    // ── History ──────────────────────────────────────────────────────────────

    async getHistory(limit = 50): Promise<AchievementHistoryDto[]> {
        const earned = await this.userAchievementRepo.find({
            order: { earnedAt: "DESC" },
            take: limit
        });
        if (!earned.length) return [];

        const achievementIds = [...new Set(earned.map((e) => e.achievementId))];
        const userIds = [...new Set([...earned.map((e) => e.userId), ...earned.filter((e) => e.grantedBy).map((e) => e.grantedBy!)])];

        const achievements = await this.achievementRepo.find({ where: { id: In(achievementIds) } });
        const achMap = new Map(achievements.map((a) => [a.id, a]));

        const { UserEntity } = await import("../user/entities/user.entity");
        const userRepo = this.userAchievementRepo.manager.getRepository(UserEntity);
        const users = userIds.length ? await userRepo.find({ where: { id: In(userIds) } }) : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        return earned.map((e) => {
            const ach = achMap.get(e.achievementId);
            const user = userMap.get(e.userId);
            const granter = e.grantedBy ? userMap.get(e.grantedBy) : null;
            return {
                id: e.id,
                achievementId: e.achievementId,
                achievementName: ach?.name ?? "Unknown",
                achievementIcon: ach?.icon ?? "pi pi-trophy",
                userId: e.userId,
                username: user?.username ?? "unknown",
                displayName: user?.displayName ?? "Unknown",
                source: e.source ?? "auto",
                grantedBy: e.grantedBy ?? null,
                grantedByName: granter?.displayName ?? granter?.username ?? null,
                earnedAt: e.earnedAt.toISOString()
            };
        });
    }

    // ── Private ────────────────────────────────────────────────────────────

    private async awardAchievementXp(userId: string, xpAmount: number): Promise<void> {
        const { getLevelForXp } = await import("./level.config");
        let record = await this.userXpRepo.findOneBy({ userId });
        if (!record) {
            record = this.userXpRepo.create({ userId, xp: 0, level: 1 });
        }
        record.xp += xpAmount;
        record.level = getLevelForXp(record.xp).level;
        await this.userXpRepo.save(record);
    }

    private toDto(a: AchievementEntity): AchievementDto {
        return {
            id: a.id,
            key: a.key,
            name: a.name,
            description: a.description,
            icon: a.icon,
            rarity: a.rarity,
            triggerType: a.triggerType,
            triggerValue: a.triggerValue,
            xpReward: a.xpReward,
            category: a.category,
            isActive: a.isActive,
            createdAt: a.createdAt?.toISOString(),
            updatedAt: a.updatedAt?.toISOString()
        };
    }
}
