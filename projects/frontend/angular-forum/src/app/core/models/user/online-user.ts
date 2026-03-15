export interface OnlineUser {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    lastSeenAt: string;
}

export type OnlineTimeWindow = "today" | "24h";
export type OnlineSort = "lastSeen" | "username";
export type OnlineSortOrder = "asc" | "desc";
export type OnlineDisplayMode = "avatars" | "list";
