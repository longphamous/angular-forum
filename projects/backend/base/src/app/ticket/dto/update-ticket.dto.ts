import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

import type { TicketPriority, TicketStatus, TicketType } from "../entities/ticket.entity";

export class UpdateTicketDto {
    @IsString()
    @MaxLength(300)
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

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
    parentId?: string | null;

    @IsInt()
    @Min(0)
    @IsOptional()
    storyPoints?: number | null;

    @IsUUID()
    @IsOptional()
    assigneeId?: string | null;

    @IsUUID()
    @IsOptional()
    categoryId?: string | null;

    @IsUUID()
    @IsOptional()
    projectId?: string | null;

    @IsArray()
    @IsUUID("4", { each: true })
    @IsOptional()
    labelIds?: string[];

    @IsString()
    @IsOptional()
    dueDate?: string | null;

    @IsString()
    @IsOptional()
    followUpDate?: string | null;

    @IsBoolean()
    @IsOptional()
    isPinned?: boolean;

    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @IsString()
    @IsOptional()
    ratingComment?: string;

    @IsObject()
    @IsOptional()
    customFields?: Record<string, unknown>;
}
