import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { User } from "../../models/user/user";

const now = new Date().toISOString();
const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60).toISOString();
const thirtySecondsAgo = new Date(Date.now() - 1000 * 30).toISOString();

const user1: User = {
    id: "u1",
    username: "alice",
    displayName: "Alice",
    avatarUrl: "",
    roles: ["member"],
    reputation: 120,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString()
};

const user2: User = {
    id: "u2",
    username: "bob",
    displayName: "Bob",
    avatarUrl: "",
    roles: ["moderator"],
    reputation: 340,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 500).toISOString()
};

export const mockUsers: Record<string, User> = {
    [user1.id]: user1,
    [user2.id]: user2
};

export const mockPosts: Record<string, Post> = {
    p1: {
        id: "p1",
        threadId: "t1",
        authorId: user1.id,
        content: "Das ist der erste Beitrag. Viel Spaß beim Diskutieren!",
        isFirstPost: true,
        isEdited: false,
        editCount: 0,
        reactionCount: 0,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
    },
    p2: {
        id: "p2",
        threadId: "t1",
        authorId: user2.id,
        content: "Danke! Schön hier zu sein.",
        isFirstPost: false,
        isEdited: false,
        editCount: 0,
        reactionCount: 0,
        createdAt: thirtySecondsAgo,
        updatedAt: thirtySecondsAgo
    }
};

const thread1: Thread = {
    id: "t1",
    forumId: "f1",
    authorId: user1.id,
    title: "Willkommen im Forum!",
    slug: "willkommen-im-forum",
    isPinned: false,
    isLocked: false,
    isSticky: false,
    viewCount: 42,
    replyCount: 1,
    lastPostAt: thirtySecondsAgo,
    lastPostByUserId: user2.id,
    createdAt: oneHourAgo,
    updatedAt: thirtySecondsAgo
};

export const mockThreads: Record<string, Thread> = {
    [thread1.id]: thread1
};

const forum1: Forum = {
    id: "f1",
    categoryId: "c1",
    name: "Allgemeines",
    slug: "allgemeines",
    description: "Diskussionen rund ums Thema",
    position: 1,
    isLocked: false,
    isPrivate: false,
    threadCount: 1,
    postCount: 2,
    lastPostAt: thirtySecondsAgo,
    lastPostByUserId: user2.id,
    createdAt: now,
    updatedAt: now
};

export const mockForums: Record<string, Forum> = {
    [forum1.id]: forum1
};

export const mockCategories: Record<string, ForumCategory> = {
    c1: {
        id: "c1",
        name: "Community",
        slug: "community",
        description: "Hauptbereich für alle Mitglieder",
        position: 1,
        isActive: true,
        forums: [forum1],
        createdAt: now,
        updatedAt: now
    }
};
