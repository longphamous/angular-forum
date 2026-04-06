import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../../auth/auth.decorators";
import { CreateForumDto } from "../dto/create-forum.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { UpdateForumDto } from "../dto/update-forum.dto";
import { ForumDetailDto, ForumDto, PaginatedResult } from "../models/forum.model";
import { ForumService } from "../services/forum.service";

@ApiTags("Forum")
@ApiBearerAuth("JWT")
@Controller("forum")
export class ForumController {
    constructor(private readonly forumService: ForumService) {}

    /**
     * GET /forum/forums
     * Lists all forums (for moderator move-thread dialog).
     */
    @Public()
    @Get("forums")
    findAll(): Promise<ForumDto[]> {
        return this.forumService.findAll();
    }

    /**
     * GET /forum/categories/:categoryId/forums
     * Lists forums within a category (paginated).
     */
    @Public()
    @Get("categories/:categoryId/forums")
    findByCategory(
        @Param("categoryId", ParseUUIDPipe) categoryId: string,
        @Query() query: ForumQueryDto
    ): Promise<PaginatedResult<ForumDto>> {
        return this.forumService.findByCategory(categoryId, query);
    }

    /**
     * GET /forum/forums/:id
     * Returns a single forum with category info.
     */
    @Public()
    @Get("forums/:id")
    findById(@Param("id", ParseUUIDPipe) id: string): Promise<ForumDetailDto> {
        return this.forumService.findById(id);
    }

    /**
     * POST /forum/categories/:categoryId/forums
     * Creates a forum inside a category. Requires admin role.
     */
    @Roles("admin")
    @Post("categories/:categoryId/forums")
    create(@Param("categoryId", ParseUUIDPipe) categoryId: string, @Body() dto: CreateForumDto): Promise<ForumDto> {
        return this.forumService.create(categoryId, dto);
    }

    /**
     * PATCH /forum/forums/:id
     * Updates a forum. Requires admin or moderator role.
     */
    @Roles("admin", "moderator")
    @Patch("forums/:id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateForumDto): Promise<ForumDto> {
        return this.forumService.update(id, dto);
    }

    /**
     * DELETE /forum/forums/:id
     * Deletes a forum. Requires admin role.
     */
    @Roles("admin")
    @Delete("forums/:id")
    async remove(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.forumService.remove(id);
        return { success: true };
    }
}
