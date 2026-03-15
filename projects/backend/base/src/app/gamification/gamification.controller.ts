import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import { GamificationService, XpConfigDto } from "./gamification.service";
import { UserXpData } from "./level.config";

interface UpdateXpConfigDto {
    xpAmount: number;
}

@Controller("gamification")
export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) {}

    // ── Public ────────────────────────────────────────────────────────────────

    @Public()
    @Get("users/:userId/progress")
    getUserProgress(@Param("userId") userId: string): Promise<UserXpData> {
        return this.gamificationService.getUserXpData(userId);
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
