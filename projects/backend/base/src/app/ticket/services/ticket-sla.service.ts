import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateSlaConfigDto } from "../dto/create-sla-config.dto";
import { TicketSlaConfigEntity } from "../entities/ticket-sla-config.entity";
import { TicketEntity } from "../entities/ticket.entity";
import type { SlaConfigDto, SlaStatusDto } from "../models/ticket.model";

@Injectable()
export class TicketSlaService {
    constructor(
        @InjectRepository(TicketSlaConfigEntity) private readonly slaRepo: Repository<TicketSlaConfigEntity>,
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>
    ) {}

    // ── Config CRUD ──────────────────────────────────────────────────────────

    async getConfigs(projectId: string): Promise<SlaConfigDto[]> {
        const configs = await this.slaRepo.find({ where: { projectId }, order: { priority: "ASC" } });
        return configs.map((c) => this.toConfigDto(c));
    }

    async createConfig(dto: CreateSlaConfigDto): Promise<SlaConfigDto> {
        const config = this.slaRepo.create({
            projectId: dto.projectId,
            priority: dto.priority,
            firstResponseHours: dto.firstResponseHours,
            resolutionHours: dto.resolutionHours
        });
        const saved = await this.slaRepo.save(config);
        return this.toConfigDto(saved);
    }

    async updateConfig(id: string, dto: Partial<CreateSlaConfigDto>): Promise<SlaConfigDto> {
        const config = await this.slaRepo.findOne({ where: { id } });
        if (!config) throw new NotFoundException(`SLA config "${id}" not found`);

        if (dto.firstResponseHours !== undefined) config.firstResponseHours = dto.firstResponseHours;
        if (dto.resolutionHours !== undefined) config.resolutionHours = dto.resolutionHours;

        const saved = await this.slaRepo.save(config);
        return this.toConfigDto(saved);
    }

    async deleteConfig(id: string): Promise<void> {
        const config = await this.slaRepo.findOne({ where: { id } });
        if (!config) throw new NotFoundException(`SLA config "${id}" not found`);
        await this.slaRepo.remove(config);
    }

    // ── SLA Status Check ─────────────────────────────────────────────────────

    async getBreaches(projectId: string): Promise<SlaStatusDto[]> {
        const configs = await this.slaRepo.find({ where: { projectId } });
        if (!configs.length) return [];

        const configMap = new Map(configs.map((c) => [c.priority, c]));

        // Get open tickets for this project
        const tickets = await this.ticketRepo.find({
            where: { projectId },
            select: ["id", "ticketNumber", "title", "priority", "status", "createdAt", "firstResponseAt", "resolvedAt"]
        });

        const openStatuses = new Set(["open", "in_progress", "waiting", "follow_up"]);
        const results: SlaStatusDto[] = [];

        for (const ticket of tickets) {
            if (!openStatuses.has(ticket.status)) continue;

            const sla = configMap.get(ticket.priority);
            if (!sla) continue;

            const now = new Date();
            const created = new Date(ticket.createdAt);

            // First response SLA
            const frDeadline = new Date(created.getTime() + sla.firstResponseHours * 3600000);
            let frStatus: "ok" | "at_risk" | "breached" = "ok";
            if (ticket.firstResponseAt) {
                frStatus = new Date(ticket.firstResponseAt) > frDeadline ? "breached" : "ok";
            } else if (now > frDeadline) {
                frStatus = "breached";
            } else if (now > new Date(frDeadline.getTime() - 3600000)) {
                frStatus = "at_risk";
            }

            // Resolution SLA
            const resDeadline = new Date(created.getTime() + sla.resolutionHours * 3600000);
            let resStatus: "ok" | "at_risk" | "breached" = "ok";
            if (ticket.resolvedAt) {
                resStatus = new Date(ticket.resolvedAt) > resDeadline ? "breached" : "ok";
            } else if (now > resDeadline) {
                resStatus = "breached";
            } else if (now > new Date(resDeadline.getTime() - 7200000)) {
                resStatus = "at_risk";
            }

            if (frStatus !== "ok" || resStatus !== "ok") {
                results.push({
                    ticketId: ticket.id,
                    ticketNumber: ticket.ticketNumber,
                    title: ticket.title,
                    priority: ticket.priority,
                    firstResponse: frStatus,
                    resolution: resStatus,
                    firstResponseDeadline: frDeadline.toISOString(),
                    resolutionDeadline: resDeadline.toISOString()
                });
            }
        }

        return results;
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private toConfigDto(c: TicketSlaConfigEntity): SlaConfigDto {
        return {
            id: c.id,
            projectId: c.projectId,
            priority: c.priority,
            firstResponseHours: c.firstResponseHours,
            resolutionHours: c.resolutionHours
        };
    }
}
