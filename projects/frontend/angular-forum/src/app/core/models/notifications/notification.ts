export type NotificationType =
    | "new_message"
    | "thread_reply"
    | "post_like"
    | "achievement_unlocked"
    | "level_up"
    | "coins_received"
    | "xp_gained"
    | "mention"
    | "friend_request"
    | "friend_accepted"
    | "system"
    // Moderation
    | "thread_moved"
    | "thread_locked"
    | "thread_title_changed"
    | "post_edited_by_mod"
    | "post_deleted_by_mod"
    | "best_answer_selected"
    // Forum
    | "thread_pinned"
    | "post_quoted"
    // Content modules
    | "blog_comment"
    | "lexicon_comment"
    | "gallery_comment"
    | "gallery_rated"
    | "recipe_comment"
    | "recipe_rated"
    | "clip_liked"
    | "clip_commented"
    // Lotto
    | "lotto_draw_result"
    | "lotto_win"
    // Marketplace
    | "marketplace_offer"
    | "marketplace_offer_accepted"
    | "marketplace_offer_declined"
    // TCG
    | "tcg_trade_offer"
    | "tcg_rare_pull";

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
    level_up: "pi-arrow-up",
    coins_received: "pi-wallet",
    xp_gained: "pi-star",
    mention: "pi-at",
    friend_request: "pi-user-plus",
    friend_accepted: "pi-users",
    system: "pi-info-circle",
    thread_moved: "pi-arrow-right-arrow-left",
    thread_locked: "pi-lock",
    thread_title_changed: "pi-pencil",
    post_edited_by_mod: "pi-pencil",
    post_deleted_by_mod: "pi-trash",
    best_answer_selected: "pi-check-circle",
    thread_pinned: "pi-thumbtack",
    post_quoted: "pi-reply",
    blog_comment: "pi-comment",
    lexicon_comment: "pi-comment",
    gallery_comment: "pi-comment",
    gallery_rated: "pi-star",
    recipe_comment: "pi-comment",
    recipe_rated: "pi-star",
    clip_liked: "pi-heart",
    clip_commented: "pi-comment",
    lotto_draw_result: "pi-ticket",
    lotto_win: "pi-trophy",
    marketplace_offer: "pi-shopping-cart",
    marketplace_offer_accepted: "pi-check",
    marketplace_offer_declined: "pi-times",
    tcg_trade_offer: "pi-arrows-h",
    tcg_rare_pull: "pi-star-fill"
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
    new_message: "text-blue-500",
    thread_reply: "text-indigo-500",
    post_like: "text-red-500",
    achievement_unlocked: "text-yellow-500",
    level_up: "text-purple-500",
    coins_received: "text-green-500",
    xp_gained: "text-purple-500",
    mention: "text-pink-500",
    friend_request: "text-cyan-500",
    friend_accepted: "text-teal-500",
    system: "text-surface-500",
    thread_moved: "text-orange-500",
    thread_locked: "text-orange-500",
    thread_title_changed: "text-orange-500",
    post_edited_by_mod: "text-orange-500",
    post_deleted_by_mod: "text-red-500",
    best_answer_selected: "text-green-500",
    thread_pinned: "text-blue-500",
    post_quoted: "text-indigo-500",
    blog_comment: "text-green-500",
    lexicon_comment: "text-teal-500",
    gallery_comment: "text-cyan-500",
    gallery_rated: "text-yellow-500",
    recipe_comment: "text-orange-500",
    recipe_rated: "text-yellow-500",
    clip_liked: "text-red-500",
    clip_commented: "text-purple-500",
    lotto_draw_result: "text-yellow-500",
    lotto_win: "text-green-500",
    marketplace_offer: "text-blue-500",
    marketplace_offer_accepted: "text-green-500",
    marketplace_offer_declined: "text-red-500",
    tcg_trade_offer: "text-purple-500",
    tcg_rare_pull: "text-yellow-500"
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
    system: "system",
    thread_moved: "system",
    thread_locked: "system",
    thread_title_changed: "system",
    post_edited_by_mod: "system",
    post_deleted_by_mod: "system",
    best_answer_selected: "system",
    thread_pinned: "system",
    post_quoted: "system",
    blog_comment: "system",
    lexicon_comment: "system",
    gallery_comment: "system",
    gallery_rated: "system",
    recipe_comment: "system",
    recipe_rated: "system",
    clip_liked: "system",
    clip_commented: "system",
    lotto_draw_result: "system",
    lotto_win: "system",
    marketplace_offer: "system",
    marketplace_offer_accepted: "system",
    marketplace_offer_declined: "system",
    tcg_trade_offer: "system",
    tcg_rare_pull: "system",
    level_up: "system"
};
