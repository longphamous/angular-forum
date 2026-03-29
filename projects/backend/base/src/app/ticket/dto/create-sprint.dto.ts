import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateSprintDto {
    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name!: string;

    @IsString()
    @IsOptional()
    goal?: string;

    @IsString()
    @IsOptional()
    startDate?: string;

    @IsString()
    @IsOptional()
    endDate?: string;
}
