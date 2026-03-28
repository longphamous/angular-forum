import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsInt()
    @IsOptional()
    position?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
