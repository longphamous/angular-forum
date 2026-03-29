import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateAutomationRuleDto } from "../dto/create-automation-rule.dto";
import { TicketAutomationRuleEntity } from "../entities/ticket-automation-rule.entity";
import type { AutomationRuleDto } from "../models/ticket.model";

@Injectable()
export class TicketAutomationService {
    constructor(
        @InjectRepository(TicketAutomationRuleEntity) private readonly ruleRepo: Repository<TicketAutomationRuleEntity>
    ) {}

    async getRules(projectId: string): Promise<AutomationRuleDto[]> {
        const rules = await this.ruleRepo.find({ where: { projectId }, order: { createdAt: "DESC" } });
        return rules.map((r) => this.toDto(r));
    }

    async createRule(dto: CreateAutomationRuleDto): Promise<AutomationRuleDto> {
        const rule = this.ruleRepo.create({
            projectId: dto.projectId,
            name: dto.name,
            isActive: dto.isActive ?? true,
            triggerType: dto.triggerType,
            triggerConfig: dto.triggerConfig,
            actionType: dto.actionType,
            actionConfig: dto.actionConfig
        });
        const saved = await this.ruleRepo.save(rule);
        return this.toDto(saved);
    }

    async updateRule(id: string, dto: Partial<CreateAutomationRuleDto>): Promise<AutomationRuleDto> {
        const rule = await this.ruleRepo.findOne({ where: { id } });
        if (!rule) throw new NotFoundException(`Rule "${id}" not found`);

        if (dto.name !== undefined) rule.name = dto.name;
        if (dto.isActive !== undefined) rule.isActive = dto.isActive;
        if (dto.triggerType !== undefined) rule.triggerType = dto.triggerType;
        if (dto.triggerConfig !== undefined) rule.triggerConfig = dto.triggerConfig;
        if (dto.actionType !== undefined) rule.actionType = dto.actionType;
        if (dto.actionConfig !== undefined) rule.actionConfig = dto.actionConfig;

        const saved = await this.ruleRepo.save(rule);
        return this.toDto(saved);
    }

    async deleteRule(id: string): Promise<void> {
        const rule = await this.ruleRepo.findOne({ where: { id } });
        if (!rule) throw new NotFoundException(`Rule "${id}" not found`);
        await this.ruleRepo.remove(rule);
    }

    async toggleRule(id: string): Promise<AutomationRuleDto> {
        const rule = await this.ruleRepo.findOne({ where: { id } });
        if (!rule) throw new NotFoundException(`Rule "${id}" not found`);
        rule.isActive = !rule.isActive;
        const saved = await this.ruleRepo.save(rule);
        return this.toDto(saved);
    }

    private toDto(r: TicketAutomationRuleEntity): AutomationRuleDto {
        return {
            id: r.id,
            projectId: r.projectId,
            name: r.name,
            isActive: r.isActive,
            triggerType: r.triggerType,
            triggerConfig: r.triggerConfig,
            actionType: r.actionType,
            actionConfig: r.actionConfig,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
        };
    }
}
