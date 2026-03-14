import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { AchievementEntity } from "./entities/achievement.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { XpEventEntity, XpEventType } from "./entities/xp-event.entity";
import { UserXpEntity } from "./entities/user-xp.entity";

export interface AchievementDto {
    id: string;
    key: string;
    name: string;
    description?: string;
    icon: string;
    rarity: string;
    triggerType: string;
    triggerValue: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserAchievementDto extends AchievementDto {
    earnedAt: string;
}

export interface CreateAchievementDto {
    key: string;
    name: string;
    description?: string;
    icon: string;
    rarity: string;
    triggerType: string;
    triggerValue: number;
    isActive?: boolean;
}

const EVENT_TO_TRIGGER: Partial<Record<XpEventType, string>> = {
    create_post: "post_count",
    create_thread: "thread_count",
    receive_reaction: "reaction_received_count",
    give_reaction: "reaction_given_count"
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
        private readonly userXpRepo: Repository<UserXpEntity>
    ) {}

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
                return { ...this.toDto(a), earnedAt: e.earnedAt.toISOString() };
            })
            .filter((a): a is UserAchievementDto => a !== null)
            .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
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

        if (triggerType === "post_count") {
            countMap["post_count"] = await this.xpEventRepo.countBy({ userId, eventType: "create_post" });
        } else if (triggerType === "thread_count") {
            countMap["thread_count"] = await this.xpEventRepo.countBy({ userId, eventType: "create_thread" });
        } else if (triggerType === "reaction_received_count") {
            countMap["reaction_received_count"] = await this.xpEventRepo.countBy({ userId, eventType: "receive_reaction" });
        } else if (triggerType === "reaction_given_count") {
            countMap["reaction_given_count"] = await this.xpEventRepo.countBy({ userId, eventType: "give_reaction" });
        }

        for (const achievement of relevant) {
            if (earnedIds.has(achievement.id)) continue;
            const currentValue = countMap[achievement.triggerType] ?? 0;
            if (currentValue >= achievement.triggerValue) {
                await this.userAchievementRepo.save(
                    this.userAchievementRepo.create({ userId, achievementId: achievement.id })
                );
            }
        }
    }

    // ── Private ────────────────────────────────────────────────────────────────

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
            isActive: a.isActive,
            createdAt: a.createdAt?.toISOString(),
            updatedAt: a.updatedAt?.toISOString()
        };
    }
}
