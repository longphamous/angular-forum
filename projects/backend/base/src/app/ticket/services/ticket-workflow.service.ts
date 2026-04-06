import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { BoardQueryDto } from "../dto/board-query.dto";
import { CreateWorkflowDto } from "../dto/create-workflow.dto";
import { UpdateWorkflowDto } from "../dto/update-workflow.dto";
import { TicketEntity } from "../entities/ticket.entity";
import { TicketWorkflowEntity } from "../entities/ticket-workflow.entity";
import { TicketWorkflowStatusEntity } from "../entities/ticket-workflow-status.entity";
import { TicketWorkflowTransitionEntity } from "../entities/ticket-workflow-transition.entity";
import type {
    BoardColumnDto,
    BoardDataDto,
    TicketDto,
    WorkflowDto,
    WorkflowStatusDto,
    WorkflowTransitionDto
} from "../models/ticket.model";
import { TicketService } from "./ticket.service";
import { TicketActivityService } from "./ticket-activity.service";

@Injectable()
export class TicketWorkflowService {
    constructor(
        @InjectRepository(TicketWorkflowEntity) private readonly workflowRepo: Repository<TicketWorkflowEntity>,
        @InjectRepository(TicketWorkflowStatusEntity)
        private readonly statusRepo: Repository<TicketWorkflowStatusEntity>,
        @InjectRepository(TicketWorkflowTransitionEntity)
        private readonly transitionRepo: Repository<TicketWorkflowTransitionEntity>,
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>,
        private readonly dataSource: DataSource,
        private readonly activityService: TicketActivityService,
        private readonly ticketService: TicketService
    ) {}

    // ── CRUD ─────────────────────────────────────────────────────────────────

    async getWorkflows(projectId?: string): Promise<WorkflowDto[]> {
        const where = projectId ? { projectId } : {};
        const workflows = await this.workflowRepo.find({
            where,
            relations: { statuses: true, transitions: true },
            order: { createdAt: "DESC" }
        });
        return workflows.map((w) => this.toDto(w));
    }

    async getWorkflow(id: string): Promise<WorkflowDto> {
        const wf = await this.workflowRepo.findOne({
            where: { id },
            relations: { statuses: true, transitions: true }
        });
        if (!wf) throw new NotFoundException(`Workflow "${id}" not found`);
        return this.toDto(wf);
    }

    async createWorkflow(dto: CreateWorkflowDto): Promise<WorkflowDto> {
        let workflowId: string;

        await this.dataSource.transaction(async (manager) => {
            const workflow = manager.create(TicketWorkflowEntity, {
                name: dto.name,
                projectId: dto.projectId,
                isDefault: dto.isDefault ?? false
            });
            const savedWorkflow = await manager.save(workflow);
            workflowId = savedWorkflow.id;

            // Create statuses
            const statusMap = new Map<string, TicketWorkflowStatusEntity>();
            for (const s of dto.statuses) {
                const status = manager.create(TicketWorkflowStatusEntity, {
                    workflowId: savedWorkflow.id,
                    name: s.name,
                    slug: s.slug,
                    color: s.color ?? "#6B7280",
                    category: s.category,
                    position: s.position
                });
                const saved = await manager.save(status);
                statusMap.set(s.slug, saved);
            }

            // Create transitions
            if (dto.transitions?.length) {
                for (const t of dto.transitions) {
                    const from = statusMap.get(t.fromSlug);
                    const to = statusMap.get(t.toSlug);
                    if (!from || !to) continue;

                    const transition = manager.create(TicketWorkflowTransitionEntity, {
                        workflowId: savedWorkflow.id,
                        fromStatusId: from.id,
                        toStatusId: to.id,
                        name: t.name
                    });
                    await manager.save(transition);
                }
            }
        });

        // Read after transaction is committed so the data is visible
        return this.getWorkflow(workflowId!);
    }

