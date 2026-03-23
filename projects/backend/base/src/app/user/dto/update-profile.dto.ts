import { IsIn, IsObject, IsOptional, IsString, Length, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { FieldVisibility } from "../entities/user.entity";

class ProfileFieldSettingsDto {
    @IsOptional()
    @IsIn(["everyone", "members", "nobody"])
    gender?: FieldVisibility;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(1, 50)
    displayName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    coverUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsString()
    birthday?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    gender?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    location?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    signature?: string;

    @IsOptional()
    @IsObject()
    socialLinks?: Record<string, string>;

    @IsOptional()
    @ValidateNested()
    @Type(() => ProfileFieldSettingsDto)
    profileFieldSettings?: ProfileFieldSettingsDto;
}
