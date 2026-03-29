import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

import type { ClanJoinType, ClanStatus } from "../entities/clan.entity";

export class ClanQueryDto {
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

    @IsString()
    @IsOptional()
    search?: string;

    @IsEnum(["open", "invite", "application", "moderated"])
    @IsOptional()
    joinType?: ClanJoinType;

    @IsEnum(["active", "inactive", "disbanded"])
    @IsOptional()
    status?: ClanStatus;
}
