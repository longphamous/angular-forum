export type LogLevel = "info" | "warn" | "error";

export type LogCategory =
    | "auth"
    | "user"
    | "forum"
    | "credit"
    | "shop"
    | "marketplace"
    | "gamification"
    | "tcg"
    | "lotto"
    | "gallery"
    | "blog"
    | "admin"
    | "system";

export interface AdminLog {
    id: string;
    level: LogLevel;
    category: LogCategory;
    action: string;
    message: string;
    userId: string | null;
    username: string | null;
    targetId: string | null;
    ipAddress: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export interface PaginatedLogs {
    items: AdminLog[];
    total: number;
    page: number;
    limit: number;
}

export interface LogStats {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
}

export interface LogFilter {
    level?: LogLevel;
    category?: LogCategory;
    from?: string;
    to?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
