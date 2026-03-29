export type SprintStatus = "planning" | "active" | "completed";

export interface Sprint {
    id: string;
    projectId: string;
    name: string;
    goal?: string;
    status: SprintStatus;
    startDate?: string;
    endDate?: string;
    completedAt?: string;
    ticketCount: number;
    completedTicketCount: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSprintPayload {
    projectId: string;
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
}

export interface UpdateSprintPayload {
    name?: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
}
