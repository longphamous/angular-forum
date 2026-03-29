import { IsEnum, IsInt, IsNotEmpty, IsUUID, Min } from "class-validator";

export class CreateSlaConfigDto {
    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsEnum(["low", "normal", "high", "critical"])
    @IsNotEmpty()
    priority!: string;

    @IsInt()
    @Min(1)
    firstResponseHours!: number;

    @IsInt()
    @Min(1)
    resolutionHours!: number;
}
