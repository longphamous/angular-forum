import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreditService } from "../credit/credit.service";
import { GamificationService } from "../gamification/gamification.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UserInventoryEntity } from "../shop/entities/user-inventory.entity";
import { QuestEntity, QuestReward, QuestTrigger, QuestType } from "./entities/quest.entity";
import { UserCharacterEntity } from "./entities/user-character.entity";
import { UserQuestEntity, UserQuestStatus } from "./entities/user-quest.entity";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface QuestDto {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    questType: QuestType;
    triggerType: QuestTrigger;
    requiredCount: number;
    rewards: QuestReward[];
    gloryReward: number;
    requiredLevel: number | null;
    eventStartsAt: string | null;
    eventEndsAt: string | null;
    eventBannerUrl: string | null;
}

export interface UserQuestDto {
    id: string;
    quest: QuestDto;
    progress: number;
    status: UserQuestStatus;
    periodKey: string;
    completedAt: string | null;
    claimedAt: string | null;
}

export interface QuestBoardDto {
    daily: UserQuestDto[];
    weekly: UserQuestDto[];
    monthly: UserQuestDto[];
    story: UserQuestDto[];
    events: UserQuestDto[];
    glory: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class QuestService {
    private readonly logger = new Logger(QuestService.name);

    constructor(
        @InjectRepository(QuestEntity)
        private readonly questRepo: Repository<QuestEntity>,
        @InjectRepository(UserQuestEntity)
        private readonly userQuestRepo: Repository<UserQuestEntity>,
        @InjectRepository(UserCharacterEntity)
        private readonly characterRepo: Repository<UserCharacterEntity>,
        @InjectRepository(UserInventoryEntity)
        private readonly inventoryRepo: Repository<UserInventoryEntity>,
        private readonly gamificationService: GamificationService,
        private readonly creditService: CreditService,
        private readonly notificationsService: NotificationsService
    ) {}

    // ── Get quest board for user ──────────────────────────────────────────────

    async getQuestBoard(userId: string, userLevel: number): Promise<QuestBoardDto> {
        const now = new Date();
        const quests = await this.questRepo.find({ where: { isActive: true }, order: { sortOrder: "ASC" } });

        const activeQuests = quests.filter((q) => {
            if (q.requiredLevel && userLevel < q.requiredLevel) return false;
            if (q.questType === "event") {
                if (q.eventStartsAt && now < q.eventStartsAt) return false;
                if (q.eventEndsAt && now > q.eventEndsAt) return false;
            }
            return true;
        });

        const userQuests: UserQuestDto[] = [];
        for (const quest of activeQuests) {
            const periodKey = this.getPeriodKey(quest.questType);
            let uq = await this.userQuestRepo.findOne({
                where: { userId, questId: quest.id, periodKey }
            });
            if (!uq) {
                uq = this.userQuestRepo.create({
                    userId,
                    questId: quest.id,
                    progress: 0,
                    status: "active",
                    periodKey
                });
                await this.userQuestRepo.save(uq);
            }
            userQuests.push(this.toUserQuestDto(uq, quest));
        }

        const character = await this.characterRepo.findOneBy({ userId });

        return {
            daily: userQuests.filter((q) => q.quest.questType === "daily"),
            weekly: userQuests.filter((q) => q.quest.questType === "weekly"),
            monthly: userQuests.filter((q) => q.quest.questType === "monthly"),
            story: userQuests.filter((q) => q.quest.questType === "story"),
            events: userQuests.filter((q) => q.quest.questType === "event"),
            glory: character?.glory ?? 0
        };
    }

    // ── Track progress (called when user performs an action) ───────────────────

    async trackProgress(userId: string, trigger: QuestTrigger): Promise<void> {
        const quests = await this.questRepo.find({
            where: { isActive: true, triggerType: trigger }
        });
        if (quests.length === 0) return;

        for (const quest of quests) {
            const periodKey = this.getPeriodKey(quest.questType);
            const uq = await this.userQuestRepo.findOne({
                where: { userId, questId: quest.id, periodKey }
            });
            if (!uq || uq.status !== "active") continue;

            uq.progress = Math.min(uq.progress + 1, quest.requiredCount);
            if (uq.progress >= quest.requiredCount) {
                uq.status = "completed";
                uq.completedAt = new Date();
            }
            await this.userQuestRepo.save(uq);
        }
    }

    // ── Claim rewards ─────────────────────────────────────────────────────────

    async claimReward(userId: string, userQuestId: string): Promise<UserQuestDto> {
        const uq = await this.userQuestRepo.findOne({
            where: { id: userQuestId, userId },
            relations: ["quest"]
        });
        if (!uq) throw new Error("Quest progress not found");
        if (uq.status !== "completed") throw new Error("Quest not completed yet");

        const quest = uq.quest;

        // Distribute rewards
        for (const reward of quest.rewards) {
            switch (reward.type) {
                case "xp":
                    await this.gamificationService.awardXp(userId, "create_post", `quest:${quest.id}`);
                    break;
                case "coins":
                    await this.creditService.addCredits(userId, reward.amount, "reward", `Quest: ${quest.name}`);
                    break;
                case "item":
                    if (reward.itemId) {
                        let inv = await this.inventoryRepo.findOne({
                            where: { userId, itemId: reward.itemId }
                        });
                        if (inv) {
                            inv.quantity += reward.amount;
                        } else {
                            inv = this.inventoryRepo.create({
                                userId,
                                itemId: reward.itemId,
                                quantity: reward.amount
                            });
                        }
                        await this.inventoryRepo.save(inv);
                    }
                    break;
                case "glory":
                    // Handled below with gloryReward
                    break;
            }
        }

        // Award glory
        if (quest.gloryReward > 0) {
            const character = await this.characterRepo.findOneBy({ userId });
            if (character) {
                character.glory += quest.gloryReward;
                await this.characterRepo.save(character);
            }
        }

        uq.status = "claimed";
        uq.claimedAt = new Date();
        await this.userQuestRepo.save(uq);

        void this.notificationsService.create(
            userId,
            "quest_complete",
            "Quest abgeschlossen!",
            `Du hast "${quest.name}" abgeschlossen!`,
            "/rpg/quests"
        );

        return this.toUserQuestDto(uq, quest);
    }

    // ── Admin: CRUD ───────────────────────────────────────────────────────────

    async getAllQuests(): Promise<QuestDto[]> {
        const quests = await this.questRepo.find({ order: { questType: "ASC", sortOrder: "ASC" } });
        return quests.map((q) => this.toQuestDto(q));
    }

    async createQuest(data: Partial<QuestEntity>): Promise<QuestDto> {
        const entity = this.questRepo.create(data);
        await this.questRepo.save(entity);
        return this.toQuestDto(entity);
    }

    async updateQuest(id: string, data: Partial<QuestEntity>): Promise<QuestDto> {
        await this.questRepo.update(id, data);
        const entity = await this.questRepo.findOneByOrFail({ id });
        return this.toQuestDto(entity);
    }

    async deleteQuest(id: string): Promise<void> {
        await this.questRepo.delete(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private getPeriodKey(questType: QuestType): string {
        const now = new Date();
        switch (questType) {
            case "daily":
                return now.toISOString().slice(0, 10);
            case "weekly": {
                const jan1 = new Date(now.getFullYear(), 0, 1);
                const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
                return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
            }
            case "monthly":
                return now.toISOString().slice(0, 7);
            default:
                return "once";
        }
    }

    private toQuestDto(q: QuestEntity): QuestDto {
        return {
            id: q.id,
            name: q.name,
            description: q.description,
            icon: q.icon,
            questType: q.questType,
            triggerType: q.triggerType,
            requiredCount: q.requiredCount,
            rewards: q.rewards,
            gloryReward: q.gloryReward,
            requiredLevel: q.requiredLevel,
            eventStartsAt: q.eventStartsAt?.toISOString() ?? null,
            eventEndsAt: q.eventEndsAt?.toISOString() ?? null,
            eventBannerUrl: q.eventBannerUrl
        };
    }

    private toUserQuestDto(uq: UserQuestEntity, quest: QuestEntity): UserQuestDto {
        return {
            id: uq.id,
            quest: this.toQuestDto(quest),
            progress: uq.progress,
            status: uq.status,
            periodKey: uq.periodKey,
            completedAt: uq.completedAt?.toISOString() ?? null,
            claimedAt: uq.claimedAt?.toISOString() ?? null
        };
    }
}
