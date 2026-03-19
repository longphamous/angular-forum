import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PushService } from "../push/push.service";
import { PushNotificationNew } from "../push/push-event.types";
import { NotificationEntity, NotificationType } from "./entities/notification.entity";

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notifRepo: Repository<NotificationEntity>,
        private readonly pushService: PushService
    ) {}

    /**
     * Creates a notification for a user.
     * Called by other modules (MessagesService, GamificationService, CreditService, …)
     * when a relevant event occurs.
     */
    async create(
        userId: string,
        type: NotificationType,
        title: string,
        body: string,
        link?: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const notif = this.notifRepo.create({
            userId,
            type,
            title,
            body,
            link: link ?? null,
            metadata: metadata ?? null
        });
        const saved = await this.notifRepo.save(notif);

        // Push real-time notification to connected clients
        const pushPayload: PushNotificationNew = {
            id: saved.id,
            type,
            title,
            body,
            link: link ?? null,
            createdAt: saved.createdAt.toISOString()
        };
        this.pushService.sendToUser(userId, "notification:new", pushPayload);
    }

    async getForUser(userId: string, limit = 30): Promise<NotificationEntity[]> {
        return this.notifRepo.find({
            where: { userId },
            order: { createdAt: "DESC" },
            take: limit
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notifRepo.count({ where: { userId, isRead: false } });
    }

    async markAsRead(userId: string, id: string): Promise<void> {
        await this.notifRepo.update({ id, userId }, { isRead: true });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notifRepo
            .createQueryBuilder()
            .update(NotificationEntity)
            .set({ isRead: true })
            .where("userId = :userId AND isRead = false", { userId })
            .execute();
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.notifRepo.delete({ id, userId });
    }
}
