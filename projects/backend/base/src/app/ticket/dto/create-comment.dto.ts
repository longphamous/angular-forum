import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

import type { TicketStatus } from "../entities/ticket.entity";

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsBoolean()
    @IsOptional()
    isInternal?: boolean;

    @IsEnum(["open", "in_progress", "waiting", "follow_up", "resolved", "closed"])
    @IsOptional()
    statusChange?: TicketStatus;
}
