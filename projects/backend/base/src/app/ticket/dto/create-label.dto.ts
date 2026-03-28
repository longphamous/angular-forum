import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateLabelDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    color!: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;
}
