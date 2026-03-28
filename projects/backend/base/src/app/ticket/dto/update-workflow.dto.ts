import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

import { WorkflowStatusInput, WorkflowTransitionInput } from "./create-workflow.dto";

export class UpdateWorkflowDto {
    @IsString()
    @MaxLength(200)
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkflowStatusInput)
    @IsOptional()
    statuses?: WorkflowStatusInput[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkflowTransitionInput)
    @IsOptional()
    transitions?: WorkflowTransitionInput[];
}
