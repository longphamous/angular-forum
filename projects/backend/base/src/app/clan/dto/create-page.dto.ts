import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}
