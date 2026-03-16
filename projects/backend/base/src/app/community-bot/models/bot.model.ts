export type BotTrigger =
    | "new_user"
    | "user_birthday"
    | "user_inactivity"
    | "new_thread"
    | "scheduled"
    | "user_group_change";

export type BotAction = "send_notification" | "send_private_message" | "log_only";

export type BotConditionField = "user_role" | "user_post_count" | "user_registration_days" | "user_group_id";

export type BotConditionOperator = "eq" | "ne" | "gt" | "lt" | "gte" | "lte";

export interface BotCondition {
    field: BotConditionField;
    operator: BotConditionOperator;
    value: string | number;
}

export interface TriggerConfig {
    inactiveDays?: number;
    forumId?: string;
    cronExpression?: string;
    groupId?: string;
}

export interface ActionConfig {
    notificationTitle?: string;
    notificationBody?: string;
    notificationLink?: string;
    messageSubject?: string;
    messageBody?: string;
    recipientType?: "target_user" | "admin";
}

export interface BotDto {
    id: string;
    name: string;
    description: string | null;
    enabled: boolean;
    testMode: boolean;
    trigger: BotTrigger;
    triggerConfig: TriggerConfig | null;
    conditions: BotCondition[] | null;
    action: BotAction;
    actionConfig: ActionConfig | null;
    language: string;
    lastRunAt: Date | null;
    runCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BotLogDto {
    id: string;
    botId: string | null;
    botName: string;
    trigger: string;
    action: string;
    status: "success" | "failed" | "test" | "skipped";
    targetUserId: string | null;
    targetUserName: string | null;
    message: string | null;
    details: Record<string, unknown> | null;
    createdAt: Date;
}

export interface BotQueueItemDto {
    id: string;
    botId: string | null;
    botName: string;
    type: "notification" | "message";
    status: "pending" | "processing" | "done" | "failed";
    retries: number;
    createdAt: Date;
}

export interface BotStats {
    total: number;
    enabled: number;
    pendingQueue: number;
    logsToday: number;
}
