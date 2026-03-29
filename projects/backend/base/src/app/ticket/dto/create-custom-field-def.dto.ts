import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min
} from "class-validator";

import type { CustomFieldType } from "../entities/ticket-custom-field-def.entity";

export class CreateCustomFieldDefDto {
    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    fieldKey!: string;

    @IsEnum(["text", "number", "date", "select", "boolean", "user", "url"])
    @IsNotEmpty()
    fieldType!: CustomFieldType;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    options?: string[];

    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    applicableTypes?: string[];

    @IsInt()
    @Min(0)
    @IsOptional()
    position?: number;
}
