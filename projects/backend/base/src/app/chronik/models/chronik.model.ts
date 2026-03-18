export type ChronikEntryType = "text" | "image" | "link";
export type ChronikVisibility = "public" | "followers" | "private";

export interface ChronikEntryDto {
    id: string;
    authorId: string;
    authorUsername: string;
    authorDisplayName: string;
    authorAvatar: string | null;
    type: ChronikEntryType;
    content: string;
    imageUrl: string | null;
    linkUrl: string | null;
    linkTitle: string | null;
    linkDescription: string | null;
    linkImageUrl: string | null;
    linkDomain: string | null;
    visibility: ChronikVisibility;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    isHidden: boolean;
    canDelete: boolean;
    createdAt: string;
}

export interface ChronikCommentDto {
    id: string;
    entryId: string;
    authorId: string;
    authorUsername: string;
    authorDisplayName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    likeCount: number;
    isLiked: boolean;
    canDelete: boolean;
    createdAt: string;
    replies: ChronikCommentDto[];
}

export interface ChronikProfileStats {
    entryCount: number;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
}
