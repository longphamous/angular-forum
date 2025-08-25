import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Thread, ThreadSummary } from "../../models/forum/thread";
import { User } from "../../models/user/user";
import { UserSummary } from "../../models/user/user-summary";

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

export const mockUserSummaries: Record<string, UserSummary> = {
    [user1.id]: {
        id: user1.id,
        username: user1.username,
        displayName: user1.displayName,
        avatarUrl: user1.avatarUrl
    },
    [user2.id]: {
        id: user2.id,
        username: user2.username,
        displayName: user2.displayName,
        avatarUrl: user2.avatarUrl
    }
};

// Sample thread with posts
const thread1: Thread = {
    id: "t1",
    title: "Willkommen im Forum!",
    author: mockUserSummaries[user1.id],
    lastPostAt: new Date().toISOString(),
    replyCount: 1,
    content: "Das ist der erste Beitrag. Viel Spaß beim Diskutieren!",
    posts: [
        {
            id: "p1",
            threadId: "t1",
            author: mockUserSummaries[user1.id],
            content: "Das ist der erste Beitrag. Viel Spaß beim Diskutieren!",
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            isEdited: false
        },
        {
            id: "p2",
            threadId: "t1",
            author: mockUserSummaries[user2.id],
            content: "Danke! Schön hier zu sein.",
            createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
            isEdited: false
        }
    ]
};

const threadSummary1 = (): ThreadSummary => ({
    id: thread1.id,
    title: thread1.title,
    author: thread1.author,
    lastPostAt: thread1.lastPostAt,
    replyCount: thread1.replyCount
});

// Forum
const forum1 = {
    id: "f1",
    title: "Allgemeines",
    description: "Diskussionen rund ums Thema",
    categoryId: "c1",
    threadCount: 1,
    postCount: 2,
    latestThread: threadSummary1()
} as Forum;

export const mockThreads: Record<string, Thread> = {
    [thread1.id]: thread1
};

export const mockForums: Record<string, Forum> = {
    [forum1.id]: forum1
};

export const mockCategories: Record<string, ForumCategory> = {
    c1: {
        id: "c1",
        title: "Community",
        description: "Hauptbereich für alle Mitglieder",
        order: 1,
        subforums: [forum1]
    }
};
