import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { GamificationService } from "../gamification/gamification.service";
import { EquipmentSlot } from "./entities/user-character.entity";
import { AllocatePointsDto, CharacterDto, CreateCharacterDto, RpgService } from "./rpg.service";

@ApiTags("RPG")
@ApiBearerAuth("JWT")
@Controller("rpg")
export class RpgController {
    constructor(
        private readonly rpgService: RpgService,
        private readonly gamificationService: GamificationService
    ) {}

    @Get("character")
    async getMyCharacter(@CurrentUser() user: AuthenticatedUser): Promise<CharacterDto> {
        const xpData = await this.gamificationService.getUserXpData(user.userId);
        return this.rpgService.getCharacter(user.userId, xpData.level);
    }

    @Get("character/:userId")
    async getCharacter(@Param("userId") userId: string): Promise<CharacterDto> {
        const xpData = await this.gamificationService.getUserXpData(userId);
        return this.rpgService.getCharacter(userId, xpData.level);
    }

    @Post("character")
    async createOrUpdate(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateCharacterDto
    ): Promise<CharacterDto> {
        if (!dto.name?.trim()) throw new BadRequestException("Name is required");
        const xpData = await this.gamificationService.getUserXpData(user.userId);
        return this.rpgService.createOrUpdate(user.userId, dto, xpData.level);
    }

    @Patch("character/stats")
    async allocatePoints(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: AllocatePointsDto
    ): Promise<CharacterDto> {
        const xpData = await this.gamificationService.getUserXpData(user.userId);
        return this.rpgService.allocatePoints(user.userId, dto, xpData.level);
    }

    @Post("character/equip/:inventoryId")
    async equipItem(
        @CurrentUser() user: AuthenticatedUser,
        @Param("inventoryId") inventoryId: string
    ): Promise<CharacterDto> {
        const xpData = await this.gamificationService.getUserXpData(user.userId);
        return this.rpgService.equipItem(user.userId, inventoryId, xpData.level);
    }

    @Delete("character/unequip/:slot")
    async unequipSlot(
        @CurrentUser() user: AuthenticatedUser,
        @Param("slot") slot: string
    ): Promise<CharacterDto> {
        const xpData = await this.gamificationService.getUserXpData(user.userId);
        return this.rpgService.unequipSlot(user.userId, slot as EquipmentSlot, xpData.level);
    }

    @Get("equipment")
    async getEquipmentInventory(@CurrentUser() user: AuthenticatedUser) {
        return this.rpgService.getEquipmentInventory(user.userId);
    }
}
