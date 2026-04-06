export interface ShopItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    icon: string | null;
    category: string | null;
    isActive: boolean;
    stock: number | null;
    maxPerUser: number | null;
    sortOrder: number;
    isEquipment?: boolean;
    equipmentSlot?: string | null;
    statBonuses?: Record<string, number> | null;
    requiredLevel?: number | null;
    rarity?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserInventoryItem {
    id: string;
    userId: string;
    itemId: string;
    item: ShopItem;
    quantity: number;
    purchasedAt: string;
}
