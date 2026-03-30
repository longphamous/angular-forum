import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

import type { AuctionStatus } from "../entities/auction.entity";

export class AuctionQueryDto {
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    limit?: number;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsIn(["scheduled", "active", "ended", "cancelled"])
    @IsOptional()
    status?: AuctionStatus;

    @IsString()
    @IsOptional()
    search?: string;

    @IsIn(["ending-soon", "newly-listed", "price-asc", "price-desc", "most-bids"])
    @IsOptional()
    sort?: string;
}
