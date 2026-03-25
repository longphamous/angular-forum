import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import {
    AuthorStatsResponse,
    ClipStatsResponse,
    ClipStatsService,
    RecommendationSignals,
    TrackViewDto,
    TrendingClipResponse
} from "./clip-stats.service";

@Controller("clips/stats")
export class ClipStatsController {
    constructor(private readonly statsService: ClipStatsService) {}

    @Public()
    @Post(":id/view")
    trackView(
        @Param("id") id: string,
        @Body() dto: TrackViewDto,
        @CurrentUser() user?: AuthenticatedUser
    ): Promise<{ tracked: boolean }> {
        return this.statsService.trackView(id, user?.userId, dto);
    }

    @Public()
    @Get(":id")
    getClipStats(@Param("id") id: string): Promise<ClipStatsResponse> {
        return this.statsService.getClipStats(id);
    }

    @Public()
    @Get("author/:authorId")
    getAuthorStats(@Param("authorId") authorId: string): Promise<AuthorStatsResponse> {
        return this.statsService.getAuthorStats(authorId);
    }

    @Public()
    @Get("trending/list")
    getTrending(@Query("limit") limit?: string): Promise<TrendingClipResponse[]> {
        return this.statsService.getTrending(Number(limit) || 10);
    }

    @Get(":id/recommendations")
    getRecommendationSignals(@Param("id") id: string): Promise<RecommendationSignals> {
        return this.statsService.getRecommendationSignals(id);
    }
}
