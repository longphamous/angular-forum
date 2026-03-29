import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { CreateWorkLogDto } from "../dto/create-work-log.dto";
import { TicketEntity } from "../entities/ticket.entity";
import { TicketWorkLogEntity } from "../entities/ticket-work-log.entity";
import type { WorkLogDto } from "../models/ticket.model";

@Injectable()
export class TicketWorkLogService {
    constructor(
        @InjectRepository(TicketWorkLogEntity) private readonly workLogRepo: Repository<TicketWorkLogEntity>,
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>
    ) {}

    async getWorkLogs(ticketId: string): Promise<WorkLogDto[]> {
        const logs = await this.workLogRepo.find({
            where: { ticketId },
            order: { logDate: "DESC", createdAt: "DESC" }
        });
        const userIds = [...new Set(logs.map((l) => l.userId))];
        const userMap = await this.getUserMap(userIds);
        return logs.map((l) => this.toDto(l, userMap));
    }

    async addWorkLog(ticketId: string, userId: string, dto: CreateWorkLogDto): Promise<WorkLogDto> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);

        const log = this.workLogRepo.create({
            ticketId,
            userId,
            timeSpentMinutes: dto.timeSpentMinutes,
            description: dto.description,
            logDate: dto.logDate ? new Date(dto.logDate) : new Date()
        });
        const saved = await this.workLogRepo.save(log);

        // Update ticket time tracking
        ticket.timeSpentMinutes = (ticket.timeSpentMinutes ?? 0) + dto.timeSpentMinutes;
        if (ticket.remainingEstimateMinutes != null) {
            ticket.remainingEstimateMinutes = Math.max(0, ticket.remainingEstimateMinutes - dto.timeSpentMinutes);
        }
        await this.ticketRepo.save(ticket);

        const userMap = await this.getUserMap([userId]);
        return this.toDto(saved, userMap);
    }

    async deleteWorkLog(id: string): Promise<void> {
        const log = await this.workLogRepo.findOne({ where: { id } });
        if (!log) throw new NotFoundException(`Work log "${id}" not found`);

        // Subtract time from ticket
        const ticket = await this.ticketRepo.findOne({ where: { id: log.ticketId } });
        if (ticket) {
            ticket.timeSpentMinutes = Math.max(0, (ticket.timeSpentMinutes ?? 0) - log.timeSpentMinutes);
            await this.ticketRepo.save(ticket);
        }

        await this.workLogRepo.remove(log);
    }

    private toDto(l: TicketWorkLogEntity, userMap: Map<string, string>): WorkLogDto {
        return {
            id: l.id,
            ticketId: l.ticketId,
            userId: l.userId,
            userName: userMap.get(l.userId),
            timeSpentMinutes: l.timeSpentMinutes,
            description: l.description,
            logDate: (l.logDate as Date).toISOString().split("T")[0],
            createdAt: l.createdAt.toISOString()
        };
    }

    private async getUserMap(ids: string[]): Promise<Map<string, string>> {
        if (!ids.length) return new Map();
        const users = await this.userRepo.findBy({ id: In([...new Set(ids)]) });
        return new Map(users.map((u) => [u.id, u.displayName]));
    }
}
