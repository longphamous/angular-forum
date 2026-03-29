export type ClanJoinType = "open" | "invite" | "application" | "moderated";
export type ClanStatus = "active" | "inactive" | "disbanded";
export type ClanMemberRole = "owner" | "admin" | "moderator" | "member";

export interface Clan {
    id: string;
    name: string;
    slug: string;
    tag?: string;
    tagColor?: string;
    tagBrackets?: string;
    description?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    ownerId: string;
    ownerName?: string;
    categoryId?: string;
    categoryName?: string;
    joinType: ClanJoinType;
    memberCount: number;
    status: ClanStatus;
    showActivity: boolean;
    showMembers: boolean;
    showComments: boolean;
    applicationTemplate?: string;
    customFields?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface ClanMember {
    id: string;
    clanId: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    role: ClanMemberRole;
    joinedAt: string;
}

export interface ClanApplication {
    id: string;
    clanId: string;
    userId: string;
    userName?: string;
    invitedById?: string;
    invitedByName?: string;
    type: "application" | "invitation";
    message?: string;
    status: "pending" | "accepted" | "declined";
    createdAt: string;
}

export interface ClanPage {
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

export interface ClanComment {
    id: string;
    clanId: string;
    authorId: string;
    authorName?: string;
    content: string;
    createdAt: string;
}

export interface ClanCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    position: number;
    isActive: boolean;
}

export interface PaginatedClans {
    data: Clan[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateClanPayload {
    name: string;
    description: string;
    tag?: string;
    tagColor?: string;
    categoryId?: string;
    joinType?: ClanJoinType;
}

export interface UpdateClanPayload {
    name?: string;
    description?: string;
    tag?: string;
    tagColor?: string;
    joinType?: ClanJoinType;
    status?: ClanStatus;
    showActivity?: boolean;
    showMembers?: boolean;
    showComments?: boolean;
    avatarUrl?: string;
    bannerUrl?: string;
    applicationTemplate?: string;
}
