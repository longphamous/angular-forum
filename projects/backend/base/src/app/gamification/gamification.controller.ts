import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";

import { GamificationService } from "./gamification.service";
import { Achievement } from "./models/achievement.model";
import { LeaderboardEntry } from "./models/leaderboard.model";
import { UserProgress } from "./models/user-progress.model";

@Controller("gamification")
export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) {}

    @Get("achievements")
    getAllAchievements(): Achievement[] {
        return this.gamificationService.getAllAchievements();
    }

    @Get("achievements/:id")
    getAchievementById(@Param("id") id: string): Achievement {
        return this.gamificationService.getAchievementById(id);
    }

    @Get("leaderboard")
    getLeaderboard(@Query("limit", new ParseIntPipe({ optional: true })) limit?: number): LeaderboardEntry[] {
        return this.gamificationService.getLeaderboard(limit);
    }

    @Get("users/:userId/progress")
    getUserProgress(@Param("userId") userId: string): UserProgress {
        return this.gamificationService.getUserProgress(userId);
    }
}
