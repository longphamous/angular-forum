import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { GamificationService } from "../gamification/gamification.service";
import { QuestEntity } from "./entities/quest.entity";
import { QuestBoardDto, QuestDto, QuestService, UserQuestDto } from "./quest.service";

@ApiTags("RPG")
@ApiBearerAuth("JWT")
@Controller("rpg/quests")
export class QuestController {
    constructor(
        private readonly questService: QuestService,
        private readonly gamificationService: GamificationService
    ) {}

    @Get("board")
    async getQuestBoard(@CurrentUser() user: AuthenticatedUser): Promise<QuestBoardDto> {
        const xpData = await this.gamificationService.getUserXpData(user.userId);
        return this.questService.getQuestBoard(user.userId, xpData.level);
    }

    @Post("claim/:userQuestId")
    claimReward(
        @CurrentUser() user: AuthenticatedUser,
        @Param("userQuestId") userQuestId: string
    ): Promise<UserQuestDto> {
        return this.questService.claimReward(user.userId, userQuestId);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin")
    getAllQuests(): Promise<QuestDto[]> {
        return this.questService.getAllQuests();
    }

    @Roles("admin")
    @Post("admin")
    createQuest(@Body() dto: Partial<QuestEntity>): Promise<QuestDto> {
        return this.questService.createQuest(dto);
    }

    @Roles("admin")
    @Patch("admin/:id")
    updateQuest(@Param("id") id: string, @Body() dto: Partial<QuestEntity>): Promise<QuestDto> {
        return this.questService.updateQuest(id, dto);
    }

    @Roles("admin")
    @Delete("admin/:id")
    deleteQuest(@Param("id") id: string): Promise<void> {
        return this.questService.deleteQuest(id);
    }
}
