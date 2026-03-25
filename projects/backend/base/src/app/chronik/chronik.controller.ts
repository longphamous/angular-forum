import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from "@nestjs/common";

import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { ChronikService } from "./chronik.service";
import { CreateCommentDto, CreateEntryDto } from "./dto/chronik.dto";
import { ChronikCommentDto, ChronikEntryDto, ChronikProfileStats } from "./models/chronik.model";

@Controller("api/chronik")
@UseGuards(JwtAuthGuard)
export class ChronikController {
    constructor(private readonly chronikService: ChronikService) {}

    @Get()
    async getEntries(
        @CurrentUser() user: AuthenticatedUser,
        @Query("limit") limitStr?: string,
        @Query("offset") offsetStr?: string,
        @Query("userId") userId?: string,
        @Query("feed") feedStr?: string
    ): Promise<{ items: ChronikEntryDto[]; total: number }> {
        const limit = limitStr != null ? parseInt(limitStr, 10) : undefined;
        const offset = offsetStr != null ? parseInt(offsetStr, 10) : undefined;
        const feed = feedStr === "true" || feedStr === "1";

        return this.chronikService.getEntries(user.userId, {
            limit: isNaN(limit as number) ? undefined : limit,
            offset: isNaN(offset as number) ? undefined : offset,
            userId,
            feed: feedStr != null ? feed : undefined
        });
    }

    @Post()
    async createEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEntryDto): Promise<ChronikEntryDto> {
        return this.chronikService.createEntry(user.userId, dto);
    }

    @Patch(":id")
    async updateEntry(
        @CurrentUser() user: AuthenticatedUser,
        @Param("id") id: string,
        @Body() body: { content: string }
    ): Promise<ChronikEntryDto> {
        return this.chronikService.updateEntry(id, user.userId, body.content);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteEntry(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
        return this.chronikService.deleteEntry(user.userId, id);
    }

    @Post(":id/like")
    async toggleLike(
        @CurrentUser() user: AuthenticatedUser,
        @Param("id") id: string
    ): Promise<{ liked: boolean; likeCount: number }> {
        return this.chronikService.toggleLike(user.userId, id);
    }

    @Post(":id/hide")
    @HttpCode(HttpStatus.NO_CONTENT)
    async hideEntry(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
        return this.chronikService.hideEntry(user.userId, id);
    }

    @Delete(":id/hide")
    @HttpCode(HttpStatus.NO_CONTENT)
    async unhideEntry(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
        return this.chronikService.unhideEntry(user.userId, id);
    }

    @Get(":id/comments")
    async getComments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<ChronikCommentDto[]> {
        return this.chronikService.getComments(id, user.userId);
    }

    @Post(":id/comments")
    async createComment(
        @CurrentUser() user: AuthenticatedUser,
        @Param("id") id: string,
        @Body() dto: CreateCommentDto
    ): Promise<ChronikCommentDto> {
        return this.chronikService.createComment(user.userId, id, dto);
    }

    @Patch("comments/:commentId")
    async updateComment(
        @CurrentUser() user: AuthenticatedUser,
        @Param("commentId") commentId: string,
        @Body() body: { content: string }
    ): Promise<ChronikCommentDto> {
        return this.chronikService.updateComment(commentId, user.userId, body.content);
    }

    @Delete("comments/:commentId")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(@CurrentUser() user: AuthenticatedUser, @Param("commentId") commentId: string): Promise<void> {
        return this.chronikService.deleteComment(user.userId, commentId);
    }

    @Post("comments/:commentId/like")
    async toggleCommentLike(
        @CurrentUser() user: AuthenticatedUser,
        @Param("commentId") commentId: string
    ): Promise<{ liked: boolean; likeCount: number }> {
        return this.chronikService.toggleCommentLike(user.userId, commentId);
    }

    @Post("follow/:targetUserId")
    async toggleFollow(
        @CurrentUser() user: AuthenticatedUser,
        @Param("targetUserId") targetUserId: string
    ): Promise<{ following: boolean; followerCount: number }> {
        return this.chronikService.toggleFollow(user.userId, targetUserId);
    }

    @Get("following")
    async getFollowing(
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
        return this.chronikService.getFollowing(user.userId);
    }

    @Get("followers")
    async getFollowers(
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
        return this.chronikService.getFollowers(user.userId);
    }

    @Get("stats/:userId")
    async getProfileStats(
        @CurrentUser() user: AuthenticatedUser,
        @Param("userId") userId: string
    ): Promise<ChronikProfileStats> {
        return this.chronikService.getProfileStats(userId, user.userId);
    }
}
