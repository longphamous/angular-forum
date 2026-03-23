import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { Public } from "../../auth/auth.decorators";
import { CurrentUser } from "../../auth/current-user.decorator";
import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { CreatePostDto } from "../dto/create-post.dto";
import { ForumQueryDto } from "../dto/forum-query.dto";
import { ReactPostDto } from "../dto/react-post.dto";
import { UpdatePostDto } from "../dto/update-post.dto";
import { PaginatedResult, PostDto, ReactionDto } from "../models/forum.model";
import { PostService } from "../services/post.service";

@Controller("forum")
export class PostController {
    constructor(private readonly postService: PostService) {}

    /**
     * GET /forum/threads/:threadId/posts
     * Lists posts in a thread (paginated, chronological order).
     */
    @Public()
    @Get("threads/:threadId/posts")
    findByThread(
        @Param("threadId", ParseUUIDPipe) threadId: string,
        @Query() query: ForumQueryDto
    ): Promise<PaginatedResult<PostDto>> {
        return this.postService.findByThread(threadId, query);
    }

    /**
     * GET /forum/posts/:id
     * Returns a single post.
     */
    @Public()
    @Get("posts/:id")
    findById(@Param("id", ParseUUIDPipe) id: string): Promise<PostDto> {
        return this.postService.findById(id);
    }

    /**
     * POST /forum/threads/:threadId/posts
     * Creates a reply in a thread. Requires authentication.
     */
    @Post("threads/:threadId/posts")
    create(
        @Param("threadId", ParseUUIDPipe) threadId: string,
        @Body() dto: CreatePostDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<PostDto> {
        return this.postService.create(threadId, user.userId, dto);
    }

    /**
     * PATCH /forum/posts/:id
     * Updates a post's content. Author, moderators, and admins may edit.
     */
    @Patch("posts/:id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdatePostDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<PostDto> {
        return this.postService.update(id, dto, user.userId, user.role);
    }

    /**
     * DELETE /forum/posts/:id
     * Soft-deletes a post. Author, moderators, and admins may delete.
     */
    @Delete("posts/:id")
    async remove(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.postService.remove(id, user.userId, user.role);
        return { success: true };
    }

    /**
     * GET /forum/threads/:threadId/my-reactions
     * Returns postIds in this thread that the current user has reacted to.
     */
    @Get("threads/:threadId/my-reactions")
    getMyReactions(
        @Param("threadId", ParseUUIDPipe) threadId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<string[]> {
        return this.postService.getMyReactions(threadId, user.userId);
    }

    /**
     * PATCH /forum/threads/:threadId/best-answer/:postId
     * Marks (or toggles off) a post as the best answer for a thread.
     * Only the thread author may call this endpoint.
     */
    @Patch("threads/:threadId/best-answer/:postId")
    markBestAnswer(
        @Param("threadId", ParseUUIDPipe) threadId: string,
        @Param("postId", ParseUUIDPipe) postId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<PostDto> {
        return this.postService.markBestAnswer(threadId, postId, user.userId);
    }

    /**
     * PATCH /forum/posts/:id/highlight
     * Toggles the highlight flag on a post. Only admins/moderators may call this.
     */
    @Patch("posts/:id/highlight")
    toggleHighlight(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<PostDto> {
        return this.postService.toggleHighlight(id, user.userId, user.role);
    }

    /**
     * POST /forum/posts/:id/react
     * Adds or updates a reaction on a post. Requires authentication.
     */
    @Post("posts/:id/react")
    react(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: ReactPostDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<ReactionDto> {
        return this.postService.react(id, user.userId, dto);
    }

    /**
     * DELETE /forum/posts/:id/react
     * Removes the current user's reaction from a post.
     */
    @Delete("posts/:id/react")
    async unreact(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.postService.unreact(id, user.userId);
        return { success: true };
    }
}
