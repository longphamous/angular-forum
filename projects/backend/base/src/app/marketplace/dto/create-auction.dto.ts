import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreateAuctionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsUUID()
    categoryId!: string;

    @IsNumber()
    @Min(0.01)
    startPrice!: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    buyNowPrice?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    bidIncrement?: number;

    @IsNumber()
    @IsIn([24, 72, 120, 168, 240])
    durationHours!: number;

    @IsOptional()
    @IsArray()
    images?: string[];

    @IsOptional()
    @IsArray()
    tags?: string[];
}
