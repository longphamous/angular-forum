export interface SlideTranslation {
    title?: string;
    description?: string;
}

export interface TeaserSlide {
    id: string;
    title: string;
    description: string | null;
    translations: Record<string, SlideTranslation> | null;
    imageUrl: string;
    linkUrl: string | null;
    linkLabel: string | null;
    linkFullSlide: boolean;
    textStyle: "overlay" | "glass";
    textAlign: "left" | "center";
    isActive: boolean;
    sortOrder: number;
    validFrom: string | null;
    validUntil: string | null;
    createdAt: string;
    updatedAt: string;
}
