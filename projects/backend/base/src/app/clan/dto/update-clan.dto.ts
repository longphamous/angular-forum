import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import type { ClanJoinType, ClanStatus } from "../entities/clan.entity";

export class UpdateClanDto {
    @IsString()
    @MaxLength(200)
    @IsOptional()
    name?: string;

    @IsString()
    @MaxLength(20)
    @IsOptional()
    tag?: string;

    @IsString()
    @IsOptional()
    tagColor?: string;

    @IsString()
    @IsOptional()
    tagBrackets?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string | null;

    @IsEnum(["open", "invite", "application", "moderated"])
    @IsOptional()
    joinType?: ClanJoinType;

    @IsEnum(["active", "inactive", "disbanded"])
    @IsOptional()
    status?: ClanStatus;

    @IsBoolean()
    @IsOptional()
    showActivity?: boolean;

    @IsBoolean()
    @IsOptional()
    showMembers?: boolean;

    @IsBoolean()
    @IsOptional()
    showComments?: boolean;

    @IsString()
    @IsOptional()
    avatarUrl?: string | null;

    @IsString()
    @IsOptional()
    bannerUrl?: string | null;

    @IsString()
    @IsOptional()
    applicationTemplate?: string;

    @IsObject()
    @IsOptional()
    customFields?: Record<string, unknown>;
}
