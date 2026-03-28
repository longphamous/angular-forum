import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import type { ProjectStatus } from "../entities/ticket-project.entity";

export class UpdateProjectDto {
    @IsString()
    @MaxLength(200)
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(["active", "archived", "completed"])
    @IsOptional()
    status?: ProjectStatus;

    @IsString()
    @IsOptional()
    startDate?: string | null;

    @IsString()
    @IsOptional()
    endDate?: string | null;
}
