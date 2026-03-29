import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import type { ClanJoinType } from "../entities/clan.entity";

export class CreateClanDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name!: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    tag?: string;

    @IsString()
    @IsOptional()
    tagColor?: string;

    @IsString()
    @IsOptional()
    tagBrackets?: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsEnum(["open", "invite", "application", "moderated"])
    @IsOptional()
    joinType?: ClanJoinType;

    @IsString()
    @IsOptional()
    applicationTemplate?: string;

    @IsObject()
    @IsOptional()
    customFields?: Record<string, unknown>;
}
