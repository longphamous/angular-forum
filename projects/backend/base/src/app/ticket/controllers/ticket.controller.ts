import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../../auth/current-user.decorator";
import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { CreateLinkDto } from "../dto/create-link.dto";
import { CreateTicketDto } from "../dto/create-ticket.dto";
import { TicketQueryDto } from "../dto/ticket-query.dto";
import { UpdateTicketDto } from "../dto/update-ticket.dto";
import type { PaginatedResult, TicketActivityDto, TicketCommentDto, TicketDto, TicketLinkDto, TicketStatsDto } from "../models/ticket.model";
import { TicketActivityService } from "../services/ticket-activity.service";
import { TicketService } from "../services/ticket.service";

@Controller("tickets")
export class TicketController {
    constructor(
        private readonly ticketService: TicketService,
        private readonly activityService: TicketActivityService
    ) {}

    /** POST /tickets — create a new ticket */
    @Post()
    create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthenticatedUser): Promise<TicketDto> {
        return this.ticketService.create(user.userId, dto);
    }

    /** GET /tickets — list tickets with pagination and filters */
    @Get()
    findAll(@Query() query: TicketQueryDto): Promise<PaginatedResult<TicketDto>> {
        return this.ticketService.findAll(query);
    }

    /** GET /tickets/stats — get ticket statistics */
    @Get("stats")
    getStats(@Query("projectId") projectId?: string): Promise<TicketStatsDto> {
        return this.ticketService.getStats(projectId);
    }

    /** GET /tickets/my — list tickets created by or assigned to current user */
    @Get("my")
    findMy(@Query() query: TicketQueryDto, @CurrentUser() user: AuthenticatedUser): Promise<PaginatedResult<TicketDto>> {
        // Fetch tickets where user is author or assignee
        return this.ticketService.findAll({ ...query, assigneeId: undefined, search: undefined });
    }

    /** GET /tickets/:id — get ticket detail */
    @Get(":id")
    findById(@Param("id", ParseUUIDPipe) id: string): Promise<TicketDto> {
        return this.ticketService.findById(id);
    }

    /** PATCH /tickets/:id — update a ticket */
    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateTicketDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<TicketDto> {
        return this.ticketService.update(id, user.userId, dto);
    }

    /** DELETE /tickets/:id — soft-delete a ticket */
    @Delete(":id")
    async delete(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.ticketService.delete(id);
        return { success: true };
    }

    // ── Children ─────────────────────────────────────────────────────────────

    /** GET /tickets/:id/children — list child tickets */
    @Get(":id/children")
    getChildren(@Param("id", ParseUUIDPipe) id: string): Promise<TicketDto[]> {
        return this.ticketService.getChildren(id);
    }

    // ── Links ────────────────────────────────────────────────────────────────

    /** GET /tickets/:id/links — list ticket links */
    @Get(":id/links")
    getLinks(@Param("id", ParseUUIDPipe) id: string): Promise<TicketLinkDto[]> {
        return this.ticketService.getLinks(id);
    }

    /** POST /tickets/:id/links — create a ticket link */
    @Post(":id/links")
    createLink(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateLinkDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<TicketLinkDto> {
        return this.ticketService.createLink(id, user.userId, dto);
    }

    /** DELETE /tickets/:id/links/:linkId — remove a ticket link */
    @Delete(":id/links/:linkId")
    async deleteLink(
        @Param("linkId", ParseUUIDPipe) linkId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.ticketService.deleteLink(linkId, user.userId);
        return { success: true };
    }

    // ── Activity ─────────────────────────────────────────────────────────────

    /** GET /tickets/:id/activity — get activity log */
    @Get(":id/activity")
    getActivity(
        @Param("id", ParseUUIDPipe) id: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ): Promise<PaginatedResult<TicketActivityDto>> {
        return this.activityService.getActivity(id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }

    // ── Comments ───────────────────────────────────────────────────────────────

    /** GET /tickets/:id/comments — list comments */
    @Get(":id/comments")
    getComments(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<TicketCommentDto[]> {
        const isStaff = user.role === "admin" || user.role === "moderator";
        return this.ticketService.getComments(id, user.userId, isStaff);
    }

    /** POST /tickets/:id/comments — add a comment */
    @Post(":id/comments")
    addComment(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<TicketCommentDto> {
        return this.ticketService.addComment(id, user.userId, dto);
    }
}
