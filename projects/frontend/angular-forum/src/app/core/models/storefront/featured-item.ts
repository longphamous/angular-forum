export type FeaturedSection = "featured" | "discount" | "event";
export type FeaturedSourceType = "shop" | "booster" | "marketplace" | "custom";

export interface FeaturedItem {
    id: string;
    section: FeaturedSection;
    sourceType: FeaturedSourceType;
    sourceId?: string;
    title: string;
    description?: string;
    imageUrl?: string;
    linkUrl?: string;
    badgeText?: string;
    badgeColor?: string;
    originalPrice?: number;
    discountPrice?: number;
    isActive: boolean;
    sortOrder: number;
    validFrom?: string;
    validUntil?: string;
    createdAt: string;
}

export interface CreateFeaturedItemPayload {
    section: FeaturedSection;
    sourceType: FeaturedSourceType;
    sourceId?: string;
    title: string;
    description?: string;
    imageUrl?: string;
    linkUrl?: string;
    badgeText?: string;
    badgeColor?: string;
    originalPrice?: number;
    discountPrice?: number;
    sortOrder?: number;
    validFrom?: string;
    validUntil?: string;
}
