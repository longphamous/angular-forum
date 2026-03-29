import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from "@nestjs/common";

import { CurrentUser } from "../../auth/current-user.decorator";
import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { BoardMoveDto } from "../dto/board-move.dto";
import { BoardQueryDto } from "../dto/board-query.dto";
import type { BoardDataDto } from "../models/ticket.model";
import { TicketWorkflowService } from "../services/ticket-workflow.service";

@Controller("tickets/board")
export class TicketBoardController {
    constructor(private readonly workflowService: TicketWorkflowService) {}

    /** GET /tickets/board/:projectId — get board data with columns and tickets */
    @Get(":projectId")
    getBoardData(
        @Param("projectId", ParseUUIDPipe) projectId: string,
        @Query() query: BoardQueryDto
    ): Promise<BoardDataDto> {
        return this.workflowService.getBoardData(projectId, query);
    }

    /** PATCH /tickets/board/move — move a ticket to a different status column */
    @Patch("move")
    async moveCard(@Body() dto: BoardMoveDto, @CurrentUser() user: AuthenticatedUser): Promise<{ success: boolean }> {
        await this.workflowService.moveCard(dto.ticketId, dto.toStatusId, user.userId);
        return { success: true };
    }
}
