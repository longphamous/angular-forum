export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends" | "blocked";

export interface FriendUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    friendshipId: string;
    friendsSince: string;
}

export interface FriendRequest {
    id: string;
    user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    createdAt: string;
}

export interface FriendshipStatusResult {
    status: FriendshipStatus;
    friendshipId: string | null;
}

export interface MutualFriend {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}
