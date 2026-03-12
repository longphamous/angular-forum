import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";

export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    roles: string[];
    reputation: number;
    joinedAt: string;
}

const now = new Date().toISOString();
const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60).toISOString();
const thirtySecondsAgo = new Date(Date.now() - 1000 * 30).toISOString();
const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString();

// ── Users (matching seed.sql UUIDs) ──────────────────────────────────────────

const adminUser: User = {
    id: "00000000-0000-0000-0000-000000000001",
    username: "admin",
    displayName: "Aniverse Admin",
    avatarUrl: "",
    roles: ["admin"],
    reputation: 0,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString()
};

const modUser: User = {
    id: "00000000-0000-0000-0000-000000000002",
    username: "sakura_mod",
    displayName: "Sakura",
    avatarUrl: "",
    roles: ["moderator"],
    reputation: 340,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 500).toISOString()
};

const memberUser: User = {
    id: "00000000-0000-0000-0000-000000000003",
    username: "naruto_fan",
    displayName: "NarutoFan99",
    avatarUrl: "",
    roles: ["member"],
    reputation: 120,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString()
};

export const mockUsers: Record<string, User> = {
    [adminUser.id]: adminUser,
    [modUser.id]: modUser,
    [memberUser.id]: memberUser
};

// ── Posts ─────────────────────────────────────────────────────────────────────

export const mockPosts: Record<string, Post> = {
    "40000000-0000-0000-0000-000000000004": {
        id: "40000000-0000-0000-0000-000000000004",
        threadId: "30000000-0000-0000-0000-000000000004",
        authorId: memberUser.id,
        content:
            "<p><strong>Name:</strong> NarutoFan99<br><strong>Wohnort:</strong> München 🥨<br><strong>Lieblings-Anime:</strong> Naruto Shippuden, Attack on Titan, Demon Slayer</p>",
        isFirstPost: true,
        isEdited: false,
        editCount: 0,
        reactionCount: 3,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
    },
    "40000000-0000-0000-0000-000000000005": {
        id: "40000000-0000-0000-0000-000000000005",
        threadId: "30000000-0000-0000-0000-000000000004",
        authorId: modUser.id,
        content:
            "<p>Hey NarutoFan99, herzlich willkommen! 😊 Dem Namen nach zu urteilen bist du ein echter Naruto-Fan!</p>",
        isFirstPost: false,
        isEdited: false,
        editCount: 0,
        reactionCount: 2,
        createdAt: thirtySecondsAgo,
        updatedAt: thirtySecondsAgo
    }
};

// ── Threads ───────────────────────────────────────────────────────────────────

export const mockThreads: Record<string, Thread> = {
    "30000000-0000-0000-0000-000000000004": {
        id: "30000000-0000-0000-0000-000000000004",
        forumId: "20000000-0000-0000-0000-000000000002",
        authorId: memberUser.id,
        title: "Hallo aus München! – NarutoFan99 stellt sich vor",
        slug: "hallo-aus-muenchen-narutofan99-stellt-sich-vor",
        isPinned: false,
        isLocked: false,
        isSticky: false,
        viewCount: 58,
        replyCount: 1,
        lastPostAt: thirtySecondsAgo,
        lastPostByUserId: modUser.id,
        createdAt: oneHourAgo,
        updatedAt: thirtySecondsAgo
    },
    "30000000-0000-0000-0000-000000000003": {
        id: "30000000-0000-0000-0000-000000000003",
        forumId: "20000000-0000-0000-0000-000000000002",
        authorId: adminUser.id,
        title: "Vorlage zur Vorstellung – bitte lesen bevor ihr postet!",
        slug: "vorlage-zur-vorstellung-bitte-lesen-bevor-ihr-postet",
        isPinned: true,
        isLocked: false,
        isSticky: true,
        viewCount: 326,
        replyCount: 0,
        lastPostAt: twoDaysAgo,
        lastPostByUserId: adminUser.id,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    }
};

// ── Forums ────────────────────────────────────────────────────────────────────

const forumAnkuendigungen: Forum = {
    id: "20000000-0000-0000-0000-000000000001",
    categoryId: "10000000-0000-0000-0000-000000000001",
    name: "Ankündigungen & Regeln",
    slug: "ankuendigungen-regeln",
    description: "Offizielle Neuigkeiten und Verhaltensregeln der Community. Nur Admins können hier posten.",
    position: 0,
    isLocked: true,
    isPrivate: false,
    threadCount: 2,
    postCount: 2,
    lastPostAt: twoDaysAgo,
    lastPostByUserId: adminUser.id,
    createdAt: now,
    updatedAt: now
};

const forumVorstellungen: Forum = {
    id: "20000000-0000-0000-0000-000000000002",
    categoryId: "10000000-0000-0000-0000-000000000001",
    name: "Willkommen & Vorstellungen",
    slug: "willkommen-vorstellungen",
    description: "Neu hier? Stell dich vor und lern die Community kennen!",
    position: 1,
    isLocked: false,
    isPrivate: false,
    threadCount: 3,
    postCount: 6,
    lastPostAt: thirtySecondsAgo,
    lastPostByUserId: memberUser.id,
    createdAt: now,
    updatedAt: now
};

