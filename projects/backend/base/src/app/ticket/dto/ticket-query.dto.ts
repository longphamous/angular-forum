import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

import type { TicketPriority, TicketStatus, TicketType } from "../entities/ticket.entity";

export class TicketQueryDto {
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;

    @IsEnum(["open", "in_progress", "waiting", "follow_up", "resolved", "closed"])
    @IsOptional()
    status?: TicketStatus;

    @IsEnum(["low", "normal", "high", "critical"])
    @IsOptional()
    priority?: TicketPriority;

    @IsEnum(["epic", "story", "bug", "task", "sub_task", "support", "feature"])
    @IsOptional()
    type?: TicketType;

    @IsUUID()
    @IsOptional()
    parentId?: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    projectId?: string;

    @IsUUID()
    @IsOptional()
    assigneeId?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    sortBy?: string;

    @IsEnum(["ASC", "DESC"])
    @IsOptional()
    sortOrder?: "ASC" | "DESC";
}
