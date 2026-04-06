import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import type { NotificationType } from "../../notifications/entities/notification.entity";
import { NotificationsService } from "../../notifications/notifications.service";
import { UserEntity } from "../../user/entities/user.entity";
import { TicketEntity } from "../entities/ticket.entity";
import { TicketWatcherEntity } from "../entities/ticket-watcher.entity";
import type { WatcherDto } from "../models/ticket.model";

@Injectable()
export class TicketWatcherService {
    constructor(
        @InjectRepository(TicketWatcherEntity) private readonly watcherRepo: Repository<TicketWatcherEntity>,
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    async getWatchers(ticketId: string): Promise<WatcherDto[]> {
        const watchers = await this.watcherRepo.find({ where: { ticketId } });
        const userIds = watchers.map((w) => w.userId);
        const userMap = await this.getUserMap(userIds);
        return watchers.map((w) => ({
            userId: w.userId,
            userName: userMap.get(w.userId),
            createdAt: w.createdAt.toISOString()
        }));
    }

    async watch(ticketId: string, userId: string): Promise<void> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);

        const exists = await this.watcherRepo.findOne({ where: { ticketId, userId } });
        if (!exists) {
            await this.watcherRepo.save(this.watcherRepo.create({ ticketId, userId }));
        }
    }

    async unwatch(ticketId: string, userId: string): Promise<void> {
        await this.watcherRepo.delete({ ticketId, userId });
    }

    async isWatching(ticketId: string, userId: string): Promise<boolean> {
        const count = await this.watcherRepo.count({ where: { ticketId, userId } });
        return count > 0;
    }

    async getWatcherCount(ticketId: string): Promise<number> {
        return this.watcherRepo.count({ where: { ticketId } });
    }

    async notifyWatchers(
        ticketId: string,
        excludeUserId: string,
        type: NotificationType,
        message: string,
        link?: string
    ): Promise<void> {
        const watchers = await this.watcherRepo.find({ where: { ticketId } });
        const ticketLink = link ?? `/tickets/${ticketId}`;
        for (const watcher of watchers) {
            if (watcher.userId !== excludeUserId) {
                void this.notificationsService.create(watcher.userId, type, "Ticket Update", message, ticketLink);
            }
        }
    }

    private async getUserMap(ids: string[]): Promise<Map<string, string>> {
        if (!ids.length) return new Map();
        const users = await this.userRepo.findBy({ id: In([...new Set(ids)]) });
        return new Map(users.map((u) => [u.id, u.displayName]));
    }
}
