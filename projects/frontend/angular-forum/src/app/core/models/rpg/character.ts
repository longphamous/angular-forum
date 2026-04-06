export type CharacterClass = "warrior" | "mage" | "rogue" | "ranger" | "paladin";
export type EquipmentSlot = "head" | "chest" | "legs" | "feet" | "weapon" | "shield" | "accessory";
export type StatName = "strength" | "dexterity" | "intelligence" | "charisma" | "endurance" | "luck";

export const STAT_NAMES: StatName[] = ["strength", "dexterity", "intelligence", "charisma", "endurance", "luck"];
export const EQUIPMENT_SLOTS: EquipmentSlot[] = ["head", "chest", "legs", "feet", "weapon", "shield", "accessory"];
export const POINTS_PER_LEVEL = 3;

export interface CharacterStats {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    endurance: number;
    luck: number;
}

export interface EquippedItem {
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

export interface Character {
    userId: string;
    name: string;
    characterClass: CharacterClass;
    level: number;
    baseStats: CharacterStats;
    equipmentBonuses: CharacterStats;
    totalStats: CharacterStats;
    unspentPoints: number;
    equipment: EquippedItem[];
    createdAt: string;
}

export interface EquipmentInventoryItem {
    inventoryId: string;
    quantity: number;
    item: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        icon: string | null;
        category: string | null;
        equipmentSlot: string | null;
        statBonuses: Record<string, number> | null;
        requiredLevel: number | null;
        rarity: string | null;
    };
}

export interface AllocatePointsPayload {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    charisma?: number;
    endurance?: number;
    luck?: number;
}

export interface CreateCharacterPayload {
    name: string;
    characterClass: CharacterClass;
}

export const STAT_CONFIG: Record<StatName, { icon: string; color: string; labelKey: string }> = {
    strength: { icon: "pi pi-bolt", color: "text-red-500", labelKey: "rpg.stats.strength" },
    dexterity: { icon: "pi pi-forward", color: "text-green-500", labelKey: "rpg.stats.dexterity" },
    intelligence: { icon: "pi pi-book", color: "text-blue-500", labelKey: "rpg.stats.intelligence" },
    charisma: { icon: "pi pi-star", color: "text-pink-500", labelKey: "rpg.stats.charisma" },
    endurance: { icon: "pi pi-shield", color: "text-amber-500", labelKey: "rpg.stats.endurance" },
    luck: { icon: "pi pi-sparkles", color: "text-purple-500", labelKey: "rpg.stats.luck" }
};

export const CLASS_CONFIG: Record<CharacterClass, { icon: string; color: string; labelKey: string }> = {
    warrior: { icon: "pi pi-shield", color: "text-red-500", labelKey: "rpg.classes.warrior" },
    mage: { icon: "pi pi-sparkles", color: "text-blue-500", labelKey: "rpg.classes.mage" },
    rogue: { icon: "pi pi-eye", color: "text-green-500", labelKey: "rpg.classes.rogue" },
    ranger: { icon: "pi pi-compass", color: "text-amber-500", labelKey: "rpg.classes.ranger" },
    paladin: { icon: "pi pi-sun", color: "text-yellow-500", labelKey: "rpg.classes.paladin" }
};

export const SLOT_CONFIG: Record<EquipmentSlot, { icon: string; labelKey: string }> = {
    head: { icon: "pi pi-crown", labelKey: "rpg.slots.head" },
    chest: { icon: "pi pi-shield", labelKey: "rpg.slots.chest" },
    legs: { icon: "pi pi-arrows-v", labelKey: "rpg.slots.legs" },
    feet: { icon: "pi pi-map-marker", labelKey: "rpg.slots.feet" },
    weapon: { icon: "pi pi-bolt", labelKey: "rpg.slots.weapon" },
    shield: { icon: "pi pi-stop-circle", labelKey: "rpg.slots.shield" },
    accessory: { icon: "pi pi-star", labelKey: "rpg.slots.accessory" }
};
