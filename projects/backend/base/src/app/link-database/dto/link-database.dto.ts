import { LinkSortBy, LinkStatus } from "../models/link-database.model";

export class CreateCategoryDto {
    name!: string;
    description?: string;
    iconClass?: string;
    color?: string;
    sortOrder?: number;
    requiresApproval?: boolean;
    defaultSortBy?: LinkSortBy;
}

export class UpdateCategoryDto {
    name?: string;
    description?: string;
    iconClass?: string;
    color?: string;
    sortOrder?: number;
    requiresApproval?: boolean;
    defaultSortBy?: LinkSortBy;
}

export class CreateLinkDto {
    title!: string;
    url!: string;
    description?: string;
    excerpt?: string;
    previewImageUrl?: string;
    tags?: string[];
    categoryId!: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contactEmail?: string;
    contactPhone?: string;
    customFields?: Record<string, string>;
}

export class UpdateLinkDto {
    title?: string;
    url?: string;
    description?: string;
    excerpt?: string;
    previewImageUrl?: string;
    tags?: string[];
    categoryId?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contactEmail?: string;
    contactPhone?: string;
    customFields?: Record<string, string>;
    assignedToId?: string;
}

export class LinkFilterDto {
    categoryId?: string;
    status?: LinkStatus;
    tag?: string;
    search?: string;
    sortBy?: LinkSortBy;
    limit?: number;
    offset?: number;
}