    async updateWorkflow(id: string, dto: UpdateWorkflowDto): Promise<WorkflowDto> {
        const workflow = await this.workflowRepo.findOne({ where: { id } });
        if (!workflow) throw new NotFoundException(`Workflow "${id}" not found`);

        if (dto.name !== undefined) workflow.name = dto.name;
        if (dto.isDefault !== undefined) workflow.isDefault = dto.isDefault;
        await this.workflowRepo.save(workflow);

        // Replace statuses if provided
        if (dto.statuses) {
            await this.dataSource.transaction(async (manager) => {
                // Delete existing transitions first (FK dependency)
                await manager.delete(TicketWorkflowTransitionEntity, { workflowId: id });
                // Delete existing statuses
                await manager.delete(TicketWorkflowStatusEntity, { workflowId: id });

                // Create new statuses
                const statusMap = new Map<string, TicketWorkflowStatusEntity>();
                for (const s of dto.statuses!) {
                    const status = manager.create(TicketWorkflowStatusEntity, {
                        workflowId: id,
                        name: s.name,
                        slug: s.slug,
                        color: s.color ?? "#6B7280",
                        category: s.category,
                        position: s.position
                    });
                    const saved = await manager.save(status);
                    statusMap.set(s.slug, saved);
                }

                // Create new transitions
                if (dto.transitions?.length) {
                    for (const t of dto.transitions) {
                        const from = statusMap.get(t.fromSlug);
                        const to = statusMap.get(t.toSlug);
                        if (!from || !to) continue;

                        const transition = manager.create(TicketWorkflowTransitionEntity, {
                            workflowId: id,
                            fromStatusId: from.id,
                            toStatusId: to.id,
                            name: t.name
                        });
                        await manager.save(transition);
                    }
                }
            });
        }

        return this.getWorkflow(id);
    }

    async deleteWorkflow(id: string): Promise<void> {
        const wf = await this.workflowRepo.findOne({ where: { id } });
        if (!wf) throw new NotFoundException(`Workflow "${id}" not found`);
        await this.workflowRepo.remove(wf);
    }

    // ── Default Workflow ─────────────────────────────────────────────────────

    async seedDefaultWorkflow(projectId?: string): Promise<WorkflowDto> {
        return this.createWorkflow({
            name: "Standard",
            projectId,
            isDefault: true,
            statuses: [
                { name: "To Do", slug: "todo", color: "#6B7280", category: "todo", position: 0 },
                { name: "In Progress", slug: "in_progress", color: "#F59E0B", category: "in_progress", position: 1 },
                { name: "Review", slug: "review", color: "#8B5CF6", category: "in_progress", position: 2 },
                { name: "Done", slug: "done", color: "#10B981", category: "done", position: 3 }
            ],
            transitions: [
                { fromSlug: "todo", toSlug: "in_progress", name: "Start Work" },
                { fromSlug: "in_progress", toSlug: "review", name: "Submit for Review" },
                { fromSlug: "review", toSlug: "in_progress", name: "Request Changes" },
                { fromSlug: "review", toSlug: "done", name: "Approve" },
                { fromSlug: "in_progress", toSlug: "todo", name: "Move Back" },
                { fromSlug: "done", toSlug: "todo", name: "Reopen" }
            ]
        });
    }

    // ── Board ────────────────────────────────────────────────────────────────

    async getBoardData(projectId: string, query: BoardQueryDto): Promise<BoardDataDto> {
        // Find project's workflow
        const project = await this.dataSource.getRepository("TicketProjectEntity").findOne({
            where: { id: projectId },
            relations: ["workflow"]
        });
        if (!project) throw new NotFoundException(`Project "${projectId}" not found`);

        let workflowId = (project as { workflowId?: string }).workflowId;

        // Auto-create default workflow if missing or if referenced workflow no longer exists
        if (workflowId) {
            const workflowExists = await this.workflowRepo.findOne({ where: { id: workflowId } });
            if (!workflowExists) workflowId = undefined;
        }
        if (!workflowId) {
            const defaultWorkflow = await this.seedDefaultWorkflow(projectId);
            workflowId = defaultWorkflow.id;
            await this.dataSource
                .getRepository("TicketProjectEntity")
                .update(projectId, { workflowId });
        }

        // Load workflow statuses
        const statuses = await this.statusRepo.find({
            where: { workflowId },
            order: { position: "ASC" }
        });

        // Load tickets for this project
        const qb = this.ticketRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.category", "cat")
            .leftJoinAndSelect("t.labels", "lbl")
            .leftJoinAndSelect("t.workflowStatus", "ws")
            .where("t.project_id = :projectId", { projectId })
            .andWhere("t.deleted_at IS NULL");

        if (query.assigneeId) qb.andWhere("t.assignee_id = :assigneeId", { assigneeId: query.assigneeId });
        if (query.type) qb.andWhere("t.type = :type", { type: query.type });
        if (query.search)
            qb.andWhere("(t.title ILIKE :search OR t.description ILIKE :search)", { search: `%${query.search}%` });

        qb.addOrderBy("t.isPinned", "DESC").addOrderBy("t.createdAt", "ASC");

        const tickets = await qb.getMany();

        // Group tickets into columns
        const columns: BoardColumnDto[] = statuses.map((status) => ({
            status: this.toStatusDto(status),
            tickets: tickets.filter((t) => t.workflowStatusId === status.id).map((t) => this.toTicketDto(t))
        }));

        // Add unassigned tickets (no workflow status) to first column
        const unassigned = tickets.filter((t) => !t.workflowStatusId);
        if (unassigned.length && columns.length) {
            columns[0].tickets.unshift(...unassigned.map((t) => this.toTicketDto(t)));
        }

        return {
            projectId,
            workflowId,
            columns
        };
    }

