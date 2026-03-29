import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { BacklogReorderDto } from "../dto/backlog-reorder.dto";
import { CreateSprintDto } from "../dto/create-sprint.dto";
import { UpdateSprintDto } from "../dto/update-sprint.dto";
import type { PaginatedResult, SprintDto, TicketDto } from "../models/ticket.model";
import { TicketSprintService } from "../services/ticket-sprint.service";

@Controller("tickets/sprints")
export class TicketSprintController {
    constructor(private readonly sprintService: TicketSprintService) {}

    /** GET /tickets/sprints?projectId=xxx — list sprints for a project */
    @Get()
    getSprints(@Query("projectId") projectId: string): Promise<SprintDto[]> {
        return this.sprintService.getSprints(projectId);
    }

    /** GET /tickets/sprints/:id — get sprint detail */
    @Get(":id")
    getSprint(@Param("id", ParseUUIDPipe) id: string): Promise<SprintDto> {
        return this.sprintService.getSprint(id);
    }

    /** POST /tickets/sprints — create a sprint */
    @Post()
    createSprint(@Body() dto: CreateSprintDto): Promise<SprintDto> {
        return this.sprintService.createSprint(dto);
    }

    /** PATCH /tickets/sprints/:id — update a sprint */
    @Patch(":id")
    updateSprint(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSprintDto): Promise<SprintDto> {
        return this.sprintService.updateSprint(id, dto);
    }

    /** DELETE /tickets/sprints/:id — delete a sprint */
    @Delete(":id")
    async deleteSprint(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.sprintService.deleteSprint(id);
        return { success: true };
    }

    /** POST /tickets/sprints/:id/start — start a sprint */
    @Post(":id/start")
    startSprint(@Param("id", ParseUUIDPipe) id: string): Promise<SprintDto> {
        return this.sprintService.startSprint(id);
    }

    /** POST /tickets/sprints/:id/complete — complete a sprint */
    @Post(":id/complete")
    completeSprint(@Param("id", ParseUUIDPipe) id: string): Promise<SprintDto> {
        return this.sprintService.completeSprint(id);
    }

    /** GET /tickets/sprints/backlog/:projectId — get backlog */
    @Get("backlog/:projectId")
    getBacklog(
        @Param("projectId", ParseUUIDPipe) projectId: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ): Promise<PaginatedResult<TicketDto>> {
        return this.sprintService.getBacklog(projectId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }

    /** PATCH /tickets/sprints/backlog/:projectId/reorder — reorder backlog */
    @Patch("backlog/:projectId/reorder")
    async reorderBacklog(
        @Param("projectId", ParseUUIDPipe) projectId: string,
        @Body() dto: BacklogReorderDto
    ): Promise<{ success: boolean }> {
        await this.sprintService.reorderBacklog(projectId, dto);
        return { success: true };
    }

    /** POST /tickets/sprints/move-to-sprint — move ticket to sprint */
    @Post("move-to-sprint")
    async moveToSprint(@Body() body: { ticketId: string; sprintId: string }): Promise<{ success: boolean }> {
        await this.sprintService.moveToSprint(body.ticketId, body.sprintId);
        return { success: true };
    }

    /** POST /tickets/sprints/move-to-backlog — move ticket back to backlog */
    @Post("move-to-backlog")
    async moveToBacklog(@Body() body: { ticketId: string }): Promise<{ success: boolean }> {
        await this.sprintService.moveToBacklog(body.ticketId);
        return { success: true };
    }
}
