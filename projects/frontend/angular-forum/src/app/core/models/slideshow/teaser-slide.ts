export interface TeaserSlide {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    linkUrl: string | null;
    linkLabel: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}
