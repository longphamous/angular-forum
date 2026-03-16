import { ActionConfig, BotAction, BotCondition, BotTrigger, TriggerConfig } from "../models/bot.model";

export class CreateBotDto {
    name!: string;
    description?: string;
    enabled?: boolean;
    testMode?: boolean;
    trigger!: BotTrigger;
    triggerConfig?: TriggerConfig;
    conditions?: BotCondition[];
    action!: BotAction;
    actionConfig?: ActionConfig;
    language?: string;
}

export class UpdateBotDto {
    name?: string;
    description?: string;
    enabled?: boolean;
    testMode?: boolean;
    trigger?: BotTrigger;
    triggerConfig?: TriggerConfig;
    conditions?: BotCondition[];
    action?: BotAction;
    actionConfig?: ActionConfig;
    language?: string;
}
