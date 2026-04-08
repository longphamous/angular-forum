import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ShopItemEntity } from "../shop/entities/shop-item.entity";
import { UserInventoryEntity } from "../shop/entities/user-inventory.entity";
import { QuestService } from "./quest.service";
import {
    CharacterClass,
    EQUIPMENT_SLOTS,
    EquipmentSlot,
    POINTS_PER_LEVEL,
    STAT_NAMES,
    StatName,
    UserCharacterEntity
} from "./entities/user-character.entity";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CharacterStats {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    endurance: number;
    luck: number;
}

export interface EquippedItemDto {
    slot: EquipmentSlot;
    inventoryId: string;
    item: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        icon: string | null;
        rarity: string | null;
        statBonuses: Record<string, number> | null;
    };
}

export interface CharacterDto {
    userId: string;
    name: string;
    characterClass: CharacterClass;
    level: number;
    baseStats: CharacterStats;
    equipmentBonuses: CharacterStats;
    totalStats: CharacterStats;
    unspentPoints: number;
    equipment: EquippedItemDto[];
    createdAt: string;
}

export interface CreateCharacterDto {
    name: string;
    characterClass: CharacterClass;
}

export interface AllocatePointsDto {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    charisma?: number;
    endurance?: number;
    luck?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class RpgService {
    constructor(
        @InjectRepository(UserCharacterEntity)
        private readonly characterRepo: Repository<UserCharacterEntity>,
        @InjectRepository(UserInventoryEntity)
        private readonly inventoryRepo: Repository<UserInventoryEntity>,
        @InjectRepository(ShopItemEntity)
        private readonly shopItemRepo: Repository<ShopItemEntity>,
        private readonly questService: QuestService
    ) {}

    // ── Get or auto-create character ─────────────────────────────────────────

    async getCharacter(userId: string, userLevel: number): Promise<CharacterDto> {
        let entity = await this.characterRepo.findOneBy({ userId });
        if (!entity) {
            entity = this.characterRepo.create({
                userId,
                name: "Held",
                characterClass: "warrior",
                strength: 1,
                dexterity: 1,
                intelligence: 1,
                charisma: 1,
                endurance: 1,
                luck: 1,
                unspentPoints: Math.max(0, (userLevel - 1) * POINTS_PER_LEVEL)
            });
            await this.characterRepo.save(entity);
        }
        return this.toDto(entity, userLevel);
    }

    // ── Create / update character info ────────────────────────────────────────

    async createOrUpdate(userId: string, dto: CreateCharacterDto, userLevel: number): Promise<CharacterDto> {
        let entity = await this.characterRepo.findOneBy({ userId });
        if (entity) {
            entity.name = dto.name;
            entity.characterClass = dto.characterClass;
        } else {
            entity = this.characterRepo.create({
                userId,
                name: dto.name,
                characterClass: dto.characterClass,
                strength: 1,
                dexterity: 1,
                intelligence: 1,
                charisma: 1,
                endurance: 1,
                luck: 1,
                unspentPoints: Math.max(0, (userLevel - 1) * POINTS_PER_LEVEL)
            });
        }
        await this.characterRepo.save(entity);
        return this.toDto(entity, userLevel);
    }

    // ── Allocate attribute points ─────────────────────────────────────────────

    async allocatePoints(userId: string, dto: AllocatePointsDto, userLevel: number): Promise<CharacterDto> {
        const entity = await this.characterRepo.findOneBy({ userId });
        if (!entity) throw new NotFoundException("Character not found");

        const totalSpend = Object.values(dto).reduce((sum, v) => sum + (v ?? 0), 0);
        if (totalSpend <= 0) throw new BadRequestException("Must allocate at least 1 point");
        if (totalSpend > entity.unspentPoints) {
            throw new BadRequestException(`Not enough points. Available: ${entity.unspentPoints}`);
        }

        for (const stat of STAT_NAMES) {
            const add = dto[stat] ?? 0;
            if (add < 0) throw new BadRequestException(`Cannot allocate negative points to ${stat}`);
            if (add > 0) {
                entity[stat] += add;
            }
        }
        entity.unspentPoints -= totalSpend;

        await this.characterRepo.save(entity);
        void this.questService.trackProgress(userId, "allocate_points").catch(() => undefined);
        return this.toDto(entity, userLevel);
    }

    // ── Award points (called on level-up) ─────────────────────────────────────

    async awardPoints(userId: string, points: number): Promise<void> {
        const entity = await this.characterRepo.findOneBy({ userId });
        if (!entity) return; // Character not yet created — points will be calculated on first access
        entity.unspentPoints += points;
        await this.characterRepo.save(entity);
    }

    // ── Equip item ────────────────────────────────────────────────────────────

    async equipItem(userId: string, inventoryId: string, userLevel: number): Promise<CharacterDto> {
        const entity = await this.characterRepo.findOneBy({ userId });
        if (!entity) throw new NotFoundException("Character not found");

        const inv = await this.inventoryRepo.findOneBy({ id: inventoryId, userId });
        if (!inv) throw new NotFoundException("Item not in inventory");

        const item = await this.shopItemRepo.findOneBy({ id: inv.itemId });
        if (!item || !item.isEquipment || !item.equipmentSlot) {
            throw new BadRequestException("Item is not equippable");
        }
        if (item.requiredLevel && userLevel < item.requiredLevel) {
            throw new BadRequestException(`Requires level ${item.requiredLevel}`);
        }

        const slot = item.equipmentSlot as EquipmentSlot;
        this.setSlot(entity, slot, inventoryId);
        await this.characterRepo.save(entity);
        void this.questService.trackProgress(userId, "equip_item").catch(() => undefined);
        return this.toDto(entity, userLevel);
    }

    // ── Unequip item ──────────────────────────────────────────────────────────

    async unequipSlot(userId: string, slot: EquipmentSlot, userLevel: number): Promise<CharacterDto> {
        if (!EQUIPMENT_SLOTS.includes(slot)) throw new BadRequestException("Invalid slot");
        const entity = await this.characterRepo.findOneBy({ userId });
        if (!entity) throw new NotFoundException("Character not found");

        this.setSlot(entity, slot, null);
        await this.characterRepo.save(entity);
        return this.toDto(entity, userLevel);
    }

    // ── Get available equipment from inventory ────────────────────────────────

    async getEquipmentInventory(
        userId: string
    ): Promise<{ inventoryId: string; item: ShopItemEntity; quantity: number }[]> {
        const invItems = await this.inventoryRepo.find({ where: { userId } });
        if (invItems.length === 0) return [];

        const itemIds = invItems.map((i) => i.itemId);
        const items = await this.shopItemRepo.findByIds(itemIds);
        const itemMap = new Map(items.map((i) => [i.id, i]));

        return invItems
            .filter((inv) => {
                const item = itemMap.get(inv.itemId);
                return item?.isEquipment;
            })
            .map((inv) => ({
                inventoryId: inv.id,
                item: itemMap.get(inv.itemId)!,
                quantity: inv.quantity
            }));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private setSlot(entity: UserCharacterEntity, slot: EquipmentSlot, value: string | null): void {
        switch (slot) {
            case "head":
                entity.slotHead = value;
                break;
            case "chest":
                entity.slotChest = value;
                break;
            case "legs":
                entity.slotLegs = value;
                break;
            case "feet":
                entity.slotFeet = value;
                break;
            case "weapon":
                entity.slotWeapon = value;
                break;
            case "shield":
                entity.slotShield = value;
                break;
            case "accessory":
                entity.slotAccessory = value;
                break;
        }
    }

    private getSlot(entity: UserCharacterEntity, slot: EquipmentSlot): string | null {
        switch (slot) {
            case "head":
                return entity.slotHead;
            case "chest":
                return entity.slotChest;
            case "legs":
                return entity.slotLegs;
            case "feet":
                return entity.slotFeet;
            case "weapon":
                return entity.slotWeapon;
            case "shield":
                return entity.slotShield;
            case "accessory":
                return entity.slotAccessory;
        }
    }

    private async toDto(entity: UserCharacterEntity, userLevel: number): Promise<CharacterDto> {
        const baseStats: CharacterStats = {
            strength: entity.strength,
            dexterity: entity.dexterity,
            intelligence: entity.intelligence,
            charisma: entity.charisma,
            endurance: entity.endurance,
            luck: entity.luck
        };

        // Resolve equipped items and calculate bonuses
        const equipment: EquippedItemDto[] = [];
        const equipmentBonuses: CharacterStats = {
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            charisma: 0,
            endurance: 0,
            luck: 0
        };

        for (const slot of EQUIPMENT_SLOTS) {
            const invId = this.getSlot(entity, slot);
            if (!invId) continue;

            const inv = await this.inventoryRepo.findOneBy({ id: invId, userId: entity.userId });
            if (!inv) {
                this.setSlot(entity, slot, null);
                continue;
            }

            const item = await this.shopItemRepo.findOneBy({ id: inv.itemId });
            if (!item) continue;

            equipment.push({
                slot,
                inventoryId: invId,
                item: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    icon: item.icon,
                    rarity: item.rarity,
                    statBonuses: item.statBonuses
                }
            });

            if (item.statBonuses) {
                for (const [stat, bonus] of Object.entries(item.statBonuses)) {
                    if (stat in equipmentBonuses) {
                        equipmentBonuses[stat as keyof CharacterStats] += bonus;
                    }
                }
            }
        }

        const totalStats: CharacterStats = {
            strength: baseStats.strength + equipmentBonuses.strength,
            dexterity: baseStats.dexterity + equipmentBonuses.dexterity,
            intelligence: baseStats.intelligence + equipmentBonuses.intelligence,
            charisma: baseStats.charisma + equipmentBonuses.charisma,
            endurance: baseStats.endurance + equipmentBonuses.endurance,
            luck: baseStats.luck + equipmentBonuses.luck
        };

        return {
            userId: entity.userId,
            name: entity.name,
            characterClass: entity.characterClass,
            level: userLevel,
            baseStats,
            equipmentBonuses,
            totalStats,
            unspentPoints: entity.unspentPoints,
            equipment,
            createdAt: entity.createdAt.toISOString()
        };
    }
}
