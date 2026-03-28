import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    startDate?: string;

    @IsString()
    @IsOptional()
    endDate?: string;
}
