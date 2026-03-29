import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../../auth/current-user.decorator";
import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { CreateLinkDto } from "../dto/create-link.dto";
import { CreateTicketDto } from "../dto/create-ticket.dto";
import { CreateWorkLogDto } from "../dto/create-work-log.dto";
import { TicketQueryDto } from "../dto/ticket-query.dto";
import { UpdateTicketDto } from "../dto/update-ticket.dto";
import type { AttachmentDto, PaginatedResult, TicketActivityDto, TicketCommentDto, TicketDto, TicketLinkDto, TicketStatsDto, WatcherDto, WorkLogDto } from "../models/ticket.model";
import { TicketActivityService } from "../services/ticket-activity.service";
import { TicketAttachmentService } from "../services/ticket-attachment.service";
import { TicketWatcherService } from "../services/ticket-watcher.service";
import { TicketWorkLogService } from "../services/ticket-work-log.service";
import { TicketService } from "../services/ticket.service";

@Controller("tickets")
export class TicketController {
    constructor(
        private readonly ticketService: TicketService,
        private readonly activityService: TicketActivityService,
        private readonly watcherService: TicketWatcherService,
        private readonly attachmentService: TicketAttachmentService,
        private readonly workLogService: TicketWorkLogService
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

    // ── Watchers ─────────────────────────────────────────────────────────────

    /** GET /tickets/:id/watchers */
    @Get(":id/watchers")
    getWatchers(@Param("id", ParseUUIDPipe) id: string): Promise<WatcherDto[]> {
        return this.watcherService.getWatchers(id);
    }

    /** POST /tickets/:id/watch */
    @Post(":id/watch")
    async watch(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ success: boolean }> {
        await this.watcherService.watch(id, user.userId);
        return { success: true };
    }

    /** DELETE /tickets/:id/watch */
    @Delete(":id/watch")
    async unwatch(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ success: boolean }> {
        await this.watcherService.unwatch(id, user.userId);
        return { success: true };
    }

    // ── Attachments ──────────────────────────────────────────────────────────

    /** GET /tickets/:id/attachments */
    @Get(":id/attachments")
    getAttachments(@Param("id", ParseUUIDPipe) id: string): Promise<AttachmentDto[]> {
        return this.attachmentService.getAttachments(id);
    }

    /** POST /tickets/:id/attachments — simplified (file info in body, not multipart) */
    @Post(":id/attachments")
    addAttachment(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() body: { fileName: string; filePath: string; fileSize: number; mimeType?: string },
        @CurrentUser() user: AuthenticatedUser
    ): Promise<AttachmentDto> {
        return this.attachmentService.addAttachment(id, user.userId, body);
    }

    /** DELETE /tickets/:id/attachments/:attachId */
    @Delete(":id/attachments/:attachId")
    async deleteAttachment(@Param("attachId", ParseUUIDPipe) attachId: string): Promise<{ success: boolean }> {
        await this.attachmentService.deleteAttachment(attachId);
        return { success: true };
    }

    // ── Work Logs ────────────────────────────────────────────────────────────

    /** GET /tickets/:id/worklogs */
    @Get(":id/worklogs")
    getWorkLogs(@Param("id", ParseUUIDPipe) id: string): Promise<WorkLogDto[]> {
        return this.workLogService.getWorkLogs(id);
    }

    /** POST /tickets/:id/worklogs */
    @Post(":id/worklogs")
    addWorkLog(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateWorkLogDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<WorkLogDto> {
        return this.workLogService.addWorkLog(id, user.userId, dto);
    }

    /** DELETE /tickets/:id/worklogs/:logId */
    @Delete(":id/worklogs/:logId")
    async deleteWorkLog(@Param("logId", ParseUUIDPipe) logId: string): Promise<{ success: boolean }> {
        await this.workLogService.deleteWorkLog(logId);
        return { success: true };
    }
}
