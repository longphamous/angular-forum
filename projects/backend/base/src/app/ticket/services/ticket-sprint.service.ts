import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { BacklogReorderDto } from "../dto/backlog-reorder.dto";
import { CreateSprintDto } from "../dto/create-sprint.dto";
import { UpdateSprintDto } from "../dto/update-sprint.dto";
import { TicketEntity } from "../entities/ticket.entity";
import { TicketSprintEntity } from "../entities/ticket-sprint.entity";
import type { PaginatedResult, SprintDto, TicketDto } from "../models/ticket.model";
import { TicketService } from "./ticket.service";

@Injectable()
export class TicketSprintService {
    constructor(
        @InjectRepository(TicketSprintEntity) private readonly sprintRepo: Repository<TicketSprintEntity>,
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>,
        private readonly ticketService: TicketService
    ) {}

    // ── CRUD ─────────────────────────────────────────────────────────────────

    async getSprints(projectId: string): Promise<SprintDto[]> {
        const sprints = await this.sprintRepo.find({
            where: { projectId },
            order: { createdAt: "DESC" }
        });
        return Promise.all(sprints.map((s) => this.toDto(s)));
    }

    async getSprint(id: string): Promise<SprintDto> {
        const sprint = await this.sprintRepo.findOne({ where: { id } });
        if (!sprint) throw new NotFoundException(`Sprint "${id}" not found`);
        return this.toDto(sprint);
    }

    async createSprint(dto: CreateSprintDto): Promise<SprintDto> {
        const sprint = this.sprintRepo.create({
            projectId: dto.projectId,
            name: dto.name,
            goal: dto.goal,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined
        });
        const saved = await this.sprintRepo.save(sprint);
        return this.toDto(saved);
    }

    async updateSprint(id: string, dto: UpdateSprintDto): Promise<SprintDto> {
        const sprint = await this.sprintRepo.findOne({ where: { id } });
        if (!sprint) throw new NotFoundException(`Sprint "${id}" not found`);

        if (dto.name !== undefined) sprint.name = dto.name;
        if (dto.goal !== undefined) sprint.goal = dto.goal;
        if (dto.startDate !== undefined) sprint.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
        if (dto.endDate !== undefined) sprint.endDate = dto.endDate ? new Date(dto.endDate) : undefined;

        await this.sprintRepo.save(sprint);
        return this.toDto(sprint);
    }

    async deleteSprint(id: string): Promise<void> {
        const sprint = await this.sprintRepo.findOne({ where: { id } });
        if (!sprint) throw new NotFoundException(`Sprint "${id}" not found`);

        // Move tickets back to backlog
        await this.ticketRepo.update({ sprintId: id }, { sprintId: undefined as unknown as string });
        await this.sprintRepo.remove(sprint);
    }

    // ── Sprint Actions ───────────────────────────────────────────────────────

    async startSprint(id: string): Promise<SprintDto> {
        const sprint = await this.sprintRepo.findOne({ where: { id } });
        if (!sprint) throw new NotFoundException(`Sprint "${id}" not found`);
        if (sprint.status !== "planning") throw new BadRequestException("Only planning sprints can be started");

        // Check no other active sprint for this project
        const activeSprint = await this.sprintRepo.findOne({
            where: { projectId: sprint.projectId, status: "active" }
        });
        if (activeSprint) throw new BadRequestException(`Project already has an active sprint: "${activeSprint.name}"`);

        sprint.status = "active";
        if (!sprint.startDate) sprint.startDate = new Date();
        await this.sprintRepo.save(sprint);
        return this.toDto(sprint);
    }

    async completeSprint(id: string): Promise<SprintDto> {
        const sprint = await this.sprintRepo.findOne({ where: { id } });
        if (!sprint) throw new NotFoundException(`Sprint "${id}" not found`);
        if (sprint.status !== "active") throw new BadRequestException("Only active sprints can be completed");

        sprint.status = "completed";
        sprint.completedAt = new Date();
        await this.sprintRepo.save(sprint);

        // Move incomplete tickets back to backlog
        const incompleteTickets = await this.ticketRepo.find({
            where: { sprintId: id }
        });

        for (const ticket of incompleteTickets) {
            const isDone = ticket.status === "resolved" || ticket.status === "closed";
            if (!isDone) {
                ticket.sprintId = undefined;
                await this.ticketRepo.save(ticket);
            }
        }

        return this.toDto(sprint);
    }

