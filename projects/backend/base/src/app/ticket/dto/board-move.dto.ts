import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from "class-validator";

export class BoardMoveDto {
    @IsUUID()
    @IsNotEmpty()
    ticketId!: string;

    @IsUUID()
    @IsNotEmpty()
    toStatusId!: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    position?: number;
}
