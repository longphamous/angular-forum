import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import { FeaturedSection, FeaturedSourceType } from "../entities/featured-item.entity";

const SECTIONS: FeaturedSection[] = ["featured", "discount", "event"];
const SOURCE_TYPES: FeaturedSourceType[] = ["shop", "booster", "marketplace", "custom"];

export class CreateFeaturedItemDto {
    @IsIn(SECTIONS)
    section!: FeaturedSection;

    @IsIn(SOURCE_TYPES)
    sourceType!: FeaturedSourceType;

    @IsOptional()
    @IsUUID()
    sourceId?: string;

    @IsString()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    linkUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    badgeText?: string;

    @IsOptional()
    @IsString()
    badgeColor?: string;

    @IsOptional()
    @IsInt()
    originalPrice?: number;

    @IsOptional()
    @IsInt()
    discountPrice?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @IsOptional()
    @IsString()
    validFrom?: string;

    @IsOptional()
    @IsString()
    validUntil?: string;
}