    // ── Backlog ──────────────────────────────────────────────────────────────

    async getBacklog(projectId: string, page = 1, limit = 50): Promise<PaginatedResult<TicketDto>> {
        const [tickets, total] = await this.ticketRepo.findAndCount({
            where: { projectId, sprintId: IsNull(), deletedAt: IsNull() },
            relations: { category: true, labels: true, parent: true, workflowStatus: true, sprint: true },
            order: { backlogPosition: { direction: "ASC", nulls: "LAST" }, createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            data: tickets.map((t) => ({
                id: t.id,
                ticketNumber: t.ticketNumber,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                type: t.type,
                authorId: t.authorId,
                assigneeId: t.assigneeId,
                categoryId: t.categoryId,
                categoryName: t.category?.name,
                projectId: t.projectId,
                parentId: t.parentId,
                parentTitle: t.parent?.title,
                storyPoints: t.storyPoints,
                childCount: 0,
                workflowStatusId: t.workflowStatusId,
                workflowStatusName: t.workflowStatus?.name,
                workflowStatusColor: t.workflowStatus?.color,
                sprintId: t.sprintId,
                sprintName: t.sprint?.name,
                backlogPosition: t.backlogPosition,
                originalEstimateMinutes: t.originalEstimateMinutes,
                remainingEstimateMinutes: t.remainingEstimateMinutes,
                timeSpentMinutes: t.timeSpentMinutes ?? 0,
                watcherCount: 0,
                attachmentCount: 0,
                labels: (t.labels ?? []).map((l) => ({
                    id: l.id,
                    name: l.name,
                    color: l.color,
                    categoryId: l.categoryId
                })),
                dueDate: t.dueDate?.toISOString(),
                followUpDate: t.followUpDate?.toISOString(),
                isPinned: t.isPinned,
                rating: t.rating,
                ratingComment: t.ratingComment,
                customFields: t.customFields,
                commentCount: t.commentCount,
                resolvedAt: t.resolvedAt?.toISOString(),
                closedAt: t.closedAt?.toISOString(),
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString()
            })),
            total,
            page,
            limit
        };
    }

    async reorderBacklog(projectId: string, dto: BacklogReorderDto): Promise<void> {
        for (let i = 0; i < dto.ticketIds.length; i++) {
            await this.ticketRepo.update({ id: dto.ticketIds[i], projectId }, { backlogPosition: i });
        }
    }

    async moveToSprint(ticketId: string, sprintId: string): Promise<void> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);
        ticket.sprintId = sprintId;
        ticket.backlogPosition = undefined;
        await this.ticketRepo.save(ticket);
    }

    async moveToBacklog(ticketId: string): Promise<void> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);
        ticket.sprintId = undefined;
        await this.ticketRepo.save(ticket);
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private async toDto(sprint: TicketSprintEntity): Promise<SprintDto> {
        const tickets = await this.ticketRepo.find({
            where: { sprintId: sprint.id },
            select: ["id", "status", "storyPoints"]
        });

        const completedStatuses = new Set(["resolved", "closed"]);
        const completedTickets = tickets.filter((t) => completedStatuses.has(t.status));

        return {
            id: sprint.id,
            projectId: sprint.projectId,
            name: sprint.name,
            goal: sprint.goal,
            status: sprint.status,
            startDate: sprint.startDate ? (sprint.startDate as Date).toISOString().split("T")[0] : undefined,
            endDate: sprint.endDate ? (sprint.endDate as Date).toISOString().split("T")[0] : undefined,
            completedAt: sprint.completedAt?.toISOString(),
            ticketCount: tickets.length,
            completedTicketCount: completedTickets.length,
            totalStoryPoints: tickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
            completedStoryPoints: completedTickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
            createdAt: sprint.createdAt.toISOString(),
            updatedAt: sprint.updatedAt.toISOString()
        };
    }
}
