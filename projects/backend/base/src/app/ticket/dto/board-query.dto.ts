import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import type { TicketType } from "../entities/ticket.entity";

export class BoardQueryDto {
    @IsUUID()
    @IsOptional()
    assigneeId?: string;

    @IsEnum(["epic", "story", "bug", "task", "sub_task", "support", "feature"])
    @IsOptional()
    type?: TicketType;

    @IsString()
    @IsOptional()
    search?: string;
}
