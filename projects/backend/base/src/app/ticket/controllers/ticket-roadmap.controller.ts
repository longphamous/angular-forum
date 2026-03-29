import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";

import type { RoadmapEpicDto } from "../models/ticket.model";
import { TicketRoadmapService } from "../services/ticket-roadmap.service";

@Controller("tickets/roadmap")
export class TicketRoadmapController {
    constructor(private readonly roadmapService: TicketRoadmapService) {}

    /** GET /tickets/roadmap/:projectId — get roadmap (epics with progress) */
    @Get(":projectId")
    getRoadmap(@Param("projectId", ParseUUIDPipe) projectId: string): Promise<RoadmapEpicDto[]> {
        return this.roadmapService.getRoadmap(projectId);
    }
}
