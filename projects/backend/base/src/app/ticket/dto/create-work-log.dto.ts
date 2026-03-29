import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateWorkLogDto {
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    timeSpentMinutes!: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    logDate?: string;
}
