import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import {
    ClipsService,
    CreateClipDto,
    CreateCommentDto,
    EnrichedClip,
    EnrichedComment,
    UpdateClipDto
} from "./clips.service";

@ApiTags("Clips")
@ApiBearerAuth("JWT")
@Controller("clips")
export class ClipsController {
    constructor(private readonly clipsService: ClipsService) {}

    @Public()
    @Get("feed")
    getFeed(
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @CurrentUser() user?: AuthenticatedUser
    ): Promise<{ data: EnrichedClip[]; total: number }> {
        return this.clipsService.getFeed(user?.userId, Number(page) || 1, Number(limit) || 10);
    }

    @Public()
    @Get("user/:userId")
    getClipsByUser(
        @Param("userId") userId: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @CurrentUser() user?: AuthenticatedUser
    ): Promise<{ data: EnrichedClip[]; total: number }> {
        return this.clipsService.getClipsByUser(userId, user?.userId, Number(page) || 1, Number(limit) || 10);
    }

    @Public()
    @Get(":id")
    getClipById(@Param("id") id: string, @CurrentUser() user?: AuthenticatedUser): Promise<EnrichedClip> {
        return this.clipsService.getClipById(id, user?.userId);
    }

    @Post()
    createClip(@Body() dto: CreateClipDto, @CurrentUser() user: AuthenticatedUser): Promise<EnrichedClip> {
        return this.clipsService.createClip(user.userId, dto);
    }

    @Patch(":id")
    updateClip(
        @Param("id") id: string,
        @Body() dto: UpdateClipDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<EnrichedClip> {
        return this.clipsService.updateClip(id, user.userId, user.role === "admin", dto);
    }

    @Delete(":id")
    deleteClip(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ deleted: boolean }> {
        return this.clipsService.deleteClip(id, user.userId, user.role === "admin");
    }

    @Post(":id/like")
    toggleLike(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ liked: boolean }> {
        return this.clipsService.toggleLike(id, user.userId);
    }

    @Post(":id/view")
    incrementView(@Param("id") id: string): Promise<{ viewCount: number }> {
        return this.clipsService.incrementView(id);
    }

    @Post(":id/share")
    incrementShare(@Param("id") id: string): Promise<{ shareCount: number }> {
        return this.clipsService.incrementShare(id);
    }

    @Public()
    @Get(":id/comments")
    getComments(@Param("id") id: string): Promise<EnrichedComment[]> {
        return this.clipsService.getComments(id);
    }

    @Post(":id/comments")
    addComment(
        @Param("id") id: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<EnrichedComment> {
        return this.clipsService.addComment(id, user.userId, dto);
    }

    @Delete("comments/:commentId")
    deleteComment(
        @Param("commentId") commentId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ deleted: boolean }> {
        return this.clipsService.deleteComment(commentId, user.userId, user.role === "admin");
    }

    @Post(":id/follow")
    toggleFollow(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<{ following: boolean }> {
        return this.clipsService.toggleFollow(user.userId, id);
    }
}
