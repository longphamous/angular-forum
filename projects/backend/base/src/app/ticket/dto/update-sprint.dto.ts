import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSprintDto {
    @IsString()
    @MaxLength(200)
    @IsOptional()
    name?: string;

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