const forumSaisonal: Forum = {
    id: "20000000-0000-0000-0000-000000000003",
    categoryId: "10000000-0000-0000-0000-000000000002",
    name: "Saisonale Anime",
    slug: "saisonale-anime",
    description: "Diskussionen zu aktuell laufenden Anime der Saison.",
    position: 0,
    isLocked: false,
    isPrivate: false,
    threadCount: 4,
    postCount: 12,
    lastPostAt: thirtySecondsAgo,
    lastPostByUserId: "00000000-0000-0000-0000-000000000004",
    createdAt: now,
    updatedAt: now
};

const forumKlassiker: Forum = {
    id: "20000000-0000-0000-0000-000000000004",
    categoryId: "10000000-0000-0000-0000-000000000002",
    name: "Klassiker & Empfehlungen",
    slug: "klassiker-empfehlungen",
    description: "Zeitlose Meisterwerke und persönliche Empfehlungen für jeden Geschmack.",
    position: 1,
    isLocked: false,
    isPrivate: false,
    threadCount: 2,
    postCount: 5,
    lastPostAt: twoDaysAgo,
    lastPostByUserId: "00000000-0000-0000-0000-000000000005",
    createdAt: now,
    updatedAt: now
};

const forumManga: Forum = {
    id: "20000000-0000-0000-0000-000000000005",
    categoryId: "10000000-0000-0000-0000-000000000002",
    name: "Manga-Diskussion",
    slug: "manga-diskussion",
    description: "Alles rund um Manga – Releases, Adaptionen und Lieblingswerke.",
    position: 2,
    isLocked: false,
    isPrivate: false,
    threadCount: 2,
    postCount: 4,
    lastPostAt: twoDaysAgo,
    lastPostByUserId: memberUser.id,
    createdAt: now,
    updatedAt: now
};

const forumGaming: Forum = {
    id: "20000000-0000-0000-0000-000000000006",
    categoryId: "10000000-0000-0000-0000-000000000003",
    name: "Gaming & Technik",
    slug: "gaming-technik",
    description: "Videospiele, Hardware, Software und alles was mit Technik zu tun hat.",
    position: 0,
    isLocked: false,
    isPrivate: false,
    threadCount: 2,
    postCount: 5,
    lastPostAt: twoDaysAgo,
    lastPostByUserId: "00000000-0000-0000-0000-000000000004",
    createdAt: now,
    updatedAt: now
};

const forumPlauderecke: Forum = {
    id: "20000000-0000-0000-0000-000000000007",
    categoryId: "10000000-0000-0000-0000-000000000003",
    name: "Plauderecke",
    slug: "plauderecke",
    description: "Smalltalk, Memes, Witze – alles erlaubt was nicht gegen die Regeln verstößt.",
    position: 1,
    isLocked: false,
    isPrivate: false,
    threadCount: 2,
    postCount: 4,
    lastPostAt: oneHourAgo,
    lastPostByUserId: "00000000-0000-0000-0000-000000000005",
    createdAt: now,
    updatedAt: now
};

export const mockForums: Record<string, Forum> = {
    [forumAnkuendigungen.id]: forumAnkuendigungen,
    [forumVorstellungen.id]: forumVorstellungen,
    [forumSaisonal.id]: forumSaisonal,
    [forumKlassiker.id]: forumKlassiker,
    [forumManga.id]: forumManga,
    [forumGaming.id]: forumGaming,
    [forumPlauderecke.id]: forumPlauderecke
};

// ── Categories ────────────────────────────────────────────────────────────────

export const mockCategories: Record<string, ForumCategory> = {
    "10000000-0000-0000-0000-000000000001": {
        id: "10000000-0000-0000-0000-000000000001",
        name: "Allgemein",
        slug: "allgemein",
        description: "Informationen rund um Aniverse – Ankündigungen, Regeln und Vorstellungen.",
        position: 0,
        isActive: true,
        forums: [forumAnkuendigungen, forumVorstellungen],
        createdAt: now,
        updatedAt: now
    },
    "10000000-0000-0000-0000-000000000002": {
        id: "10000000-0000-0000-0000-000000000002",
        name: "Anime & Manga",
        slug: "anime-manga",
        description: "Alles über Anime und Manga – von aktuellen Saisonstarts bis hin zu zeitlosen Klassikern.",
        position: 1,
        isActive: true,
        forums: [forumSaisonal, forumKlassiker, forumManga],
        createdAt: now,
        updatedAt: now
    },
    "10000000-0000-0000-0000-000000000003": {
        id: "10000000-0000-0000-0000-000000000003",
        name: "Off-Topic",
        slug: "off-topic",
        description: "Themen abseits von Anime und Manga – Gaming, Technik, Smalltalk und mehr.",
        position: 2,
        isActive: true,
        forums: [forumGaming, forumPlauderecke],
        createdAt: now,
        updatedAt: now
    }
};
