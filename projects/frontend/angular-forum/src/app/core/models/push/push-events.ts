/**
 * Push event type constants and payload interfaces (frontend mirror).
 * Must stay in sync with backend push-event.types.ts.
 */

export const PUSH_EVENTS = [
    "notification:new",
    "notification:count",
    "message:new",
    "message:typing",
    "friend:request",
    "friend:accepted",
    "friend:removed",
    "thread:newPost",
    "thread:postEdited",
    "thread:locked",
    "presence:update",
    "achievement:unlocked",
    "quest:completed",
    "level:up",
    "presence:userOnline",
    "presence:userOffline"
] as const;

export type PushEventType = (typeof PUSH_EVENTS)[number];

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface PushNotificationNew {
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    createdAt: string;
}

export interface PushNotificationCount {
    count: number;
}

export interface PushMessageNew {
    conversationId: string;
    messageId: string;
    senderId: string;
    senderName: string;
    preview: string;
    createdAt: string;
}

export interface PushMessageTyping {
    conversationId: string;
    userId: string;
    username: string;
}

export interface PushFriendRequest {
    friendshipId: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface PushFriendAccepted {
    friendshipId: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface PushFriendRemoved {
    userId: string;
}

export interface PushThreadNewPost {
    threadId: string;
    postId: string;
    authorId: string;
    authorName: string;
    preview: string;
}

export interface PushThreadPostEdited {
    threadId: string;
    postId: string;
}

export interface PushThreadLocked {
    threadId: string;
    locked: boolean;
}

export interface PushAchievementUnlocked {
    achievementId: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    xpReward: number;
}

export interface PushQuestCompleted {
    questName: string;
    questIcon: string | null;
    questType: string;
    rewards: { type: string; amount: number }[];
    gloryReward: number;
}

export interface PushLevelUp {
    newLevel: number;
    levelName: string;
    totalXp: number;
}

export interface PushPresenceUserOnline {
    userId: string;
}

export interface PushPresenceUserOffline {
    userId: string;
}
