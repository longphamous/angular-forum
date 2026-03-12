import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

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
        @Param("threadId") threadId: string,
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
    findById(@Param("id") id: string): Promise<PostDto> {
        return this.postService.findById(id);
    }

    /**
     * POST /forum/threads/:threadId/posts
     * Creates a reply in a thread. Requires authentication.
     */
    @Post("threads/:threadId/posts")
    create(
        @Param("threadId") threadId: string,
        @Body() dto: CreatePostDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<PostDto> {
        return this.postService.create(threadId, user.userId, dto);
    }

    /**
     * PATCH /forum/posts/:id
     * Updates a post's content. Author only.
     */
    @Patch("posts/:id")
    update(
        @Param("id") id: string,
        @Body() dto: UpdatePostDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<PostDto> {
        return this.postService.update(id, dto, user.userId);
    }

    /**
     * DELETE /forum/posts/:id
     * Soft-deletes a post. Author, moderators, and admins may delete.
     */
    @Delete("posts/:id")
    async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ success: boolean }> {
        await this.postService.remove(id, user.userId, user.role);
        return { success: true };
    }

    /**
     * POST /forum/posts/:id/react
     * Adds or updates a reaction on a post. Requires authentication.
     */
    @Post("posts/:id/react")
    react(
        @Param("id") id: string,
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
    async unreact(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ success: boolean }> {
        await this.postService.unreact(id, user.userId);
        return { success: true };
    }
}
