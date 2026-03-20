export type ActivityType =
    | "thread_created"
    | "post_created"
    | "blog_published"
    | "achievement_unlocked"
    | "level_up"
    | "friend_added"
    | "profile_updated"
    | "lexicon_published";

export interface Activity {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    type: ActivityType;
    title: string;
    description: string | null;
    link: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
    thread_created: "pi-comments",
    post_created: "pi-comment",
    blog_published: "pi-file-edit",
    achievement_unlocked: "pi-trophy",
    level_up: "pi-arrow-up",
    friend_added: "pi-users",
    profile_updated: "pi-user-edit",
    lexicon_published: "pi-book"
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
    thread_created: "text-blue-500",
    post_created: "text-indigo-500",
    blog_published: "text-green-500",
    achievement_unlocked: "text-yellow-500",
    level_up: "text-purple-500",
    friend_added: "text-cyan-500",
    profile_updated: "text-orange-500",
    lexicon_published: "text-teal-500"
};
