import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { BountyService, type WantedPosterDto } from "./bounty.service";

@ApiTags("Gamification")
@ApiBearerAuth("JWT")
@Controller("bounty")
export class BountyController {
    constructor(private readonly bountyService: BountyService) {}

    /** GET /bounty/leaderboard — Top bounties */
    @Get("leaderboard")
    getLeaderboard(
        @Query("limit") limit?: string,
        @Query("offset") offset?: string
    ): Promise<{ data: WantedPosterDto[]; total: number }> {
        return this.bountyService.getLeaderboard(limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
    }

    /** GET /bounty/config — Get multiplier config and epithet tiers */
    @Get("config")
    getConfig(): { multipliers: Record<string, number>; epithets: { min: number; epithet: string }[] } {
        return this.bountyService.getConfig();
    }

    /** GET /bounty/me — Current user's wanted poster */
    @Get("me")
    getMyPoster(@CurrentUser() user: AuthenticatedUser): Promise<WantedPosterDto | null> {
        return this.bountyService.getWantedPoster(user.userId);
    }

    /** GET /bounty/:userId — Specific user's wanted poster */
    @Get(":userId")
    getPoster(@Param("userId", ParseUUIDPipe) userId: string): Promise<WantedPosterDto | null> {
        return this.bountyService.getWantedPoster(userId);
    }

    /** POST /bounty/recalculate — Admin: Recalculate all bounties */
    @Roles("admin")
    @Post("recalculate")
    async recalculateAll(): Promise<{ usersProcessed: number }> {
        const count = await this.bountyService.recalculateAll();
        return { usersProcessed: count };
    }
}
