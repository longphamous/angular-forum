import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

import type { TicketLinkType } from "../entities/ticket-link.entity";

export class CreateLinkDto {
    @IsUUID()
    @IsNotEmpty()
    targetTicketId!: string;

    @IsEnum(["blocks", "is_blocked_by", "relates_to", "duplicates"])
    @IsNotEmpty()
    linkType!: TicketLinkType;
}
