export interface RoadmapEpic {
    id: string;
    ticketNumber: number;
    title: string;
    status: string;
    priority: string;
    startDate?: string;
    dueDate?: string;
    storyPoints?: number;
    childCount: number;
    completedChildCount: number;
    completionPercent: number;
}

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    userName?: string;
    role: "admin" | "developer" | "viewer";
    createdAt: string;
}

export interface AutomationRule {
    id: string;
    projectId: string;
    name: string;
    isActive: boolean;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    actionType: string;
    actionConfig: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CustomFieldDef {
    id: string;
    projectId: string;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    required: boolean;
    applicableTypes: string[];
    position: number;
}

export interface CreateAutomationPayload {
    projectId: string;
    name: string;
    isActive?: boolean;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    actionType: string;
    actionConfig: Record<string, unknown>;
}

export interface CreateCustomFieldPayload {
    projectId: string;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    required?: boolean;
    applicableTypes?: string[];
    position?: number;
}

export interface ManageMemberPayload {
    userId: string;
    role: "admin" | "developer" | "viewer";
}