    async moveCard(ticketId: string, toStatusId: string, userId: string): Promise<void> {
        const ticket = await this.ticketRepo.findOne({
            where: { id: ticketId },
            relations: { project: true }
        });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);

        const toStatus = await this.statusRepo.findOne({ where: { id: toStatusId } });
        if (!toStatus) throw new NotFoundException(`Status "${toStatusId}" not found`);

        const oldStatusId = ticket.workflowStatusId;
        const oldStatusName = ticket.workflowStatus?.name;

        // Validate transition if ticket already has a workflow status
        if (oldStatusId && oldStatusId !== toStatusId) {
            const transitionExists = await this.transitionRepo.findOne({
                where: { workflowId: toStatus.workflowId, fromStatusId: oldStatusId, toStatusId }
            });
            if (!transitionExists) {
                throw new BadRequestException(`Transition from current status to "${toStatus.name}" is not allowed`);
            }
        }

        // Update workflow status
        ticket.workflowStatusId = toStatusId;

        // Sync legacy status field based on category
        const categoryMap: Record<string, string> = {
            todo: "open",
            in_progress: "in_progress",
            done: "closed"
        };
        const newLegacyStatus = categoryMap[toStatus.category] ?? "open";
        const oldLegacyStatus = ticket.status;
        ticket.status = newLegacyStatus as typeof ticket.status;

        if (toStatus.category === "done" && !ticket.resolvedAt) {
            ticket.resolvedAt = new Date();
        }
        if (toStatus.category === "done" && !ticket.closedAt) {
            ticket.closedAt = new Date();
        }

        await this.ticketRepo.save(ticket);

        // Log activity
        void this.activityService.log(
            ticketId,
            userId,
            "status_changed",
            "workflowStatus",
            oldStatusName ?? oldLegacyStatus,
            toStatus.name
        );
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private toDto(wf: TicketWorkflowEntity): WorkflowDto {
        const statuses = (wf.statuses ?? []).sort((a, b) => a.position - b.position).map((s) => this.toStatusDto(s));

        return {
            id: wf.id,
            name: wf.name,
            projectId: wf.projectId,
            isDefault: wf.isDefault,
            statuses,
            transitions: (wf.transitions ?? []).map((t) => this.toTransitionDto(t)),
            createdAt: wf.createdAt.toISOString(),
            updatedAt: wf.updatedAt.toISOString()
        };
    }

    private toStatusDto(s: TicketWorkflowStatusEntity): WorkflowStatusDto {
        return {
            id: s.id,
            workflowId: s.workflowId,
            name: s.name,
            slug: s.slug,
            color: s.color,
            category: s.category,
            position: s.position
        };
    }

    private toTransitionDto(t: TicketWorkflowTransitionEntity): WorkflowTransitionDto {
        return {
            id: t.id,
            workflowId: t.workflowId,
            fromStatusId: t.fromStatusId,
            toStatusId: t.toStatusId,
            name: t.name
        };
    }

    private toTicketDto(t: TicketEntity): TicketDto {
        return {
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
            storyPoints: t.storyPoints,
            childCount: 0,
            workflowStatusId: t.workflowStatusId,
            workflowStatusName: t.workflowStatus?.name,
            workflowStatusColor: t.workflowStatus?.color,
            labels: (t.labels ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color, categoryId: l.categoryId })),
            dueDate: t.dueDate?.toISOString(),
            followUpDate: t.followUpDate?.toISOString(),
            isPinned: t.isPinned,
            rating: t.rating,
            ratingComment: t.ratingComment,
            customFields: t.customFields,
            originalEstimateMinutes: t.originalEstimateMinutes,
            remainingEstimateMinutes: t.remainingEstimateMinutes,
            timeSpentMinutes: t.timeSpentMinutes ?? 0,
            watcherCount: 0,
            attachmentCount: 0,
            commentCount: t.commentCount,
            resolvedAt: t.resolvedAt?.toISOString(),
            closedAt: t.closedAt?.toISOString(),
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString()
        };
    }
}
