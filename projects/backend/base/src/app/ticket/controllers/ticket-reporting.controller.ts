import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { Roles } from "../../auth/auth.decorators";
import { CreateSlaConfigDto } from "../dto/create-sla-config.dto";
import type { BurndownPointDto, SlaConfigDto, SlaStatusDto, SprintReportDto, VelocityEntryDto } from "../models/ticket.model";
import { TicketReportingService } from "../services/ticket-reporting.service";
import { TicketSlaService } from "../services/ticket-sla.service";

@Controller("tickets/reports")
export class TicketReportingController {
    constructor(
        private readonly reportingService: TicketReportingService,
        private readonly slaService: TicketSlaService
    ) {}

    /** GET /tickets/reports/burndown/:sprintId */
    @Get("burndown/:sprintId")
    getBurndown(@Param("sprintId", ParseUUIDPipe) sprintId: string): Promise<BurndownPointDto[]> {
        return this.reportingService.getBurndown(sprintId);
    }

    /** GET /tickets/reports/velocity/:projectId */
    @Get("velocity/:projectId")
    getVelocity(@Param("projectId", ParseUUIDPipe) projectId: string): Promise<VelocityEntryDto[]> {
        return this.reportingService.getVelocity(projectId);
    }

    /** GET /tickets/reports/sprint/:sprintId */
    @Get("sprint/:sprintId")
    getSprintReport(@Param("sprintId", ParseUUIDPipe) sprintId: string): Promise<SprintReportDto> {
        return this.reportingService.getSprintReport(sprintId);
    }

    /** GET /tickets/reports/sla-breaches/:projectId */
    @Get("sla-breaches/:projectId")
    getSlaBreaches(@Param("projectId", ParseUUIDPipe) projectId: string): Promise<SlaStatusDto[]> {
        return this.slaService.getBreaches(projectId);
    }

    // ── SLA Config (admin only) ──────────────────────────────────────────────

    /** GET /tickets/reports/sla?projectId=xxx */
    @Roles("admin")
    @Get("sla")
    getSlaConfigs(@Query("projectId") projectId: string): Promise<SlaConfigDto[]> {
        return this.slaService.getConfigs(projectId);
    }

    /** POST /tickets/reports/sla */
    @Roles("admin")
    @Post("sla")
    createSlaConfig(@Body() dto: CreateSlaConfigDto): Promise<SlaConfigDto> {
        return this.slaService.createConfig(dto);
    }

    /** PATCH /tickets/reports/sla/:id */
    @Roles("admin")
    @Patch("sla/:id")
    updateSlaConfig(@Param("id", ParseUUIDPipe) id: string, @Body() dto: Partial<CreateSlaConfigDto>): Promise<SlaConfigDto> {
        return this.slaService.updateConfig(id, dto);
    }

    /** DELETE /tickets/reports/sla/:id */
    @Roles("admin")
    @Delete("sla/:id")
    async deleteSlaConfig(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.slaService.deleteConfig(id);
        return { success: true };
    }
}
