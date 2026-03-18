import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { FeedService } from "./feed.service";
import {
    AddFeaturedDto,
    FeaturedThreadDto,
    PaginatedFeedDto,
    ThreadSearchResultDto,
    UpdateFeaturedDto
} from "./models/feed.model";

@Controller("feed")
export class FeedController {
    constructor(private readonly feedService: FeedService) {}

    /**
     * GET /feed/featured
     * Returns active featured threads for the carousel. Public.
     */
    @Public()
    @Get("featured")
    getFeatured(): Promise<FeaturedThreadDto[]> {
        return this.feedService.getFeatured();
    }

    /**
     * GET /feed/hot?page=1&limit=20&sort=hot
     * Returns paginated hot/new/top feed. Public.
     */
    @Public()
    @Get("hot")
    getHotFeed(
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @Query("sort") sort?: string
    ): Promise<PaginatedFeedDto> {
        const p = Math.max(1, Number(page) || 1);
        const l = Math.min(50, Math.max(1, Number(limit) || 20));
        const s = (sort === "new" || sort === "top" ? sort : "hot") as "hot" | "new" | "top";
        return this.feedService.getHotFeed(p, l, s);
    }

    /**
     * GET /feed/admin/featured
     * Returns all featured threads (incl. inactive) for admin management.
     */
    @Get("admin/featured")
    getAdminFeatured(@CurrentUser() _user: AuthenticatedUser): Promise<FeaturedThreadDto[]> {
        return this.feedService.getAdminFeatured();
    }

    /**
     * GET /feed/admin/search-threads?q=term
     * Searches threads by title for admin to select for featuring.
     */
    @Get("admin/search-threads")
    searchThreads(@Query("q") q: string, @CurrentUser() _user: AuthenticatedUser): Promise<ThreadSearchResultDto[]> {
        return this.feedService.searchThreads(q ?? "");
    }

    /**
     * POST /feed/admin/featured
     * Adds a thread to the featured carousel.
     */
    @Post("admin/featured")
    addFeatured(@Body() dto: AddFeaturedDto, @CurrentUser() _user: AuthenticatedUser): Promise<FeaturedThreadDto> {
        return this.feedService.addFeatured(dto);
    }

    /**
     * PATCH /feed/admin/featured/:id
     * Updates position or active state of a featured entry.
     */
    @Patch("admin/featured/:id")
    updateFeatured(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateFeaturedDto,
        @CurrentUser() _user: AuthenticatedUser
    ): Promise<FeaturedThreadDto> {
        return this.feedService.updateFeatured(id, dto);
    }

    /**
     * DELETE /feed/admin/featured/:id
     * Removes a thread from the featured carousel.
     */
    @Delete("admin/featured/:id")
    async removeFeatured(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() _user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.feedService.removeFeatured(id);
        return { success: true };
    }
}
