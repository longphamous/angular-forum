import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min
} from "class-validator";

import type { TicketPriority, TicketType } from "../entities/ticket.entity";

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    title!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsEnum(["low", "normal", "high", "critical"])
    @IsOptional()
    priority?: TicketPriority;

    @IsEnum(["epic", "story", "bug", "task", "sub_task", "support", "feature"])
    @IsOptional()
    type?: TicketType;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    projectId?: string;

    @IsUUID()
    @IsOptional()
    assigneeId?: string;

    @IsUUID()
    @IsOptional()
    parentId?: string;

    @IsArray()
    @IsUUID("4", { each: true })
    @IsOptional()
    labelIds?: string[];

    @IsString()
    @IsOptional()
    dueDate?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    storyPoints?: number;

    @IsObject()
    @IsOptional()
    customFields?: Record<string, unknown>;
}
