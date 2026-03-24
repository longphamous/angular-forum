import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request } from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import {
    AchievementCategoryDto,
    AchievementDto,
    AchievementHistoryDto,
    AchievementProgressDto,
    AchievementService,
    CreateAchievementDto,
    UserAchievementDto
} from "./achievement.service";

const VALID_RARITIES = ["bronze", "silver", "gold", "platinum"] as const;
const VALID_TRIGGER_TYPES = [
    "manual",
    "post_count",
    "thread_count",
    "reaction_received_count",
    "reaction_given_count",
    "level_reached",
    "xp_total",
    "clip_count",
    "blog_post_count",
    "gallery_upload_count",
    "lexicon_article_count",
    "recipe_count",
    "lotto_ticket_count"
] as const;

function validateDto(dto: Partial<CreateAchievementDto>, requireAll: boolean): void {
    if (requireAll && (!dto.key || !dto.name || !dto.icon || !dto.triggerType || dto.triggerValue == null)) {
        throw new BadRequestException("key, name, icon, triggerType and triggerValue are required");
    }
    if (dto.triggerValue !== undefined && dto.triggerType !== "manual" && (!Number.isInteger(dto.triggerValue) || dto.triggerValue < 1)) {
        throw new BadRequestException("triggerValue must be a positive integer");
    }
    if (dto.rarity !== undefined && !VALID_RARITIES.includes(dto.rarity as (typeof VALID_RARITIES)[number])) {
        throw new BadRequestException(`rarity must be one of: ${VALID_RARITIES.join(", ")}`);
    }
    if (
        dto.triggerType !== undefined &&
        !VALID_TRIGGER_TYPES.includes(dto.triggerType as (typeof VALID_TRIGGER_TYPES)[number])
    ) {
        throw new BadRequestException(`triggerType must be one of: ${VALID_TRIGGER_TYPES.join(", ")}`);
    }
}

@Controller("gamification/achievements")
export class AchievementController {
    constructor(private readonly achievementService: AchievementService) {}

    // ── Public ────────────────────────────────────────────────────────────────

    @Public()
    @Get()
    getAll(): Promise<AchievementDto[]> {
        return this.achievementService.getAllAchievements(false);
    }

    @Public()
    @Get("user/:userId")
    getUserAchievements(@Param("userId") userId: string): Promise<UserAchievementDto[]> {
        return this.achievementService.getUserAchievements(userId);
    }

    @Public()
    @Get("progress/:userId")
    getUserProgress(@Param("userId") userId: string): Promise<AchievementProgressDto[]> {
        return this.achievementService.getUserProgress(userId);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin")
    getAllAdmin(): Promise<AchievementDto[]> {
        return this.achievementService.getAllAchievements(true);
    }

    @Roles("admin")
    @Get("admin/:id/detail")
    getDetail(@Param("id") id: string): Promise<object> {
        return this.achievementService.getAchievementDetail(id);
    }

    @Roles("admin")
    @Post("admin")
    create(@Body() dto: CreateAchievementDto): Promise<AchievementDto> {
        validateDto(dto, true);
        return this.achievementService.createAchievement(dto);
    }

    @Roles("admin")
    @Patch("admin/:id")
    update(@Param("id") id: string, @Body() dto: Partial<CreateAchievementDto>): Promise<AchievementDto> {
        validateDto(dto, false);
        return this.achievementService.updateAchievement(id, dto);
    }

    @Roles("admin")
    @Delete("admin/:id")
    @HttpCode(204)
    delete(@Param("id") id: string): Promise<void> {
        return this.achievementService.deleteAchievement(id);
    }

    // ── Manual Grant / Revoke ──────────────────────────────────────────────

    @Roles("admin")
    @Post("admin/grant")
    grant(
        @Body() body: { userId: string; achievementId: string },
        @Request() req: { user: { userId: string } }
    ): Promise<UserAchievementDto> {
        if (!body.userId || !body.achievementId) {
            throw new BadRequestException("userId and achievementId are required");
        }
        return this.achievementService.grantAchievement(body.userId, body.achievementId, req.user.userId);
    }

    @Roles("admin")
    @Delete("admin/revoke/:userId/:achievementId")
    @HttpCode(204)
    revoke(@Param("userId") userId: string, @Param("achievementId") achievementId: string): Promise<void> {
        return this.achievementService.revokeAchievement(userId, achievementId);
    }

    // ── Categories ─────────────────────────────────────────────────────────

    @Public()
    @Get("categories")
    getCategories(): Promise<AchievementCategoryDto[]> {
        return this.achievementService.getCategories();
    }

    @Roles("admin")
    @Post("categories")
    createCategory(@Body() dto: { key: string; name: string; description?: string; icon?: string; position?: number }): Promise<AchievementCategoryDto> {
        if (!dto.key || !dto.name) throw new BadRequestException("key and name are required");
        return this.achievementService.createCategory(dto);
    }

    @Roles("admin")
    @Patch("categories/:id")
    updateCategory(@Param("id") id: string, @Body() dto: Partial<{ key: string; name: string; description: string; icon: string; position: number }>): Promise<AchievementCategoryDto> {
        return this.achievementService.updateCategory(id, dto);
    }

    @Roles("admin")
    @Delete("categories/:id")
    @HttpCode(204)
    deleteCategory(@Param("id") id: string): Promise<void> {
        return this.achievementService.deleteCategory(id);
    }

    // ── History ────────────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin/history")
    getHistory(@Query("limit") limit?: string): Promise<AchievementHistoryDto[]> {
        return this.achievementService.getHistory(Math.min(Number(limit) || 50, 200));
    }
}
