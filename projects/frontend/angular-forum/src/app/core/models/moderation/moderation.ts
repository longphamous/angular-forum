export type ApprovalType = "avatar" | "avatar_url" | "cover" | "signature";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ProfileApproval {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    type: ApprovalType;
    oldValue: string | null;
    newValue: string;
    status: ApprovalStatus;
    reviewedBy: string | null;
    reviewerName: string | null;
    reviewNote: string | null;
    createdAt: string;
    reviewedAt: string | null;
}

export interface PendingStatus {
    avatar: boolean;
    avatar_url: boolean;
    cover: boolean;
    signature: boolean;
}

export interface ModerationStats {
    pending: number;
    approvedToday: number;
    rejectedToday: number;
}

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
    avatar: "moderation.types.avatar",
    avatar_url: "moderation.types.avatarUrl",
    cover: "moderation.types.cover",
    signature: "moderation.types.signature"
};
