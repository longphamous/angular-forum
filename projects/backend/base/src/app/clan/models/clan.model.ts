import type { ClanJoinType, ClanStatus } from "../entities/clan.entity";
import type { ClanApplicationStatus, ClanApplicationType } from "../entities/clan-application.entity";
import type { ClanMemberRole } from "../entities/clan-member.entity";

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface ClanDto {
    id: string;
    categoryId?: string;
    categoryName?: string;
    name: string;
    slug: string;
    tag?: string;
    tagColor: string;
    tagBrackets: string;
    description?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    ownerId: string;
    ownerName?: string;
    joinType: ClanJoinType;
    memberCount: number;
    showActivity: boolean;
    showMembers: boolean;
    showComments: boolean;
    applicationTemplate?: string;
    customFields?: Record<string, unknown>;
    status: ClanStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ClanListItemDto {
    id: string;
    name: string;
    slug: string;
    tag?: string;
    tagColor: string;
    tagBrackets: string;
    description?: string;
    avatarUrl?: string;
    categoryId?: string;
    categoryName?: string;
    joinType: ClanJoinType;
    memberCount: number;
    status: ClanStatus;
    createdAt: string;
}

export interface ClanMemberDto {
    id: string;
    clanId: string;
    userId: string;
    userName?: string;
    role: ClanMemberRole;
    joinedAt: string;
}

export interface ClanApplicationDto {
    id: string;
    clanId: string;
    userId: string;
    userName?: string;
    invitedById?: string;
    invitedByName?: string;
    type: ClanApplicationType;
    message?: string;
    status: ClanApplicationStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ClanPageDto {
    id: string;
    clanId: string;
    title: string;
    slug: string;
    content?: string;
    position: number;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ClanCommentDto {
    id: string;
    clanId: string;
    authorId: string;
    authorName?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClanCategoryDto {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    position: number;
    isActive: boolean;
    clanCount: number;
}
