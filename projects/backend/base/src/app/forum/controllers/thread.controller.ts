import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { Public } from "../../auth/auth.decorators";
import { CurrentUser } from "../../auth/current-user.decorator";
import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { CreateThreadDto } from "../dto/create-thread.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { UpdateThreadDto } from "../dto/update-thread.dto";
import { PaginatedResult, ThreadDetailDto, ThreadDto } from "../models/forum.model";
import { ThreadService } from "../services/thread.service";

@Controller("forum")
export class ThreadController {
    constructor(private readonly threadService: ThreadService) {}

    /**
     * GET /forum/forums/:forumId/threads
     * Lists threads in a forum – pinned first, then by lastPostAt DESC.
     */
    @Public()
    @Get("forums/:forumId/threads")
    findByForum(
        @Param("forumId", ParseUUIDPipe) forumId: string,
        @Query() query: ForumQueryDto
    ): Promise<PaginatedResult<ThreadDto>> {
        return this.threadService.findByForum(forumId, query);
    }

    /**
     * GET /forum/threads/:id
     * Returns a single thread (increments view count).
     */
    @Public()
    @Get("threads/:id")
    findById(@Param("id", ParseUUIDPipe) id: string): Promise<ThreadDetailDto> {
        return this.threadService.findById(id);
    }

    /**
     * POST /forum/forums/:forumId/threads
     * Creates a thread and its first post. Requires authentication.
     */
    @Post("forums/:forumId/threads")
    create(
        @Param("forumId", ParseUUIDPipe) forumId: string,
        @Body() dto: CreateThreadDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<ThreadDto> {
        return this.threadService.create(forumId, user.userId, dto);
    }

    /**
     * PATCH /forum/threads/:id
     * Updates a thread. Author, moderators, and admins may update.
     */
    @Patch("threads/:id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateThreadDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<ThreadDto> {
        return this.threadService.update(id, dto, user.userId, user.role);
    }

    /**
     * DELETE /forum/threads/:id
     * Soft-deletes a thread. Author, moderators, and admins may delete.
     */
    @Delete("threads/:id")
    async remove(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.threadService.remove(id, user.userId, user.role);
        return { success: true };
    }
}
