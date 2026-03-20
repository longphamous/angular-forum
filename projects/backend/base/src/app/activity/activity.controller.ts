import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/auth.decorators";
import { ActivityService } from "./activity.service";

@Controller("activities")
@UseGuards(JwtAuthGuard)
export class ActivityController {
    constructor(private readonly activityService: ActivityService) {}

    @Public()
    @Get()
    getGlobalFeed(@Query("limit") limit?: string, @Query("offset") offset?: string) {
        return this.activityService.getGlobalFeed(
            Math.min(Number(limit) || 20, 50),
            Number(offset) || 0
        );
    }

    @Public()
    @Get("user/:userId")
    getUserFeed(
        @Param("userId") userId: string,
        @Query("limit") limit?: string,
        @Query("offset") offset?: string
    ) {
        return this.activityService.getUserFeed(
            userId,
            Math.min(Number(limit) || 20, 50),
            Number(offset) || 0
        );
    }
}
