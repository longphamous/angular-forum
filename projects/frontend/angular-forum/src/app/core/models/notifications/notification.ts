export type NotificationType =
    | "new_message"
    | "thread_reply"
    | "post_like"
    | "achievement_unlocked"
    | "coins_received"
    | "xp_gained"
    | "mention"
    | "friend_request"
    | "friend_accepted"
    | "system";

export type NotificationCategory = "all" | "friends" | "system";

export interface AppNotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link: string | null;
    isRead: boolean;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
    new_message: "pi-envelope",
    thread_reply: "pi-comment",
    post_like: "pi-heart",
    achievement_unlocked: "pi-trophy",
    coins_received: "pi-wallet",
    xp_gained: "pi-star",
    mention: "pi-at",
    friend_request: "pi-user-plus",
    friend_accepted: "pi-users",
    system: "pi-info-circle"
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
    new_message: "text-blue-500",
    thread_reply: "text-indigo-500",
    post_like: "text-red-500",
    achievement_unlocked: "text-yellow-500",
    coins_received: "text-green-500",
    xp_gained: "text-purple-500",
    mention: "text-pink-500",
    friend_request: "text-cyan-500",
    friend_accepted: "text-teal-500",
    system: "text-surface-500"
};

export const NOTIFICATION_CATEGORY_MAP: Record<NotificationType, NotificationCategory> = {
    new_message: "system",
    thread_reply: "system",
    post_like: "system",
    achievement_unlocked: "system",
    coins_received: "system",
    xp_gained: "system",
    mention: "system",
    friend_request: "friends",
    friend_accepted: "friends",
    system: "system"
};
