import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { ActivityEntity, ActivityType } from "./entities/activity.entity";

export interface EnrichedActivity {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    type: ActivityType;
    title: string;
    description: string | null;
    link: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(ActivityEntity)
        private readonly activityRepo: Repository<ActivityEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) {}

    async create(
        userId: string,
        type: ActivityType,
        title: string,
        description?: string,
        link?: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const activity = this.activityRepo.create({
            userId,
            type,
            title,
            description: description ?? null,
            link: link ?? null,
            metadata: metadata ?? null
        });
        await this.activityRepo.save(activity);
    }

    async getGlobalFeed(limit = 20, offset = 0): Promise<EnrichedActivity[]> {
        const activities = await this.activityRepo.find({
            order: { createdAt: "DESC" },
            take: limit,
            skip: offset
        });
        return this.enrichActivities(activities);
    }

    async getUserFeed(userId: string, limit = 20, offset = 0): Promise<EnrichedActivity[]> {
        const activities = await this.activityRepo.find({
            where: { userId },
            order: { createdAt: "DESC" },
            take: limit,
            skip: offset
        });
        return this.enrichActivities(activities);
    }

    private async enrichActivities(activities: ActivityEntity[]): Promise<EnrichedActivity[]> {
        if (activities.length === 0) return [];

        const userIds = [...new Set(activities.map((a) => a.userId))];
        const users = await this.userRepo
            .createQueryBuilder("u")
            .where("u.id IN (:...ids)", { ids: userIds })
            .getMany();
        const userMap = new Map(users.map((u) => [u.id, u]));

        return activities.map((a) => {
            const user = userMap.get(a.userId);
            return {
                id: a.id,
                userId: a.userId,
                username: user?.username ?? "unknown",
                displayName: user?.displayName ?? user?.username ?? "Unknown",
                avatarUrl: user?.avatarUrl ?? null,
                type: a.type,
                title: a.title,
                description: a.description,
                link: a.link,
                metadata: a.metadata,
                createdAt: a.createdAt.toISOString()
            };
        });
    }
}
