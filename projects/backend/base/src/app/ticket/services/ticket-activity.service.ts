import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { TicketActivityLogEntity, type TicketActivityAction } from "../entities/ticket-activity-log.entity";
import type { TicketActivityDto, PaginatedResult } from "../models/ticket.model";

@Injectable()
export class TicketActivityService {
    constructor(
        @InjectRepository(TicketActivityLogEntity)
        private readonly activityRepo: Repository<TicketActivityLogEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) {}

    async log(
        ticketId: string,
        userId: string,
        action: TicketActivityAction,
        field?: string,
        oldValue?: string,
        newValue?: string
    ): Promise<void> {
        await this.activityRepo.save(
            this.activityRepo.create({ ticketId, userId, action, field, oldValue, newValue })
        );
    }

    async logFieldChanges(
        ticketId: string,
        userId: string,
        oldValues: Record<string, unknown>,
        newValues: Record<string, unknown>
    ): Promise<void> {
        const entries: TicketActivityLogEntity[] = [];

        for (const key of Object.keys(newValues)) {
            const oldVal = oldValues[key];
            const newVal = newValues[key];
            if (oldVal === newVal) continue;
            if (oldVal == null && newVal == null) continue;

            const action: TicketActivityAction = key === "status" ? "status_changed" : "updated";

            entries.push(
                this.activityRepo.create({
                    ticketId,
                    userId,
                    action,
                    field: key,
                    oldValue: oldVal != null ? String(oldVal) : undefined,
                    newValue: newVal != null ? String(newVal) : undefined
                })
            );
        }

        if (entries.length > 0) {
            await this.activityRepo.save(entries);
        }
    }

    async getActivity(ticketId: string, page = 1, limit = 50): Promise<PaginatedResult<TicketActivityDto>> {
        const [entries, total] = await this.activityRepo.findAndCount({
            where: { ticketId },
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });

        const userIds = [...new Set(entries.map((e) => e.userId))];
        const userMap = await this.getUserMap(userIds);

        return {
            data: entries.map((e) => this.toDto(e, userMap)),
            total,
            page,
            limit
        };
    }

    private async getUserMap(ids: string[]): Promise<Map<string, string>> {
        if (!ids.length) return new Map();
        const users = await this.userRepo.findBy({ id: In([...new Set(ids)]) });
        return new Map(users.map((u) => [u.id, u.displayName]));
    }

    private toDto(entry: TicketActivityLogEntity, userMap: Map<string, string>): TicketActivityDto {
        return {
            id: entry.id,
            ticketId: entry.ticketId,
            userId: entry.userId,
            userName: userMap.get(entry.userId),
            field: entry.field,
            oldValue: entry.oldValue,
            newValue: entry.newValue,
            action: entry.action,
            createdAt: entry.createdAt.toISOString()
        };
    }
}
