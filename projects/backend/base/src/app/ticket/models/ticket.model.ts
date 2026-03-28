import type { TicketActivityAction } from "../entities/ticket-activity-log.entity";
import type { TicketLinkType } from "../entities/ticket-link.entity";
import type { TicketPriority, TicketStatus, TicketType } from "../entities/ticket.entity";

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface TicketDto {
    id: string;
    ticketNumber: number;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    type: TicketType;
    authorId: string;
    authorName?: string;
    assigneeId?: string;
    assigneeName?: string;
    categoryId?: string;
    categoryName?: string;
    projectId?: string;
    projectName?: string;
    parentId?: string;
    parentTitle?: string;
    storyPoints?: number;
    childCount: number;
    workflowStatusId?: string;
    workflowStatusName?: string;
    workflowStatusColor?: string;
    labels: LabelDto[];
    dueDate?: string;
    followUpDate?: string;
    isPinned: boolean;
    rating?: number;
    ratingComment?: string;
    customFields?: Record<string, unknown>;
    commentCount: number;
    resolvedAt?: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketLinkDto {
    id: string;
    sourceTicketId: string;
    sourceTicketTitle: string;
    sourceTicketNumber: number;
    targetTicketId: string;
    targetTicketTitle: string;
    targetTicketNumber: number;
    linkType: TicketLinkType;
    createdBy: string;
    createdByName?: string;
    createdAt: string;
}

export interface TicketActivityDto {
    id: string;
    ticketId: string;
    userId: string;
    userName?: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    action: TicketActivityAction;
    createdAt: string;
}

export interface TicketCommentDto {
    id: string;
    ticketId: string;
    authorId: string;
    authorName?: string;
    content: string;
    isInternal: boolean;
    statusChange?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketProjectDto {
    id: string;
    name: string;
    description?: string;
    status: string;
    ownerId: string;
    ownerName?: string;
    startDate?: string;
    endDate?: string;
    ticketCount: number;
    openTicketCount: number;
    workflowId?: string;
    workflowName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowDto {
    id: string;
    name: string;
    projectId?: string;
    isDefault: boolean;
    statuses: WorkflowStatusDto[];
    transitions: WorkflowTransitionDto[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowStatusDto {
    id: string;
    workflowId: string;
    name: string;
    slug: string;
    color: string;
    category: "todo" | "in_progress" | "done";
    position: number;
}

export interface WorkflowTransitionDto {
    id: string;
    workflowId: string;
    fromStatusId: string;
    toStatusId: string;
    name?: string;
}

export interface BoardColumnDto {
    status: WorkflowStatusDto;
    tickets: TicketDto[];
}

export interface BoardDataDto {
    projectId: string;
    workflowId: string;
    columns: BoardColumnDto[];
}

export interface TicketCategoryDto {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    position: number;
    isActive: boolean;
    ticketCount: number;
}

export interface LabelDto {
    id: string;
    name: string;
    color: string;
    categoryId?: string;
}

export interface TicketStatsDto {
    total: number;
    open: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
    avgResolutionTimeHours: number;
}
