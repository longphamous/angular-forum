export const RPG_ROUTES = {
    myCharacter: () => "/rpg/character",
    character: (userId: string) => `/rpg/character/${userId}`,
    createOrUpdate: () => "/rpg/character",
    allocatePoints: () => "/rpg/character/stats",
    equip: (inventoryId: string) => `/rpg/character/equip/${inventoryId}`,
    unequip: (slot: string) => `/rpg/character/unequip/${slot}`,
    equipmentInventory: () => "/rpg/equipment",
    questBoard: () => "/rpg/quests/board",
    questCompleted: () => "/rpg/quests/completed",
    claimQuest: (userQuestId: string) => `/rpg/quests/claim/${userQuestId}`
} as const;
