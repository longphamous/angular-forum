import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TicketSprintEntity } from "../entities/ticket-sprint.entity";
import { TicketEntity } from "../entities/ticket.entity";
import type { BurndownPointDto, SprintReportDto, VelocityEntryDto } from "../models/ticket.model";

@Injectable()
export class TicketReportingService {
    constructor(
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>,
        @InjectRepository(TicketSprintEntity) private readonly sprintRepo: Repository<TicketSprintEntity>
    ) {}

    async getBurndown(sprintId: string): Promise<BurndownPointDto[]> {
        const sprint = await this.sprintRepo.findOne({ where: { id: sprintId } });
        if (!sprint) throw new NotFoundException(`Sprint "${sprintId}" not found`);
        if (!sprint.startDate || !sprint.endDate) return [];

        const start = new Date(sprint.startDate);
        const end = sprint.completedAt ? new Date(sprint.completedAt) : new Date(sprint.endDate);

        // Get all tickets assigned to this sprint
        const tickets = await this.ticketRepo.find({
            where: { sprintId },
            select: ["id", "storyPoints", "resolvedAt", "closedAt"]
        });

        const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const idealBurnPerDay = totalPoints / totalDays;

        const points: BurndownPointDto[] = [];
        const current = new Date(start);

        for (let day = 0; day <= totalDays; day++) {
            const dateStr = current.toISOString().split("T")[0];

            // Count completed points up to this date
            const completedByDate = tickets
                .filter((t) => {
                    const doneDate = t.resolvedAt ?? t.closedAt;
                    return doneDate && new Date(doneDate) <= current;
                })
                .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

            points.push({
                date: dateStr,
                remaining: totalPoints - completedByDate,
                ideal: Math.max(0, totalPoints - idealBurnPerDay * day)
            });

            current.setDate(current.getDate() + 1);
        }

        return points;
    }

    async getVelocity(projectId: string): Promise<VelocityEntryDto[]> {
        const sprints = await this.sprintRepo.find({
            where: { projectId, status: "completed" },
            order: { completedAt: "ASC" },
            take: 10
        });

        const entries: VelocityEntryDto[] = [];

        for (const sprint of sprints) {
            const tickets = await this.ticketRepo.find({
                where: { sprintId: sprint.id },
                select: ["id", "storyPoints", "status"]
            });

            const completedStatuses = new Set(["resolved", "closed"]);
            const completedPoints = tickets
                .filter((t) => completedStatuses.has(t.status))
                .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
            const committedPoints = tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

            entries.push({
                sprintId: sprint.id,
                sprintName: sprint.name,
                completedPoints,
                committedPoints
            });
        }

        return entries;
    }

    async getSprintReport(sprintId: string): Promise<SprintReportDto> {
        const sprint = await this.sprintRepo.findOne({ where: { id: sprintId } });
        if (!sprint) throw new NotFoundException(`Sprint "${sprintId}" not found`);

        const tickets = await this.ticketRepo.find({
            where: { sprintId },
            select: ["id", "storyPoints", "status", "createdAt"]
        });

        const completedStatuses = new Set(["resolved", "closed"]);
        const completed = tickets.filter((t) => completedStatuses.has(t.status));
        const incomplete = tickets.filter((t) => !completedStatuses.has(t.status));

        // Tickets added after sprint start
        const addedMidSprint = sprint.startDate
            ? tickets.filter((t) => new Date(t.createdAt) > new Date(sprint.startDate!)).length
            : 0;

        return {
            sprintId: sprint.id,
            sprintName: sprint.name,
            startDate: sprint.startDate ? (sprint.startDate as Date).toISOString().split("T")[0] : undefined,
            endDate: sprint.endDate ? (sprint.endDate as Date).toISOString().split("T")[0] : undefined,
            completedItems: completed.length,
            incompleteItems: incomplete.length,
            addedMidSprint,
            removedMidSprint: 0,
            completedPoints: completed.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
            totalPoints: tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)
        };
    }
}
