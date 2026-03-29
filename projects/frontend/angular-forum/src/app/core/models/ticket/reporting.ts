export interface BurndownPoint {
    date: string;
    remaining: number;
    ideal: number;
}

export interface VelocityEntry {
    sprintId: string;
    sprintName: string;
    completedPoints: number;
    committedPoints: number;
}

export interface SprintReport {
    sprintId: string;
    sprintName: string;
    startDate?: string;
    endDate?: string;
    completedItems: number;
    incompleteItems: number;
    addedMidSprint: number;
    removedMidSprint: number;
    completedPoints: number;
    totalPoints: number;
}

export interface SlaConfig {
    id: string;
    projectId: string;
    priority: string;
    firstResponseHours: number;
    resolutionHours: number;
}

export interface SlaStatus {
    ticketId: string;
    ticketNumber: number;
    title: string;
    priority: string;
    firstResponse: "ok" | "at_risk" | "breached";
    resolution: "ok" | "at_risk" | "breached";
    firstResponseDeadline?: string;
    resolutionDeadline?: string;
}
