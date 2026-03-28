import type { Ticket } from "./ticket";

export type WorkflowStatusCategory = "todo" | "in_progress" | "done";

export interface Workflow {
    id: string;
    name: string;
    projectId?: string;
    isDefault: boolean;
    statuses: WorkflowStatus[];
    transitions: WorkflowTransition[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowStatus {
    id: string;
    workflowId: string;
    name: string;
    slug: string;
    color: string;
    category: WorkflowStatusCategory;
    position: number;
}

export interface WorkflowTransition {
    id: string;
    workflowId: string;
    fromStatusId: string;
    toStatusId: string;
    name?: string;
}

export interface BoardColumn {
    status: WorkflowStatus;
    tickets: Ticket[];
}

export interface BoardData {
    projectId: string;
    workflowId: string;
    columns: BoardColumn[];
}

export interface CreateWorkflowPayload {
    name: string;
    projectId?: string;
    isDefault?: boolean;
    statuses: WorkflowStatusInput[];
    transitions?: WorkflowTransitionInput[];
}

export interface UpdateWorkflowPayload {
    name?: string;
    isDefault?: boolean;
    statuses?: WorkflowStatusInput[];
    transitions?: WorkflowTransitionInput[];
}

export interface WorkflowStatusInput {
    name: string;
    slug: string;
    color?: string;
    category: WorkflowStatusCategory;
    position: number;
}

export interface WorkflowTransitionInput {
    fromSlug: string;
    toSlug: string;
    name?: string;
}

export interface BoardMovePayload {
    ticketId: string;
    toStatusId: string;
    position?: number;
}
