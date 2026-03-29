import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { CurrentUser } from "../../auth/current-user.decorator";
import type { AuthenticatedUser } from "../../auth/models/jwt.model";
import { ClanQueryDto } from "../dto/clan-query.dto";
import { CreateClanDto } from "../dto/create-clan.dto";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { CreatePageDto } from "../dto/create-page.dto";
import { UpdateClanDto } from "../dto/update-clan.dto";
import type { ClanCommentDto, ClanDto, ClanListItemDto, ClanPageDto, PaginatedResult } from "../models/clan.model";
import { ClanService } from "../services/clan.service";

@Controller("clans")
export class ClanController {
    constructor(private readonly clanService: ClanService) {}

    /**
     * GET /clans
     * Returns a paginated list of clans, filterable by category, search, joinType, and status.
     */
    @Get()
    findAll(@Query() query: ClanQueryDto): Promise<PaginatedResult<ClanListItemDto>> {
        return this.clanService.findAll(query);
    }

    /**
     * POST /clans
     * Creates a new clan. The authenticated user becomes the owner.
     */
    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClanDto): Promise<ClanDto> {
        return this.clanService.create(user.userId, dto);
    }

    /**
     * GET /clans/my
     * Returns clans where the authenticated user is a member.
     */
    @Get("my")
    getMyClans(@CurrentUser() user: AuthenticatedUser): Promise<ClanListItemDto[]> {
        return this.clanService.getMyClans(user.userId);
    }

    /**
     * GET /clans/:id
     * Returns a single clan by ID.
     */
    @Get(":id")
    findById(@Param("id", ParseUUIDPipe) id: string): Promise<ClanDto> {
        return this.clanService.findById(id);
    }

    /**
     * PATCH /clans/:id
     * Updates a clan. Only the owner or an admin member can update.
     */
    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateClanDto
    ): Promise<ClanDto> {
        return this.clanService.update(id, user.userId, dto);
    }

    /**
     * DELETE /clans/:id
     * Disbands a clan. Only the owner can disband.
     */
    @Delete(":id")
    async delete(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.clanService.delete(id, user.userId);
        return { success: true };
    }

    // ── Pages ────────────────────────────────────────────────────────────────

    /**
     * GET /clans/:id/pages
     * Returns all pages for a clan.
     */
    @Get(":id/pages")
    getPages(@Param("id", ParseUUIDPipe) id: string): Promise<ClanPageDto[]> {
        return this.clanService.getPages(id);
    }

    /**
     * POST /clans/:id/pages
     * Creates a new page for a clan. Requires clan admin permissions.
     */
    @Post(":id/pages")
    createPage(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreatePageDto): Promise<ClanPageDto> {
        return this.clanService.createPage(id, dto);
    }

    /**
     * PATCH /clans/:id/pages/:pageId
     * Updates a clan page.
     */
    @Patch(":id/pages/:pageId")
    updatePage(
        @Param("pageId", ParseUUIDPipe) pageId: string,
        @Body() dto: Partial<CreatePageDto>
    ): Promise<ClanPageDto> {
        return this.clanService.updatePage(pageId, dto);
    }

    /**
     * DELETE /clans/:id/pages/:pageId
     * Deletes a clan page.
     */
    @Delete(":id/pages/:pageId")
    async deletePage(@Param("pageId", ParseUUIDPipe) pageId: string): Promise<{ success: boolean }> {
        await this.clanService.deletePage(pageId);
        return { success: true };
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    /**
     * GET /clans/:id/comments
     * Returns all comments for a clan.
     */
    @Get(":id/comments")
    getComments(@Param("id", ParseUUIDPipe) id: string): Promise<ClanCommentDto[]> {
        return this.clanService.getComments(id);
    }

    /**
     * POST /clans/:id/comments
     * Adds a comment to a clan.
     */
    @Post(":id/comments")
    addComment(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateCommentDto
    ): Promise<ClanCommentDto> {
        return this.clanService.addComment(id, user.userId, dto);
    }
}
