import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

import type { AutomationActionType, AutomationTriggerType } from "../entities/ticket-automation-rule.entity";

export class CreateAutomationRuleDto {
    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name!: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsEnum(["status_changed", "ticket_created", "field_changed", "assigned"])
    @IsNotEmpty()
    triggerType!: AutomationTriggerType;

    @IsObject()
    @IsNotEmpty()
    triggerConfig!: Record<string, unknown>;

    @IsEnum(["set_field", "transition", "assign", "notify", "add_label"])
    @IsNotEmpty()
    actionType!: AutomationActionType;

    @IsObject()
    @IsNotEmpty()
    actionConfig!: Record<string, unknown>;
}
