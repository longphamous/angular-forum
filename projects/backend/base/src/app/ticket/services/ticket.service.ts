import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Repository, SelectQueryBuilder } from "typeorm";

import { NotificationsService } from "../../notifications/notifications.service";
import { UserEntity } from "../../user/entities/user.entity";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { CreateLinkDto } from "../dto/create-link.dto";
import { CreateTicketDto } from "../dto/create-ticket.dto";
import { TicketQueryDto } from "../dto/ticket-query.dto";
import { UpdateTicketDto } from "../dto/update-ticket.dto";
import { TicketEntity, TicketStatus } from "../entities/ticket.entity";
import { TicketWorkflowStatusEntity } from "../entities/ticket-workflow-status.entity";
import { TicketCommentEntity } from "../entities/ticket-comment.entity";
import { TicketLabelEntity } from "../entities/ticket-label.entity";
import { TicketLinkEntity, type TicketLinkType } from "../entities/ticket-link.entity";
import type {
    PaginatedResult,
    TicketCommentDto,
    TicketDto,
    TicketLinkDto,
    TicketStatsDto
} from "../models/ticket.model";
import { TicketActivityService } from "./ticket-activity.service";
import { TicketWatcherService } from "./ticket-watcher.service";

@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>,
        @InjectRepository(TicketCommentEntity) private readonly commentRepo: Repository<TicketCommentEntity>,
        @InjectRepository(TicketLabelEntity) private readonly labelRepo: Repository<TicketLabelEntity>,
        @InjectRepository(TicketLinkEntity) private readonly linkRepo: Repository<TicketLinkEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(TicketWorkflowStatusEntity)
        private readonly workflowStatusRepo: Repository<TicketWorkflowStatusEntity>,
        private readonly dataSource: DataSource,
        private readonly notificationsService: NotificationsService,
        private readonly activityService: TicketActivityService,
        private readonly watcherService: TicketWatcherService
    ) {}

    // ── Tickets ────────────────────────────────────────────────────────────────

    async create(authorId: string, dto: CreateTicketDto): Promise<TicketDto> {
        const nextNumber = await this.nextTicketNumber(dto.projectId);

        // Determine initial workflow status (first "todo" status of the project's workflow)
        let workflowStatusId: string | undefined;
        if (dto.projectId) {
            const project = await this.dataSource.getRepository("TicketProjectEntity").findOne({
                where: { id: dto.projectId }
            });
            const workflowId = (project as { workflowId?: string } | null)?.workflowId;
            if (workflowId) {
                const firstStatus = await this.workflowStatusRepo.findOne({
                    where: { workflowId, category: "todo" },
                    order: { position: "ASC" }
                });
                if (firstStatus) workflowStatusId = firstStatus.id;
            }
        }

        // Calculate backlog position (append to end of backlog)
        const maxPos = await this.ticketRepo
            .createQueryBuilder("t")
            .select("COALESCE(MAX(t.backlog_position), 0)", "max")
            .where("t.project_id = :projectId", { projectId: dto.projectId })
            .andWhere("t.sprint_id IS NULL")
            .getRawOne<{ max: number }>();
        const backlogPosition = (maxPos?.max ?? 0) + 1;

        const ticket = this.ticketRepo.create({
            ticketNumber: nextNumber,
            title: dto.title,
            description: dto.description ?? "",
            priority: dto.priority ?? "normal",
            type: dto.type ?? "task",
            authorId,
            assigneeId: dto.assigneeId,
            categoryId: dto.categoryId,
            projectId: dto.projectId,
            parentId: dto.parentId,
            storyPoints: dto.storyPoints,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            customFields: dto.customFields,
            workflowStatusId,
            backlogPosition
        });

        const saved = await this.ticketRepo.save(ticket);

        if (dto.labelIds?.length) {
            const labels = await this.labelRepo.findBy({ id: In(dto.labelIds) });
            saved.labels = labels;
            await this.ticketRepo.save(saved);
        }

        if (dto.assigneeId && dto.assigneeId !== authorId) {
            void this.notificationsService.create(
                dto.assigneeId,
                "ticket_assigned",
                "Ticket assigned",
                `You have been assigned ticket #${nextNumber}: ${dto.title}`,
                `/tickets/${saved.id}`
            );
        }

        // Auto-watch: creator automatically watches the ticket
        void this.watcherService.watch(saved.id, authorId);
        if (dto.assigneeId && dto.assigneeId !== authorId) {
            void this.watcherService.watch(saved.id, dto.assigneeId);
        }

        void this.activityService.log(saved.id, authorId, "created");

        return this.findById(saved.id);
    }

    async findAll(query: TicketQueryDto): Promise<PaginatedResult<TicketDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const qb = this.ticketRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.category", "cat")
            .leftJoinAndSelect("t.project", "proj")
            .leftJoinAndSelect("t.labels", "lbl");

        this.applyFilters(qb, query);

        // Count before sorting/pagination (avoids TypeORM ORDER BY metadata crash with getManyAndCount)
        const total = await qb.getCount();

        this.applySorting(qb, query);
        qb.skip((page - 1) * limit).take(limit);

        const tickets = await qb.getMany();
        const userIds = [...new Set(tickets.flatMap((t) => [t.authorId, t.assigneeId].filter(Boolean)))];
        const userMap = await this.getUserMap(userIds as string[]);

        return {
            data: tickets.map((t) => this.toDto(t, userMap)),
            total,
            page,
            limit
        };
    }

    async findById(id: string): Promise<TicketDto> {
        const ticket = await this.ticketRepo.findOne({
            where: { id },
            relations: { category: true, project: true, labels: true, parent: true, workflowStatus: true, sprint: true }
        });
        if (!ticket) throw new NotFoundException(`Ticket "${id}" not found`);
        const childCount = await this.ticketRepo.count({ where: { parentId: id } });
        const userMap = await this.getUserMap([ticket.authorId, ticket.assigneeId].filter(Boolean) as string[]);
        return this.toDto(ticket, userMap, childCount);
    }

    async getChildren(parentId: string): Promise<TicketDto[]> {
        const tickets = await this.ticketRepo.find({
            where: { parentId },
            relations: { category: true, project: true, labels: true },
            order: { ticketNumber: "ASC" }
        });
        const userIds = [...new Set(tickets.flatMap((t) => [t.authorId, t.assigneeId].filter(Boolean)))];
        const userMap = await this.getUserMap(userIds as string[]);
        return tickets.map((t) => this.toDto(t, userMap));
    }

    // ── Links ────────────────────────────────────────────────────────────────

    async getLinks(ticketId: string): Promise<TicketLinkDto[]> {
        const links = await this.linkRepo.find({
            where: [{ sourceTicketId: ticketId }, { targetTicketId: ticketId }],
            relations: { sourceTicket: true, targetTicket: true }
        });
        const userIds = [...new Set(links.map((l) => l.createdBy))];
        const userMap = await this.getUserMap(userIds);
        return links.map((l) => this.toLinkDto(l, userMap));
    }

    async createLink(sourceTicketId: string, userId: string, dto: CreateLinkDto): Promise<TicketLinkDto> {
        if (sourceTicketId === dto.targetTicketId) {
            throw new BadRequestException("Cannot link a ticket to itself");
        }

        const [source, target] = await Promise.all([
            this.ticketRepo.findOne({ where: { id: sourceTicketId } }),
            this.ticketRepo.findOne({ where: { id: dto.targetTicketId } })
        ]);
        if (!source) throw new NotFoundException(`Ticket "${sourceTicketId}" not found`);
        if (!target) throw new NotFoundException(`Ticket "${dto.targetTicketId}" not found`);

        const link = this.linkRepo.create({
            sourceTicketId,
            targetTicketId: dto.targetTicketId,
            linkType: dto.linkType,
            createdBy: userId
        });

        const saved = await this.linkRepo.save(link);

        void this.activityService.log(
            sourceTicketId,
            userId,
            "linked",
            "link",
            undefined,
            `${dto.linkType} #${target.ticketNumber}`
        );

        // Notify watchers of both tickets
        void this.watcherService.notifyWatchers(
            sourceTicketId,
            userId,
            "ticket_linked",
            `Ticket #${source.ticketNumber} linked to #${target.ticketNumber} (${dto.linkType})`,
            `/tickets/${sourceTicketId}`
        );
        void this.watcherService.notifyWatchers(
            dto.targetTicketId,
            userId,
            "ticket_linked",
            `Ticket #${target.ticketNumber} linked to #${source.ticketNumber} (${dto.linkType})`,
            `/tickets/${dto.targetTicketId}`
        );

        const fullLink = await this.linkRepo.findOne({
            where: { id: saved.id },
            relations: { sourceTicket: true, targetTicket: true }
        });
        const userMap = await this.getUserMap([userId]);
        return this.toLinkDto(fullLink!, userMap);
    }

    async deleteLink(linkId: string, userId: string): Promise<void> {
        const link = await this.linkRepo.findOne({
            where: { id: linkId },
            relations: { sourceTicket: true, targetTicket: true }
        });
        if (!link) throw new NotFoundException(`Link "${linkId}" not found`);

        void this.activityService.log(
            link.sourceTicketId,
            userId,
            "unlinked",
            "link",
            `${link.linkType} #${link.targetTicket?.ticketNumber}`,
            undefined
        );

        await this.linkRepo.remove(link);
    }

    async update(id: string, userId: string, dto: UpdateTicketDto): Promise<TicketDto> {
        const ticket = await this.ticketRepo.findOne({ where: { id }, relations: { labels: true } });
        if (!ticket) throw new NotFoundException(`Ticket "${id}" not found`);

        // Capture old values for activity logging
        const oldValues: Record<string, unknown> = {};
        const newValues: Record<string, unknown> = {};

        const trackChange = (field: string, oldVal: unknown, newVal: unknown): void => {
            if (newVal !== undefined && oldVal !== newVal) {
                oldValues[field] = oldVal;
                newValues[field] = newVal;
            }
        };

        trackChange("title", ticket.title, dto.title);
        trackChange("description", ticket.description, dto.description);
        trackChange("priority", ticket.priority, dto.priority);
        trackChange("type", ticket.type, dto.type);
        trackChange("status", ticket.status, dto.status);
        trackChange("assigneeId", ticket.assigneeId, dto.assigneeId);
        trackChange("categoryId", ticket.categoryId, dto.categoryId);
        trackChange("projectId", ticket.projectId, dto.projectId);
        trackChange("parentId", ticket.parentId, dto.parentId);
        trackChange("storyPoints", ticket.storyPoints, dto.storyPoints);
        trackChange("isPinned", ticket.isPinned, dto.isPinned);
        trackChange("rating", ticket.rating, dto.rating);

        const oldStatus = ticket.status;
        const oldAssignee = ticket.assigneeId;

        if (dto.title !== undefined) ticket.title = dto.title;
        if (dto.description !== undefined) ticket.description = dto.description;
        if (dto.priority !== undefined) ticket.priority = dto.priority;
        if (dto.type !== undefined) ticket.type = dto.type;
        if (dto.status !== undefined) {
            ticket.status = dto.status;
            if (dto.status === "resolved" && !ticket.resolvedAt) ticket.resolvedAt = new Date();
            if (dto.status === "closed" && !ticket.closedAt) ticket.closedAt = new Date();
        }
        if (dto.assigneeId !== undefined) ticket.assigneeId = dto.assigneeId ?? undefined;
        if (dto.categoryId !== undefined) ticket.categoryId = dto.categoryId ?? undefined;
        if (dto.projectId !== undefined) ticket.projectId = dto.projectId ?? undefined;
        if (dto.parentId !== undefined) ticket.parentId = dto.parentId ?? undefined;
        if (dto.storyPoints !== undefined) ticket.storyPoints = dto.storyPoints ?? undefined;
        if (dto.sprintId !== undefined) ticket.sprintId = dto.sprintId ?? undefined;
        if (dto.originalEstimateMinutes !== undefined)
            ticket.originalEstimateMinutes = dto.originalEstimateMinutes ?? undefined;
        if (dto.remainingEstimateMinutes !== undefined)
            ticket.remainingEstimateMinutes = dto.remainingEstimateMinutes ?? undefined;
        if (dto.dueDate !== undefined) ticket.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
        if (dto.followUpDate !== undefined)
            ticket.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : undefined;
        if (dto.isPinned !== undefined) ticket.isPinned = dto.isPinned;
        if (dto.rating !== undefined) ticket.rating = dto.rating;
        if (dto.ratingComment !== undefined) ticket.ratingComment = dto.ratingComment;
        if (dto.customFields !== undefined) ticket.customFields = dto.customFields;

        if (dto.labelIds !== undefined) {
            ticket.labels = dto.labelIds.length ? await this.labelRepo.findBy({ id: In(dto.labelIds) }) : [];
        }

        await this.ticketRepo.save(ticket);

        // Log activity
        if (Object.keys(newValues).length > 0) {
            void this.activityService.logFieldChanges(id, userId, oldValues, newValues);
        }

        // Notifications
        if (dto.assigneeId && dto.assigneeId !== oldAssignee && dto.assigneeId !== userId) {
            void this.notificationsService.create(
                dto.assigneeId,
                "ticket_assigned",
                "Ticket assigned",
                `You have been assigned ticket #${ticket.ticketNumber}: ${ticket.title}`,
                `/tickets/${ticket.id}`
            );
            // New assignee auto-watches the ticket
            void this.watcherService.watch(ticket.id, dto.assigneeId);
        }

        if (dto.status && dto.status !== oldStatus) {
            // Notify watchers about status change
            void this.watcherService.notifyWatchers(
                ticket.id,
                userId,
                "ticket_status_changed",
                `Ticket #${ticket.ticketNumber} status changed to ${dto.status}`,
                `/tickets/${ticket.id}`
            );
        } else if (Object.keys(newValues).length > 0) {
            // Notify watchers about other field changes
            const changedFields = Object.keys(newValues).join(", ");
            void this.watcherService.notifyWatchers(
                ticket.id,
                userId,
                "ticket_updated",
                `Ticket #${ticket.ticketNumber} updated (${changedFields})`,
                `/tickets/${ticket.id}`
            );
        }

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) throw new NotFoundException(`Ticket "${id}" not found`);
        await this.ticketRepo.softRemove(ticket);
    }

    async getStats(projectId?: string): Promise<TicketStatsDto> {
        const qb = this.ticketRepo.createQueryBuilder("t");
        if (projectId) qb.where("t.project_id = :projectId", { projectId });

        const total = await qb.getCount();

        const statusCounts = await this.ticketRepo
            .createQueryBuilder("t")
            .select("t.status", "status")
            .addSelect("COUNT(*)", "count")
            .where(projectId ? "t.project_id = :projectId" : "1=1", { projectId })
            .groupBy("t.status")
            .getRawMany<{ status: TicketStatus; count: string }>();

        const countMap: Record<string, number> = {};
        for (const r of statusCounts) countMap[r.status] = parseInt(r.count, 10);

        // Calculate average resolution time for resolved/closed tickets
        const avgResult = await this.ticketRepo
            .createQueryBuilder("t")
            .select("AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)", "avgHours")
            .where("t.resolved_at IS NOT NULL")
            .andWhere(projectId ? "t.project_id = :projectId" : "1=1", { projectId })
            .getRawOne<{ avgHours: string | null }>();

        return {
            total,
            open: countMap["open"] ?? 0,
            inProgress: countMap["in_progress"] ?? 0,
            waiting: countMap["waiting"] ?? 0,
            resolved: countMap["resolved"] ?? 0,
            closed: countMap["closed"] ?? 0,
            avgResolutionTimeHours: parseFloat(avgResult?.avgHours ?? "0") || 0
        };
    }

    // ── Comments ───────────────────────────────────────────────────────────────

    async getComments(ticketId: string, userId: string, isStaff: boolean): Promise<TicketCommentDto[]> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);

        const qb = this.commentRepo.createQueryBuilder("c").where("c.ticket_id = :ticketId", { ticketId });

        // Non-staff can only see non-internal comments (or their own)
        if (!isStaff && ticket.authorId !== userId) {
            qb.andWhere("c.is_internal = false");
        } else if (!isStaff) {
            qb.andWhere("(c.is_internal = false OR c.author_id = :userId)", { userId });
        }

        qb.orderBy("c.created_at", "ASC");
        const comments = await qb.getMany();
        const userIds = [...new Set(comments.map((c) => c.authorId))];
        const userMap = await this.getUserMap(userIds);

        return comments.map((c) => this.toCommentDto(c, userMap));
    }

    async addComment(ticketId: string, authorId: string, dto: CreateCommentDto): Promise<TicketCommentDto> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket "${ticketId}" not found`);

        // Non-staff cannot create internal comments
        if (dto.isInternal && ticket.authorId === authorId) {
            throw new ForbiddenException("Only staff can create internal comments");
        }

        const comment = this.commentRepo.create({
            ticketId,
            authorId,
            content: dto.content,
            isInternal: dto.isInternal ?? false,
            statusChange: dto.statusChange
        });

        const saved = await this.commentRepo.save(comment);

        // Update comment count
        ticket.commentCount = await this.commentRepo.count({ where: { ticketId } });

        // Track first response (first non-author comment)
        if (!ticket.firstResponseAt && authorId !== ticket.authorId) {
            ticket.firstResponseAt = new Date();
        }

        // Apply status change if provided
        if (dto.statusChange) {
            ticket.status = dto.statusChange;
            if (dto.statusChange === "resolved" && !ticket.resolvedAt) ticket.resolvedAt = new Date();
            if (dto.statusChange === "closed" && !ticket.closedAt) ticket.closedAt = new Date();
        }

        await this.ticketRepo.save(ticket);

        // Notify all watchers about new comment (except the author of the comment)
        if (!dto.isInternal) {
            void this.watcherService.notifyWatchers(
                ticketId,
                authorId,
                "ticket_commented",
                `New comment on ticket #${ticket.ticketNumber}: ${ticket.title}`,
                `/tickets/${ticketId}`
            );
        }

        // Notify assignee only if they are not already a watcher (watchers are notified above)
        if (ticket.assigneeId && authorId !== ticket.assigneeId && !dto.isInternal) {
            const isWatching = await this.watcherService.isWatching(ticketId, ticket.assigneeId);
            if (!isWatching) {
                void this.notificationsService.create(
                    ticket.assigneeId,
                    "ticket_commented",
                    "New comment on assigned ticket",
                    `New reply on ticket #${ticket.ticketNumber}: ${ticket.title}`,
                    `/tickets/${ticketId}`
                );
            }
        }

        void this.activityService.log(ticketId, authorId, "commented");

        const userMap = await this.getUserMap([saved.authorId]);
        return this.toCommentDto(saved, userMap);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private async nextTicketNumber(projectId?: string): Promise<number> {
        const result = await this.ticketRepo
            .createQueryBuilder("t")
            .select("COALESCE(MAX(t.ticket_number), 0)", "max")
            .where(projectId ? "t.project_id = :projectId" : "1=1", { projectId })
            .getRawOne<{ max: string }>();
        return parseInt(result?.max ?? "0", 10) + 1;
    }

    private applyFilters(qb: SelectQueryBuilder<TicketEntity>, query: TicketQueryDto): void {
        if (query.status) qb.andWhere("t.status = :status", { status: query.status });
        if (query.priority) qb.andWhere("t.priority = :priority", { priority: query.priority });
        if (query.type) qb.andWhere("t.type = :type", { type: query.type });
        if (query.parentId) qb.andWhere("t.parent_id = :parentId", { parentId: query.parentId });
        if (query.categoryId) qb.andWhere("t.category_id = :categoryId", { categoryId: query.categoryId });
        if (query.projectId) qb.andWhere("t.project_id = :projectId", { projectId: query.projectId });
        if (query.assigneeId) qb.andWhere("t.assignee_id = :assigneeId", { assigneeId: query.assigneeId });
        if (query.search) {
            qb.andWhere("(t.title ILIKE :search OR t.description ILIKE :search)", { search: `%${query.search}%` });
        }
    }

    private applySorting(qb: SelectQueryBuilder<TicketEntity>, query: TicketQueryDto): void {
        const dir = query.sortOrder === "ASC" ? "ASC" : "DESC";
        // Use Entity property names (camelCase), NOT database column names (snake_case).
        // TypeORM's getMany() validates ORDER BY against entity metadata and crashes with snake_case.
        qb.orderBy("t.isPinned", "DESC");

        switch (query.sortBy) {
            case "priority":
                qb.addOrderBy("t.priority", dir);
                break;
            case "ticketNumber":
                qb.addOrderBy("t.ticketNumber", dir);
                break;
            case "title":
                qb.addOrderBy("t.title", dir);
                break;
            case "dueDate":
                qb.addOrderBy("t.dueDate", dir, "NULLS LAST");
                break;
            case "createdAt":
            default:
                qb.addOrderBy("t.createdAt", dir);
        }
    }

    private async getUserMap(ids: string[]): Promise<Map<string, string>> {
        if (!ids.length) return new Map();
        const users = await this.userRepo.findBy({ id: In([...new Set(ids)]) });
        return new Map(users.map((u) => [u.id, u.displayName]));
    }

    private toDto(t: TicketEntity, userMap: Map<string, string>, childCount = 0): TicketDto {
        return {
            id: t.id,
            ticketNumber: t.ticketNumber,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            type: t.type,
            authorId: t.authorId,
            authorName: userMap.get(t.authorId),
            assigneeId: t.assigneeId,
            assigneeName: t.assigneeId ? userMap.get(t.assigneeId) : undefined,
            categoryId: t.categoryId,
            categoryName: t.category?.name,
            projectId: t.projectId,
            projectName: t.project?.name,
            parentId: t.parentId,
            parentTitle: t.parent?.title,
            storyPoints: t.storyPoints,
            childCount,
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
            labels: (t.labels ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color, categoryId: l.categoryId })),
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
        };
    }

    private toLinkDto(l: TicketLinkEntity, userMap: Map<string, string>): TicketLinkDto {
        return {
            id: l.id,
            sourceTicketId: l.sourceTicketId,
            sourceTicketTitle: l.sourceTicket?.title ?? "",
            sourceTicketNumber: l.sourceTicket?.ticketNumber ?? 0,
            targetTicketId: l.targetTicketId,
            targetTicketTitle: l.targetTicket?.title ?? "",
            targetTicketNumber: l.targetTicket?.ticketNumber ?? 0,
            linkType: l.linkType,
            createdBy: l.createdBy,
            createdByName: userMap.get(l.createdBy),
            createdAt: l.createdAt.toISOString()
        };
    }

    private toCommentDto(c: TicketCommentEntity, userMap: Map<string, string>): TicketCommentDto {
        return {
            id: c.id,
            ticketId: c.ticketId,
            authorId: c.authorId,
            authorName: userMap.get(c.authorId),
            content: c.content,
            isInternal: c.isInternal,
            statusChange: c.statusChange,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString()
        };
    }
}
