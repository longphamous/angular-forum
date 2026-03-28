export type TicketStatus = "open" | "in_progress" | "waiting" | "follow_up" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "critical";
export type TicketType = "epic" | "story" | "bug" | "task" | "sub_task" | "support" | "feature";
export type TicketLinkType = "blocks" | "is_blocked_by" | "relates_to" | "duplicates";
export type TicketActivityAction = "created" | "updated" | "status_changed" | "commented" | "linked" | "unlinked";
export type ProjectStatus = "active" | "archived" | "completed";

export interface Ticket {
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
    labels: TicketLabel[];
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

export interface TicketComment {
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

export interface TicketLink {
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

export interface TicketActivity {
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

export interface TicketProject {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    ownerId: string;
    ownerName?: string;
    startDate?: string;
    endDate?: string;
    ticketCount: number;
    openTicketCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface TicketCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    position: number;
    isActive: boolean;
    ticketCount: number;
}

export interface TicketLabel {
    id: string;
    name: string;
    color: string;
    categoryId?: string;
}

export interface TicketStats {
    total: number;
    open: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
    avgResolutionTimeHours: number;
}

export interface PaginatedTickets {
    data: Ticket[];
    total: number;
    page: number;
    limit: number;
}

export interface PaginatedActivity {
    data: TicketActivity[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateTicketPayload {
    title: string;
    description: string;
    priority?: TicketPriority;
    type?: TicketType;
    categoryId?: string;
    projectId?: string;
    assigneeId?: string;
    parentId?: string;
    labelIds?: string[];
    dueDate?: string;
    storyPoints?: number;
    customFields?: Record<string, unknown>;
}

export interface UpdateTicketPayload {
    title?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    type?: TicketType;
    parentId?: string | null;
    storyPoints?: number | null;
    assigneeId?: string | null;
    categoryId?: string | null;
    projectId?: string | null;
    labelIds?: string[];
    dueDate?: string | null;
    followUpDate?: string | null;
    isPinned?: boolean;
    rating?: number;
    ratingComment?: string;
    customFields?: Record<string, unknown>;
}

export interface CreateCommentPayload {
    content: string;
    isInternal?: boolean;
    statusChange?: TicketStatus;
}

export interface CreateLinkPayload {
    targetTicketId: string;
    linkType: TicketLinkType;
}
