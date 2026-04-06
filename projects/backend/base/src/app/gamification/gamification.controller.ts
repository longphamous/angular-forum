import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { GamificationService, XpConfigDto, XpHistoryEvent } from "./gamification.service";
import { UserXpData } from "./level.config";
import type { LeaderboardResponse } from "./models/leaderboard.model";

interface UpdateXpConfigDto {
    xpAmount: number;
}

@ApiTags("Gamification")
@ApiBearerAuth("JWT")
@Controller("gamification")
export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) {}

    // ── Public ────────────────────────────────────────────────────────────────

    @Public()
    @Get("leaderboard")
    getLeaderboard(
        @Query("limit") limit?: string,
        @Query("offset") offset?: string
    ): Promise<LeaderboardResponse> {
        return this.gamificationService.getLeaderboard(Number(limit) || 50, Number(offset) || 0);
    }

    @Public()
    @Get("users/:userId/progress")
    getUserProgress(@Param("userId") userId: string): Promise<UserXpData> {
        return this.gamificationService.getUserXpData(userId);
    }

    @Get("users/:userId/history")
    getXpHistory(
        @Param("userId") userId: string,
        @Query("limit") limit?: string,
        @Query("offset") offset?: string,
        @CurrentUser() user?: AuthenticatedUser
    ): Promise<{ events: XpHistoryEvent[]; total: number }> {
        if (!user || (user.userId !== userId && user.role !== "admin")) {
            throw new BadRequestException("You can only view your own XP history");
        }
        return this.gamificationService.getXpHistory(userId, Number(limit) || 50, Number(offset) || 0);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Roles("admin")
    @Get("config")
    getXpConfig(): Promise<XpConfigDto[]> {
        return this.gamificationService.getXpConfig();
    }

    @Roles("admin")
    @Patch("config/:eventType")
    updateXpConfig(@Param("eventType") eventType: string, @Body() dto: UpdateXpConfigDto): Promise<XpConfigDto> {
        const amount = Number(dto.xpAmount);
        if (!Number.isInteger(amount) || amount < 0) {
            throw new BadRequestException("xpAmount must be a non-negative integer");
        }
        return this.gamificationService.updateXpConfig(eventType, amount);
    }

    @Roles("admin")
    @Post("recalculate")
    recalculateAllUserXp(): Promise<{ updatedUsers: number }> {
        return this.gamificationService.recalculateAllUserXp();
    }
}
