import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from "class-validator";

import type { WorkflowStatusCategory } from "../entities/ticket-workflow-status.entity";

export class WorkflowStatusInput {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    slug!: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    color?: string;

    @IsEnum(["todo", "in_progress", "done"])
    category!: WorkflowStatusCategory;

    @IsInt()
    @Min(0)
    position!: number;
}

export class WorkflowTransitionInput {
    @IsString()
    @IsNotEmpty()
    fromSlug!: string;

    @IsString()
    @IsNotEmpty()
    toSlug!: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class CreateWorkflowDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name!: string;

    @IsUUID()
    @IsOptional()
    projectId?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkflowStatusInput)
    statuses!: WorkflowStatusInput[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkflowTransitionInput)
    @IsOptional()
    transitions?: WorkflowTransitionInput[];
}
