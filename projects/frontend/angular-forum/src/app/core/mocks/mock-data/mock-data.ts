import { Anime, AnimeListEntry, AnimeListStatus } from "../../models/anime/anime";
import { BlogCategory, BlogComment, BlogPost, BlogPostDetail } from "../../models/blog/blog";
import { CalendarEvent, CalendarEventDetail } from "../../models/calendar/calendar";
import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { GalleryAlbum, GalleryAlbumDetail, GalleryComment, GalleryMedia } from "../../models/gallery/gallery";
import { Achievement, UserAchievement } from "../../models/gamification/achievement";
import { Group, PagePermission } from "../../models/group/group";
import { DrawScheduleConfig, LottoDraw, LottoResult, LottoStats, LottoTicket } from "../../models/lotto/lotto";
import {
    MarketCategory,
    MarketComment,
    MarketListing,
    MarketOffer,
    MarketRating,
    MarketReport
} from "../../models/marketplace/marketplace";
import { Conversation, ConversationDetail, Draft } from "../../models/messages/messages";
import { AppNotification } from "../../models/notifications/notification";
import { ShopItem, UserInventoryItem } from "../../models/shop/shop";
import { TeaserSlide } from "../../models/slideshow/teaser-slide";
import { OnlineUser } from "../../models/user/online-user";
import { UserProfile } from "../../models/user/user";
import { CoinEarnConfig, Wallet, WalletTransaction } from "../../models/wallet/wallet";

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

// ── Mock Groups ───────────────────────────────────────────────────────────────

export const mockGroups: Record<string, Group> = {
    "g-jeder": {
        id: "g-jeder",
        name: "Jeder",
        description: "Alle Besucher und registrierten Benutzer",
        isSystem: true,
        userCount: 3,
        createdAt: now,
        updatedAt: now
    },
    "g-gast": {
        id: "g-gast",
        name: "Gast",
        description: "Nicht angemeldete Besucher",
        isSystem: true,
        userCount: 0,
        createdAt: now,
        updatedAt: now
    },
    "g-registered": {
        id: "g-registered",
        name: "Registrierte Benutzer",
        description: "Alle angemeldeten Benutzer",
        isSystem: true,
        userCount: 3,
        createdAt: now,
        updatedAt: now
    },
    "g-moderator": {
        id: "g-moderator",
        name: "Moderator",
        description: "Moderatoren mit erweiterten Rechten",
        isSystem: true,
        userCount: 1,
        createdAt: now,
        updatedAt: now
    },
    "g-admin": {
        id: "g-admin",
        name: "Admin",
        description: "Administratoren mit vollen Rechten",
        isSystem: true,
        userCount: 1,
        createdAt: now,
        updatedAt: now
    }
};

// Maps userId → group ids
export const mockUserGroupMap: Record<string, string[]> = {
    [adminUser.id]: ["g-jeder", "g-registered", "g-admin"],
    [modUser.id]: ["g-jeder", "g-registered", "g-moderator"],
    [memberUser.id]: ["g-jeder", "g-registered"]
};

// ── Mock Page Permissions ─────────────────────────────────────────────────────

export const mockPagePermissions: Record<string, PagePermission> = {
    "pp-dashboard": {
        id: "pp-dashboard",
        route: "/dashboard",
        name: "Dashboard",
        groups: [{ id: "g-registered", name: "Registrierte Benutzer" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-forum": {
        id: "pp-forum",
        route: "/forum",
        name: "Forum Übersicht",
        groups: [{ id: "g-registered", name: "Registrierte Benutzer" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-anime-top": {
        id: "pp-anime-top",
        route: "/anime-top-list",
        name: "Top Anime Liste",
        groups: [{ id: "g-registered", name: "Registrierte Benutzer" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-anime-db": {
        id: "pp-anime-db",
        route: "/anime-database",
        name: "Anime Datenbank",
        groups: [{ id: "g-registered", name: "Registrierte Benutzer" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-anime-mylist": {
        id: "pp-anime-mylist",
        route: "/anime/my-list",
        name: "Meine Anime-Liste",
        groups: [{ id: "g-registered", name: "Registrierte Benutzer" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-profile": {
        id: "pp-profile",
        route: "/profile",
        name: "Profil",
        groups: [{ id: "g-registered", name: "Registrierte Benutzer" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-overview": {
        id: "pp-admin-overview",
        route: "/admin/overview",
        name: "Admin Übersicht",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-forum": {
        id: "pp-admin-forum",
        route: "/admin/forum",
        name: "Admin Forenstruktur",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-users": {
        id: "pp-admin-users",
        route: "/admin/users",
        name: "Admin Benutzerverwaltung",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-groups": {
        id: "pp-admin-groups",
        route: "/admin/groups",
        name: "Admin Gruppenverwaltung",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-permissions": {
        id: "pp-admin-permissions",
        route: "/admin/permissions",
        name: "Admin Seitenberechtigungen",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-gamification": {
        id: "pp-admin-gamification",
        route: "/admin/gamification",
        name: "Admin Gamification",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    },
    "pp-admin-achievements": {
        id: "pp-admin-achievements",
        route: "/admin/achievements",
        name: "Admin Achievements",
        groups: [{ id: "g-admin", name: "Admin" }],
        createdAt: now,
        updatedAt: now
    }
};

// ── UserProfiles (for admin user management) ──────────────────────────────────

export const mockUserProfiles: Record<string, UserProfile> = {
    [adminUser.id]: {
        bio: "Administrator des Aniverse Forums.",
        createdAt: adminUser.joinedAt,
        displayName: adminUser.displayName,
        email: "admin@aniverse.de",
        groups: ["Jeder", "Registrierte Benutzer", "Admin"],
        id: adminUser.id,
        postCount: 128,
        level: 5,
        levelName: "Erfahrener Nutzer",
        xp: 1280,
        xpToNextLevel: 220,
        xpProgressPercent: 56,
        role: "admin",
        status: "active",
        username: adminUser.username
    },
    [modUser.id]: {
        bio: "",
        createdAt: modUser.joinedAt,
        displayName: modUser.displayName,
        email: "sakura@aniverse.de",
        groups: ["Jeder", "Registrierte Benutzer", "Moderator"],
        id: modUser.id,
        postCount: 340,
        level: 7,
        levelName: "Experte",
        xp: 2350,
        xpToNextLevel: 450,
        xpProgressPercent: 19,
        role: "moderator",
        signature: "Moderatorin von Aniverse | Bei Fragen oder Problemen gerne eine PN schreiben.",
        status: "active",
        username: modUser.username
    },
    [memberUser.id]: {
        bio: "",
        createdAt: memberUser.joinedAt,
        displayName: memberUser.displayName,
        email: "naruto_fan@example.com",
        groups: ["Jeder", "Registrierte Benutzer"],
        id: memberUser.id,
        postCount: 42,
        level: 3,
        levelName: "Mitglied",
        xp: 420,
        xpToNextLevel: 180,
        xpProgressPercent: 40,
        role: "member",
        signature: '"Ich werde nicht aufgeben, das ist mein Ninja-Weg!" – Naruto',
        status: "active",
        username: memberUser.username
    }
};

// ── Posts ─────────────────────────────────────────────────────────────────────

export const mockPosts: Record<string, Post> = {
    "40000000-0000-0000-0000-000000000004": {
        id: "40000000-0000-0000-0000-000000000004",
        threadId: "30000000-0000-0000-0000-000000000004",
        authorId: memberUser.id,
        authorName: memberUser.displayName,
        authorRole: "member",
        authorPostCount: 42,
        authorLevel: 3,
        authorLevelName: "Mitglied",
        authorSignature: '"Ich werde nicht aufgeben, das ist mein Ninja-Weg!" – Naruto',
        content:
            "<p><strong>Name:</strong> NarutoFan99<br><strong>Wohnort:</strong> München 🥨<br><strong>Lieblings-Anime:</strong> Naruto Shippuden, Attack on Titan, Demon Slayer</p>",
        isFirstPost: true,
        isBestAnswer: false,
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
        authorName: modUser.displayName,
        authorRole: "moderator",
        authorPostCount: 340,
        authorLevel: 7,
        authorLevelName: "Experte",
        authorSignature: "Moderatorin von Aniverse | Bei Fragen oder Problemen gerne eine PN schreiben.",
        content:
            "<p>Hey NarutoFan99, herzlich willkommen! 😊 Dem Namen nach zu urteilen bist du ein echter Naruto-Fan!</p>",
        isFirstPost: false,
        isBestAnswer: false,
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
        authorName: memberUser.displayName,
        authorLevel: 3,
        authorLevelName: "Mitglied",
        title: "Hallo aus München! – NarutoFan99 stellt sich vor",
        slug: "hallo-aus-muenchen-narutofan99-stellt-sich-vor",
        tags: ["vorstellung", "münchen"],
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
        authorName: adminUser.displayName,
        authorLevel: 5,
        authorLevelName: "Erfahrener Nutzer",
        tags: ["wichtig", "vorlage"],
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

// ── Anime Mock Detail Objects ─────────────────────────────────────────────────

export const mockAnimeDetails: Record<number, Anime> = {
    1: {
        id: 1,
        title: "Cowboy Bebop",
        titleEnglish: "Cowboy Bebop",
        titleJapanese: "カウボーイビバップ",
        picture: "https://cdn.myanimelist.net/images/anime/4/19644l.jpg",
        synopsis:
            "In the year 2071, humanity has colonized several planets and moons of the solar system leaving the now uninhabitable surface of planet Earth behind. The Inter Solar System Police attempts to keep peace in the galaxy, aided in part by outlaw bounty hunters, referred to as 'Cowboys'. The ragtag team aboard the spaceship Bebop—Spike Spiegel, Jet Black, Faye Valentine, Edward Wong, and their corgi Ein—are searching the galaxy for bounties to pay the bills.",
        type: "TV",
        status: "Finished Airing",
        episode: 26,
        mean: 8.78,
        rank: 28,
        popularity: 42,
        member: 857439,
        voter: 566234,
        seasonYear: 1998,
        season: "spring",
        rating: "R",
        source: "Original",
        startYear: 1998,
        startMonth: 4,
        startDay: 3,
        endYear: 1999,
        endMonth: 4,
        endDay: 24,
        broadcastDay: "Saturday",
        broadcastTime: "18:00",
        episodeDuration: 24,
        genres: ["Action", "Adult Cast", "Award Winning", "Sci-Fi", "Space"]
    },
    5114: {
        id: 5114,
        title: "Fullmetal Alchemist: Brotherhood",
        titleEnglish: "Fullmetal Alchemist: Brotherhood",
        titleJapanese: "鋼の錬金術師 FULLMETAL ALCHEMIST",
        picture: "https://cdn.myanimelist.net/images/anime/1208/94745l.jpg",
        synopsis:
            "After a horrific alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic situation. Ignoring the taboo of human transmutation, the brothers attempted to bring their deceased mother back to life.",
        type: "TV",
        status: "Finished Airing",
        episode: 64,
        mean: 9.1,
        rank: 1,
        popularity: 3,
        member: 3300000,
        voter: 2000000,
        seasonYear: 2009,
        season: "spring",
        rating: "R",
        source: "Manga",
        startYear: 2009,
        startMonth: 4,
        startDay: 5,
        endYear: 2010,
        endMonth: 7,
        endDay: 4,
        episodeDuration: 24,
        genres: ["Action", "Adventure", "Drama", "Fantasy", "Military", "Shounen"]
    },
    9253: {
        id: 9253,
        title: "Steins;Gate",
        titleEnglish: "Steins;Gate",
        titleJapanese: "シュタインズ・ゲート",
        picture: "https://cdn.myanimelist.net/images/anime/5/73199l.jpg",
        synopsis:
            "The self-proclaimed mad scientist Rintarou Okabe rents out a room in a rickety old building in Akihabara where he indulges himself in his hobby of inventing 'future gadgets' with fellow lab members.",
        type: "TV",
        status: "Finished Airing",
        episode: 24,
        mean: 9.07,
        rank: 3,
        popularity: 7,
        member: 2800000,
        voter: 1700000,
        seasonYear: 2011,
        season: "spring",
        rating: "PG-13",
        source: "Visual novel",
        startYear: 2011,
        startMonth: 4,
        startDay: 6,
        endYear: 2011,
        endMonth: 9,
        endDay: 14,
        episodeDuration: 23,
        genres: ["Drama", "Psychological", "Sci-Fi", "Suspense", "Time Travel"]
    }
};

// ── Anime List (mutable, per user) ────────────────────────────────────────────

// key: `${userId}:${animeId}`
export const mockAnimeListStore: Record<string, AnimeListEntry> = {
    ["00000000-0000-0000-0000-000000000003:5114"]: {
        animeId: 5114,
        userId: "00000000-0000-0000-0000-000000000003",
        status: "completed" as AnimeListStatus,
        score: 10,
        review: "Absolutes Meisterwerk! Eine der besten Anime-Serien aller Zeiten.",
        episodesWatched: 64,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
        anime: mockAnimeDetails[5114]
    },
    ["00000000-0000-0000-0000-000000000003:1"]: {
        animeId: 1,
        userId: "00000000-0000-0000-0000-000000000003",
        status: "completed" as AnimeListStatus,
        score: 9,
        review: "Klassiker! Die Musik und Atmosphäre sind unübertroffen.",
        episodesWatched: 26,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
        anime: mockAnimeDetails[1]
    },
    ["00000000-0000-0000-0000-000000000003:9253"]: {
        animeId: 9253,
        userId: "00000000-0000-0000-0000-000000000003",
        status: "plan_to_watch" as AnimeListStatus,
        episodesWatched: 0,
        createdAt: now,
        updatedAt: now,
        anime: mockAnimeDetails[9253]
    }
};

// ── Achievements ───────────────────────────────────────────────────────────────

export const mockAchievements: Record<string, Achievement> = {
    "ach-001": {
        id: "ach-001",
        key: "first_post",
        name: "Erster Schritt",
        description: "Schreibe deinen ersten Beitrag",
        icon: "pi pi-comment",
        rarity: "bronze",
        triggerType: "post_count",
        triggerValue: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-002": {
        id: "ach-002",
        key: "active_writer",
        name: "Aktiver Schreiber",
        description: "Schreibe 10 Beiträge",
        icon: "pi pi-pencil",
        rarity: "silver",
        triggerType: "post_count",
        triggerValue: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-003": {
        id: "ach-003",
        key: "prolific_writer",
        name: "Vielschreiber",
        description: "Schreibe 50 Beiträge",
        icon: "pi pi-file-edit",
        rarity: "gold",
        triggerType: "post_count",
        triggerValue: 50,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-004": {
        id: "ach-004",
        key: "posting_legend",
        name: "Posting-Legende",
        description: "Schreibe 100 Beiträge",
        icon: "pi pi-crown",
        rarity: "platinum",
        triggerType: "post_count",
        triggerValue: 100,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-005": {
        id: "ach-005",
        key: "thread_starter",
        name: "Themen-Starter",
        description: "Erstelle deinen ersten Thread",
        icon: "pi pi-plus-circle",
        rarity: "bronze",
        triggerType: "thread_count",
        triggerValue: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-006": {
        id: "ach-006",
        key: "discussion_pro",
        name: "Diskussionsprofi",
        description: "Erstelle 10 Threads",
        icon: "pi pi-sitemap",
        rarity: "silver",
        triggerType: "thread_count",
        triggerValue: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-007": {
        id: "ach-007",
        key: "first_reaction",
        name: "Beliebter Beitrag",
        description: "Erhalte deine erste Reaktion",
        icon: "pi pi-heart-fill",
        rarity: "bronze",
        triggerType: "reaction_received_count",
        triggerValue: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-008": {
        id: "ach-008",
        key: "community_star",
        name: "Community-Star",
        description: "Erhalte 10 Reaktionen",
        icon: "pi pi-star-fill",
        rarity: "silver",
        triggerType: "reaction_received_count",
        triggerValue: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-009": {
        id: "ach-009",
        key: "fan_favorite",
        name: "Fan-Liebling",
        description: "Erhalte 50 Reaktionen",
        icon: "pi pi-star",
        rarity: "gold",
        triggerType: "reaction_received_count",
        triggerValue: 50,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-010": {
        id: "ach-010",
        key: "generous_reactor",
        name: "Reaktionskönig",
        description: "Reagiere auf 10 Beiträge",
        icon: "pi pi-heart",
        rarity: "bronze",
        triggerType: "reaction_given_count",
        triggerValue: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-011": {
        id: "ach-011",
        key: "level_5",
        name: "Aufsteiger",
        description: "Erreiche Level 5",
        icon: "pi pi-chart-line",
        rarity: "silver",
        triggerType: "level_reached",
        triggerValue: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-012": {
        id: "ach-012",
        key: "level_8",
        name: "Veteranenstatus",
        description: "Erreiche Level 8",
        icon: "pi pi-shield",
        rarity: "gold",
        triggerType: "level_reached",
        triggerValue: 8,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    "ach-013": {
        id: "ach-013",
        key: "level_10",
        name: "Legende",
        description: "Erreiche Level 10",
        icon: "pi pi-crown",
        rarity: "platinum",
        triggerType: "level_reached",
        triggerValue: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now
    }
};

// User achievements (userId → earned achievements)
export const mockUserAchievements: Record<string, UserAchievement[]> = {
    // Admin (level 5): first_post, thread_starter, first_reaction, active_writer, level_5
    "00000000-0000-0000-0000-000000000001": [
        { ...mockAchievements["ach-001"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-005"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-007"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-002"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-011"], earnedAt: twoDaysAgo }
    ],
    // Mod (level 7): first_post, thread_starter, active_writer, first_reaction, community_star, prolific_writer, level_5
    "00000000-0000-0000-0000-000000000002": [
        { ...mockAchievements["ach-001"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-005"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-002"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-007"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-008"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-003"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-011"], earnedAt: twoDaysAgo }
    ],
    // Member (level 3): first_post, thread_starter, first_reaction
    "00000000-0000-0000-0000-000000000003": [
        { ...mockAchievements["ach-001"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-005"], earnedAt: twoDaysAgo },
        { ...mockAchievements["ach-007"], earnedAt: twoDaysAgo }
    ]
};

// ── Wallets ───────────────────────────────────────────────────────────────────

export const mockWallets: Record<string, Wallet> = {
    "00000000-0000-0000-0000-000000000001": {
        id: "wallet-001",
        userId: "00000000-0000-0000-0000-000000000001",
        balance: 850,
        createdAt: twoDaysAgo,
        updatedAt: now
    },
    "00000000-0000-0000-0000-000000000002": {
        id: "wallet-002",
        userId: "00000000-0000-0000-0000-000000000002",
        balance: 1340,
        createdAt: twoDaysAgo,
        updatedAt: now
    },
    "00000000-0000-0000-0000-000000000003": {
        id: "wallet-003",
        userId: "00000000-0000-0000-0000-000000000003",
        balance: 210,
        createdAt: twoDaysAgo,
        updatedAt: now
    }
};

export const mockWalletTransactions: Record<string, WalletTransaction[]> = {
    "00000000-0000-0000-0000-000000000001": [
        {
            id: "tx-a1",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000001",
            amount: 500,
            type: "deposit",
            description: "Willkommensbonus",
            createdAt: twoDaysAgo
        },
        {
            id: "tx-a2",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000001",
            amount: 5,
            type: "reward",
            description: "Coins für neuen Beitrag",
            createdAt: oneHourAgo
        },
        {
            id: "tx-a3",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000001",
            amount: 5,
            type: "reward",
            description: "Coins für neuen Beitrag",
            createdAt: now
        }
    ],
    "00000000-0000-0000-0000-000000000002": [
        {
            id: "tx-b1",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000002",
            amount: 500,
            type: "deposit",
            description: "Willkommensbonus",
            createdAt: twoDaysAgo
        },
        {
            id: "tx-b2",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000002",
            amount: 200,
            type: "reward",
            description: "Moderator-Belohnung",
            createdAt: twoDaysAgo
        },
        {
            id: "tx-b3",
            fromUserId: "00000000-0000-0000-0000-000000000001",
            toUserId: "00000000-0000-0000-0000-000000000002",
            amount: 100,
            type: "transfer",
            description: "Danke für deine Hilfe!",
            createdAt: oneHourAgo
        },
        {
            id: "tx-b4",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000002",
            amount: 2,
            type: "reward",
            description: "Coins für erhaltene Reaktion",
            createdAt: now
        }
    ],
    "00000000-0000-0000-0000-000000000003": [
        {
            id: "tx-c1",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000003",
            amount: 200,
            type: "deposit",
            description: "Willkommensbonus",
            createdAt: twoDaysAgo
        },
        {
            id: "tx-c2",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000003",
            amount: 5,
            type: "reward",
            description: "Coins für neuen Beitrag",
            createdAt: oneHourAgo
        },
        {
            id: "tx-c3",
            fromUserId: null,
            toUserId: "00000000-0000-0000-0000-000000000003",
            amount: 2,
            type: "reward",
            description: "Coins für erhaltene Reaktion",
            createdAt: thirtySecondsAgo
        }
    ]
};

// ── Teaser Slideshow mock data ────────────────────────────────────────────────

export const mockSlides: TeaserSlide[] = [
    {
        id: "slide-1",
        title: "Willkommen bei Aniverse",
        description: "Deine Community für Anime, Manga & Forum-Diskussionen.",
        translations: {
            en: { title: "Welcome to Aniverse", description: "Your community for anime, manga & forum discussions." }
        },
        imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=400&fit=crop",
        linkUrl: "/forum",
        linkLabel: "Zum Forum",
        linkFullSlide: false,
        textStyle: "overlay",
        textAlign: "left",
        isActive: true,
        sortOrder: 0,
        validFrom: null,
        validUntil: null,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "slide-2",
        title: "Top Anime entdecken",
        description: "Durchsuche unsere Anime-Datenbank und finde deinen nächsten Lieblings-Anime.",
        translations: {
            en: { title: "Discover Top Anime", description: "Browse our anime database and find your next favourite." }
        },
        imageUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=1200&h=400&fit=crop",
        linkUrl: "/anime-top-list",
        linkLabel: "Jetzt entdecken",
        linkFullSlide: true,
        textStyle: "glass",
        textAlign: "center",
        isActive: true,
        sortOrder: 1,
        validFrom: null,
        validUntil: null,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "slide-3",
        title: "Dein Guthaben wächst",
        description: "Schreibe Beiträge, erhalte Reaktionen und sammle Coins für deine Aktivität.",
        translations: {
            en: {
                title: "Your balance grows",
                description: "Write posts, receive reactions and collect coins for your activity."
            }
        },
        imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=400&fit=crop",
        linkUrl: "/profile",
        linkLabel: "Mein Profil",
        linkFullSlide: false,
        textStyle: "glass",
        textAlign: "left",
        isActive: true,
        sortOrder: 2,
        validFrom: null,
        validUntil: null,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    }
];

// ── Online Users mock data ────────────────────────────────────────────────────

export const mockOnlineUsers: OnlineUser[] = [
    {
        userId: "00000000-0000-0000-0000-000000000001",
        username: "admin",
        displayName: "Aniverse Admin",
        avatarUrl: null,
        lastSeenAt: now
    },
    {
        userId: "00000000-0000-0000-0000-000000000002",
        username: "sakura_mod",
        displayName: "Sakura",
        avatarUrl: null,
        lastSeenAt: thirtySecondsAgo
    },
    {
        userId: "00000000-0000-0000-0000-000000000003",
        username: "naruto_fan",
        displayName: "Naruto Fan",
        avatarUrl: null,
        lastSeenAt: oneHourAgo
    }
];

// ── Virtual Shop ──────────────────────────────────────────────────────────────

export const mockShopItems: ShopItem[] = [
    {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "VIP Badge",
        description: "Zeige deinen Status mit einem exklusiven VIP-Abzeichen in deinem Profil.",
        price: 500,
        imageUrl: null,
        icon: "pi pi-verified",
        category: "Titel",
        isActive: true,
        stock: null,
        maxPerUser: 1,
        sortOrder: 0,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "a0000000-0000-0000-0000-000000000002",
        name: "Animu-Meister Titel",
        description: "Der ultimative Titel für wahre Anime-Kenner.",
        price: 1000,
        imageUrl: null,
        icon: "pi pi-star-fill",
        category: "Titel",
        isActive: true,
        stock: 50,
        maxPerUser: 1,
        sortOrder: 1,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "a0000000-0000-0000-0000-000000000003",
        name: "Profilrahmen – Gold",
        description: "Ein goldener Rahmen für deinen Avatar.",
        price: 250,
        imageUrl: null,
        icon: "pi pi-circle-fill",
        category: "Kosmetik",
        isActive: true,
        stock: null,
        maxPerUser: null,
        sortOrder: 2,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "a0000000-0000-0000-0000-000000000004",
        name: "Geheimpaket",
        description: "Ein mysteriöses Paket – was wird darin sein?",
        price: 100,
        imageUrl: null,
        icon: "pi pi-gift",
        category: "Sonstiges",
        isActive: true,
        stock: 10,
        maxPerUser: 3,
        sortOrder: 3,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    }
];

export const mockUserInventory: UserInventoryItem[] = [
    {
        id: "b0000000-0000-0000-0000-000000000001",
        userId: "00000000-0000-0000-0000-000000000001",
        itemId: "a0000000-0000-0000-0000-000000000003",
        item: mockShopItems[2]!,
        quantity: 1,
        purchasedAt: twoDaysAgo
    }
];

// ── Calendar Events ───────────────────────────────────────────────────────────

const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const _nextWeekEnd = new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const _tomorrowEnd = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const mockCalendarEvents: CalendarEvent[] = [
    {
        id: "c0000000-0000-0000-0000-000000000001",
        title: "Anime Movie Night",
        description: "Wir schauen zusammen die neuesten Anime-Filme! Snacks bitte mitbringen.",
        location: "Discord – Aniverse Lounge",
        startDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 20, 0).toISOString(),
        endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 23, 0).toISOString(),
        allDay: false,
        isPublic: true,
        maxAttendees: 20,
        createdByUserId: "00000000-0000-0000-0000-000000000001",
        createdByDisplayName: "Aniverse Admin",
        threadId: null,
        recurrenceRule: null,
        color: "purple",
        attendeeCount: 3,
        acceptedCount: 2,
        myStatus: "accepted",
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "c0000000-0000-0000-0000-000000000002",
        title: "Community Meeting",
        description: "Monatliches Treffen der Community-Moderatoren. Tagesordnung: neue Regeln, Feedback-Runden.",
        location: "Discord – Moderatoren-Kanal",
        startDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0).toISOString(),
        endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 19, 30).toISOString(),
        allDay: false,
        isPublic: false,
        maxAttendees: null,
        createdByUserId: "00000000-0000-0000-0000-000000000002",
        createdByDisplayName: "Sakura",
        threadId: null,
        recurrenceRule: { frequency: "monthly", interval: 1 },
        color: "blue",
        attendeeCount: 2,
        acceptedCount: 2,
        myStatus: "accepted",
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "c0000000-0000-0000-0000-000000000003",
        title: "Manga-Lesekreis",
        description: "Diesen Monat lesen wir Attack on Titan Band 1-5.",
        location: "Online – Jitsi Meet",
        startDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate(), 16, 0).toISOString(),
        endDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate(), 18, 0).toISOString(),
        allDay: false,
        isPublic: true,
        maxAttendees: 15,
        createdByUserId: "00000000-0000-0000-0000-000000000003",
        createdByDisplayName: "Naruto Fan",
        threadId: null,
        recurrenceRule: { frequency: "weekly", interval: 2, byDay: ["SA"] },
        color: "green",
        attendeeCount: 1,
        acceptedCount: 0,
        myStatus: null,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    }
];

export const mockCalendarEventDetails = new Map<string, CalendarEventDetail>([
    [
        "c0000000-0000-0000-0000-000000000001",
        {
            ...mockCalendarEvents[0]!,
            attendees: [
                {
                    id: "att-1",
                    userId: "00000000-0000-0000-0000-000000000001",
                    displayName: "Aniverse Admin",
                    username: "admin",
                    status: "accepted",
                    companions: 0,
                    declineReason: null,
                    respondedAt: twoDaysAgo
                },
                {
                    id: "att-2",
                    userId: "00000000-0000-0000-0000-000000000002",
                    displayName: "Sakura",
                    username: "sakura_mod",
                    status: "accepted",
                    companions: 1,
                    declineReason: null,
                    respondedAt: twoDaysAgo
                },
                {
                    id: "att-3",
                    userId: "00000000-0000-0000-0000-000000000003",
                    displayName: "Naruto Fan",
                    username: "naruto_fan",
                    status: "pending",
                    companions: 0,
                    declineReason: null,
                    respondedAt: null
                }
            ]
        }
    ],
    [
        "c0000000-0000-0000-0000-000000000002",
        {
            ...mockCalendarEvents[1]!,
            attendees: [
                {
                    id: "att-4",
                    userId: "00000000-0000-0000-0000-000000000001",
                    displayName: "Aniverse Admin",
                    username: "admin",
                    status: "accepted",
                    companions: 0,
                    declineReason: null,
                    respondedAt: twoDaysAgo
                },
                {
                    id: "att-5",
                    userId: "00000000-0000-0000-0000-000000000002",
                    displayName: "Sakura",
                    username: "sakura_mod",
                    status: "accepted",
                    companions: 0,
                    declineReason: null,
                    respondedAt: twoDaysAgo
                }
            ]
        }
    ],
    [
        "c0000000-0000-0000-0000-000000000003",
        {
            ...mockCalendarEvents[2]!,
            attendees: [
                {
                    id: "att-6",
                    userId: "00000000-0000-0000-0000-000000000003",
                    displayName: "Naruto Fan",
                    username: "naruto_fan",
                    status: "pending",
                    companions: 0,
                    declineReason: null,
                    respondedAt: null
                }
            ]
        }
    ]
]);

// ── Lotto ─────────────────────────────────────────────────────────────────────

export const mockLottoConfig: DrawScheduleConfig = {
    drawDays: [6],
    drawHourUtc: 19,
    drawMinuteUtc: 0,
    baseJackpot: 1_000_000,
    rolloverPercentage: 50,
    ticketCost: 2
};

export const mockLottoDraws: LottoDraw[] = [
    {
        id: "draw-2026-02-28",
        drawDate: "2026-02-28T19:00:00.000Z",
        winningNumbers: [7, 14, 22, 31, 38, 45],
        superNumber: 3,
        jackpot: 3_500_000,
        status: "drawn",
        totalTickets: 18
    },
    {
        id: "draw-2026-03-07",
        drawDate: "2026-03-07T19:00:00.000Z",
        winningNumbers: [2, 9, 17, 28, 36, 49],
        superNumber: 6,
        jackpot: 4_200_000,
        status: "drawn",
        totalTickets: 24
    },
    {
        id: "draw-2026-03-14",
        drawDate: "2026-03-14T19:00:00.000Z",
        winningNumbers: [5, 13, 21, 34, 42, 48],
        superNumber: 1,
        jackpot: 5_500_000,
        status: "drawn",
        totalTickets: 31
    },
    {
        id: "draw-2026-03-21",
        drawDate: "2026-03-21T19:00:00.000Z",
        winningNumbers: [],
        superNumber: -1,
        jackpot: 6_000_000,
        status: "pending",
        totalTickets: 7
    }
];

export const mockLottoTickets: LottoTicket[] = [
    {
        id: "lt-001",
        userId: "00000000-0000-0000-0000-000000000001",
        numbers: [5, 9, 17, 28, 36, 49],
        superNumber: 3,
        drawId: "draw-2026-03-07",
        purchasedAt: "2026-03-06T10:00:00.000Z",
        cost: 2
    },
    {
        id: "lt-002",
        userId: "00000000-0000-0000-0000-000000000001",
        numbers: [5, 13, 21, 34, 42, 48],
        superNumber: 1,
        drawId: "draw-2026-03-14",
        purchasedAt: "2026-03-13T14:30:00.000Z",
        cost: 2
    },
    {
        id: "lt-003",
        userId: "00000000-0000-0000-0000-000000000001",
        numbers: [3, 14, 25, 36, 47, 49],
        superNumber: 7,
        drawId: "draw-2026-03-21",
        purchasedAt: "2026-03-15T09:00:00.000Z",
        cost: 2
    }
];

export const mockLottoResults: LottoResult[] = [
    {
        ticketId: "lt-001",
        userId: "00000000-0000-0000-0000-000000000001",
        drawId: "draw-2026-03-07",
        matchedNumbers: [9, 17, 28, 36, 49],
        matchedCount: 5,
        superNumberMatched: false,
        prizeClass: "class4",
        prizeAmount: 5_000
    },
    {
        ticketId: "lt-002",
        userId: "00000000-0000-0000-0000-000000000001",
        drawId: "draw-2026-03-14",
        matchedNumbers: [5, 13, 21, 34, 42, 48],
        matchedCount: 6,
        superNumberMatched: true,
        prizeClass: "class1",
        prizeAmount: 5_500_000
    }
];

export const mockLottoStats: LottoStats = {
    totalDraws: 3,
    totalTicketsSold: 73,
    totalPrizePaid: 5_515_000,
    biggestJackpot: 5_500_000,
    lastDraw: mockLottoDraws[2]!,
    nextDraw: mockLottoDraws[3]!,
    hotNumbers: [5, 13, 21, 28, 34, 42, 48, 9, 17, 36],
    coldNumbers: [1, 4, 11, 15, 23, 29, 32, 37, 44, 46]
};

// ── Messages ──────────────────────────────────────────────────────────────────

const adminId = "00000000-0000-0000-0000-000000000001";
const modId = "00000000-0000-0000-0000-000000000002";
const memberId = "00000000-0000-0000-0000-000000000003";

export const mockConversations: Conversation[] = [
    {
        id: "conv-001",
        participantIds: [adminId, memberId],
        participants: [
            { userId: adminId, username: "admin", displayName: "Aniverse Admin" },
            { userId: memberId, username: "naruto_fan", displayName: "NarutoFan99" }
        ],
        subject: "Anime Empfehlung",
        lastMessage: "Hast du schon Attack on Titan gesehen?",
        lastMessageAt: oneHourAgo,
        unreadCount: 1,
        initiatedByUserId: memberId,
        createdAt: twoDaysAgo
    },
    {
        id: "conv-002",
        participantIds: [adminId, modId],
        participants: [
            { userId: adminId, username: "admin", displayName: "Aniverse Admin" },
            { userId: modId, username: "sakura_mod", displayName: "Sakura" }
        ],
        subject: "Moderationsaufgabe",
        lastMessage: "Klar, schaue ich mir gleich an!",
        lastMessageAt: thirtySecondsAgo,
        unreadCount: 0,
        initiatedByUserId: adminId,
        createdAt: twoDaysAgo
    }
];

export const mockConversationDetails = new Map<string, ConversationDetail>([
    [
        "conv-001",
        {
            conversation: mockConversations[0]!,
            messages: [
                {
                    id: "msg-001",
                    conversationId: "conv-001",
                    senderId: memberId,
                    senderName: "NarutoFan99",
                    content: "Hey! Hast du schon Attack on Titan gesehen? Ich finde die Story mega!",
                    isDraft: false,
                    isRead: false,
                    createdAt: oneHourAgo,
                    updatedAt: oneHourAgo
                }
            ]
        }
    ],
    [
        "conv-002",
        {
            conversation: mockConversations[1]!,
            messages: [
                {
                    id: "msg-002",
                    conversationId: "conv-002",
                    senderId: adminId,
                    senderName: "Aniverse Admin",
                    content: "Hey Sakura, kannst du diesen Thread mal überprüfen? Ich glaube da ist Spam dabei.",
                    isDraft: false,
                    isRead: true,
                    createdAt: twoDaysAgo,
                    updatedAt: twoDaysAgo
                },
                {
                    id: "msg-003",
                    conversationId: "conv-002",
                    senderId: modId,
                    senderName: "Sakura",
                    content: "Klar, schaue ich mir gleich an!",
                    isDraft: false,
                    isRead: true,
                    createdAt: thirtySecondsAgo,
                    updatedAt: thirtySecondsAgo
                }
            ]
        }
    ]
]);

export const mockDrafts: Draft[] = [
    {
        id: "draft-001",
        recipientId: modId,
        recipientName: "Sakura",
        subject: "Wichtige Info",
        content: "Hey, ich wollte dir sagen dass nächste Woche...",
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
    }
];

// ── Notifications ─────────────────────────────────────────────────────────────

export const mockNotifications: AppNotification[] = [
    {
        id: "notif-001",
        userId: adminId,
        type: "new_message",
        title: "Neue Nachricht",
        body: "NarutoFan99 hat dir eine Nachricht gesendet",
        link: "/messages",
        isRead: false,
        createdAt: oneHourAgo
    },
    {
        id: "notif-002",
        userId: adminId,
        type: "achievement_unlocked",
        title: "Achievement freigeschaltet!",
        body: 'Du hast das Achievement "Erster Beitrag" verdient',
        link: "/profile",
        isRead: false,
        createdAt: twoDaysAgo
    },
    {
        id: "notif-003",
        userId: adminId,
        type: "coins_received",
        title: "Coins erhalten",
        body: "Du hast 500 Coins als Willkommensbonus erhalten",
        link: "/shop",
        isRead: true,
        createdAt: twoDaysAgo
    },
    {
        id: "notif-004",
        userId: adminId,
        type: "thread_reply",
        title: "Neue Antwort",
        body: "sakura_mod hat auf deinen Thread \u201EWillkommen bei Aniverse\u201C geantwortet",
        link: "/forum",
        isRead: true,
        createdAt: twoDaysAgo
    },
    {
        id: "notif-005",
        userId: adminId,
        type: "xp_gained",
        title: "XP erhalten",
        body: "Du hast 50 XP für das Erstellen eines Threads verdient",
        link: null,
        isRead: true,
        createdAt: twoDaysAgo
    }
];

// ── Gallery ───────────────────────────────────────────────────────────────────

const mockGalleryMedia1: GalleryMedia[] = [
    {
        id: "media-001",
        albumId: "album-001",
        ownerId: adminId,
        type: "image",
        url: "https://picsum.photos/seed/aniverse1/800/600",
        title: "Erster Eindruck",
        description: "Ein wunderschönes Bild",
        filename: "photo1.jpg",
        mimeType: "image/jpeg",
        fileSize: 245000,
        width: 800,
        height: 600,
        takenAt: twoDaysAgo,
        latitude: 48.137154,
        longitude: 11.576124,
        sortOrder: 0,
        commentCount: 2,
        averageRating: 4.5,
        userRating: null,
        isOwner: false,
        createdAt: twoDaysAgo
    },
    {
        id: "media-002",
        albumId: "album-001",
        ownerId: adminId,
        type: "image",
        url: "https://picsum.photos/seed/aniverse2/800/600",
        title: "Sonnenuntergang",
        description: null,
        filename: "photo2.jpg",
        mimeType: "image/jpeg",
        fileSize: 312000,
        width: 800,
        height: 600,
        takenAt: twoDaysAgo,
        latitude: null,
        longitude: null,
        sortOrder: 1,
        commentCount: 0,
        averageRating: 0,
        userRating: null,
        isOwner: false,
        createdAt: twoDaysAgo
    },
    {
        id: "media-003",
        albumId: "album-001",
        ownerId: modId,
        type: "youtube",
        url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        youtubeId: "dQw4w9WgXcQ",
        title: "Einführungsvideo",
        description: "Willkommen bei Aniverse",
        filename: null,
        mimeType: null,
        fileSize: null,
        width: null,
        height: null,
        takenAt: null,
        latitude: null,
        longitude: null,
        sortOrder: 2,
        commentCount: 1,
        averageRating: 5,
        userRating: null,
        isOwner: false,
        createdAt: oneHourAgo
    }
];

const mockGalleryComments: GalleryComment[] = [
    {
        id: "comment-001",
        mediaId: "media-001",
        authorId: modId,
        authorName: "Sakura",
        authorAvatar: null,
        content: "Wunderschöne Aufnahme! 😍",
        createdAt: oneHourAgo
    },
    {
        id: "comment-002",
        mediaId: "media-001",
        authorId: memberId,
        authorName: "NarutoFan99",
        authorAvatar: null,
        content: "Tolle Perspektive!",
        createdAt: thirtySecondsAgo
    }
];

export const mockGalleryAlbums: GalleryAlbum[] = [
    {
        id: "album-001",
        title: "Aniverse Highlights 2024",
        description: "Die besten Momente des Jahres",
        category: "Events",
        coverUrl: "https://picsum.photos/seed/aniverse1/400/300",
        ownerId: adminId,
        ownerName: "Aniverse Admin",
        ownerAvatar: null,
        accessLevel: "public",
        watermarkEnabled: false,
        allowComments: true,
        allowRatings: true,
        allowDownload: true,
        tags: ["anime", "community", "2024"],
        mediaCount: 3,
        isOwner: false,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "album-002",
        title: "Fan Art Sammlung",
        description: "Kunstwerke unserer Community-Mitglieder",
        category: "Fan Art",
        coverUrl: "https://picsum.photos/seed/fanart/400/300",
        ownerId: modId,
        ownerName: "Sakura",
        ownerAvatar: null,
        accessLevel: "members_only",
        watermarkEnabled: true,
        allowComments: true,
        allowRatings: true,
        allowDownload: false,
        tags: ["fanart", "art"],
        mediaCount: 0,
        isOwner: false,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
    }
];

export const mockGalleryAlbumDetails = new Map<string, GalleryAlbumDetail>([
    [
        "album-001",
        {
            ...mockGalleryAlbums[0],
            media: mockGalleryMedia1
        }
    ],
    [
        "album-002",
        {
            ...mockGalleryAlbums[1],
            media: []
        }
    ]
]);

export const mockGalleryCommentsByMedia = new Map<string, GalleryComment[]>([
    ["media-001", mockGalleryComments],
    ["media-002", []],
    ["media-003", [mockGalleryComments[0]]]
]);

// ── Blog ──────────────────────────────────────────────────────────────────────

export const mockBlogCategories: BlogCategory[] = [
    {
        id: "bc-1",
        name: "Community News",
        slug: "community-news",
        description: "Neuigkeiten aus der Community",
        color: "#3B82F6",
        postCount: 2,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "bc-2",
        name: "Tutorials",
        slug: "tutorials",
        description: "Anleitungen und Tipps",
        color: "#10B981",
        postCount: 1,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "bc-3",
        name: "Tagebuch",
        slug: "tagebuch",
        description: "Persönliche Einträge",
        color: "#F59E0B",
        postCount: 1,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "bc-4",
        name: "Events",
        slug: "events",
        description: "Veranstaltungen und Ankündigungen",
        color: "#EC4899",
        postCount: 0,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    }
];

export const mockBlogPosts: BlogPost[] = [
    {
        id: "bp-1",
        title: "Willkommen in der Aniverse Community!",
        slug: "willkommen-in-der-aniverse-community",
        excerpt:
            "Wir freuen uns, euch in unserer Anime-Community begrüßen zu dürfen. Aniverse ist der Ort für alle Anime-Fans!",
        content: `<h2>Herzlich Willkommen bei Aniverse!</h2>
<p>Wir sind begeistert, euch auf unserer Community-Plattform begrüßen zu dürfen. <strong>Aniverse</strong> ist ein Ort für alle Anime-Fans, die ihre Leidenschaft teilen, diskutieren und neue Freundschaften schließen möchten.</p>
<h3>Was euch erwartet</h3>
<ul>
  <li><strong>Forum</strong>: Diskutiert über eure Lieblingsserien und aktuelle Anime-Themen</li>
  <li><strong>Blog</strong>: Teilt eure eigenen Artikel, Meinungen und Tagebucheinträge</li>
  <li><strong>Galerie</strong>: Zeigt eure Kunstwerke, Screenshots und Fan-Art</li>
  <li><strong>Kalender</strong>: Bleibt über Community-Events informiert</li>
  <li><strong>Shop</strong>: Sammelt Punkte und tauscht sie gegen virtuelle Items</li>
</ul>
<h3>Community-Regeln</h3>
<p>Um eine angenehme Atmosphäre zu gewährleisten, bitten wir euch, respektvoll miteinander umzugehen und unsere Community-Regeln zu beachten. Spoiler bitte immer kennzeichnen!</p>
<p>Wir freuen uns auf eine aktive und freundliche Community. <em>Willkommen bei Aniverse!</em> 🎌</p>`,
        type: "editorial",
        status: "published",
        authorId: "00000000-0000-0000-0000-000000000001",
        authorName: "Aniverse Admin",
        authorAvatar: null,
        categoryId: "bc-1",
        categoryName: "Community News",
        categoryColor: "#3B82F6",
        coverImageUrl: null,
        tags: ["community", "willkommen", "aniverse"],
        viewCount: 142,
        commentCount: 2,
        allowComments: true,
        isOwner: false,
        publishedAt: twoDaysAgo,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "bp-2",
        title: "Frühjahrs-Anime 2026: Die heißesten neuen Serien",
        slug: "fruehjahrs-anime-2026-die-heissesten-neuen-serien",
        excerpt:
            "Die Frühjahrssaison 2026 bringt einige sehr vielversprechende Titel. Hier ist unser Überblick über die heißerwartetsten Serien dieser Saison.",
        content: `<h2>Frühjahrs-Anime 2026: Unser Überblick</h2>
<p>Die Frühjahrssaison ist immer aufregend – und 2026 macht da keine Ausnahme. Wir haben die vielversprechendsten Neustarts für euch zusammengefasst.</p>
<h3>Top-Picks dieser Saison</h3>
<p>Besonders gespannt sind wir auf die Fortsetzungen etablierter Reihen sowie einige vielversprechende Neuanfänge aus dem Fantasy- und Isekai-Genre.</p>
<h3>Unsere Empfehlung</h3>
<p>Schaut in den Kalender – dort findet ihr alle Premiere-Termine und Community-Watch-Along-Events. Diskutiert mit uns im Forum über eure Favoriten dieser Saison!</p>`,
        type: "news",
        status: "published",
        authorId: "00000000-0000-0000-0000-000000000001",
        authorName: "Aniverse Admin",
        authorAvatar: null,
        categoryId: "bc-1",
        categoryName: "Community News",
        categoryColor: "#3B82F6",
        coverImageUrl: null,
        tags: ["anime", "spring2026", "news"],
        viewCount: 89,
        commentCount: 0,
        allowComments: true,
        isOwner: false,
        publishedAt: oneHourAgo,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
    },
    {
        id: "bp-3",
        title: "Meine Top 5 Isekai-Serien aller Zeiten",
        slug: "meine-top-5-isekai-serien-aller-zeiten",
        excerpt:
            "Als langjährige Anime-Enthusiastin habe ich unzählige Isekai-Serien gesehen. Heute teile ich meine persönlichen Top 5.",
        content: `<h2>Meine persönlichen Isekai-Top-5</h2>
<p>Isekai ist mittlerweile eines der beliebtesten Anime-Genres – und das nicht ohne Grund. Die Faszination, in eine völlig fremde Welt versetzt zu werden, ist zeitlos.</p>
<h3>Platz 5: Sword Art Online</h3>
<p>Der Klassiker, der das Genre für viele geprägt hat. Die ersten Arcs sind nach wie vor fesselnd.</p>
<h3>Platz 4: Re:Zero</h3>
<p>Dunkel, emotional und unberechenbar. Subaru ist ein Protagonist, den man lieben und hassen kann.</p>
<h3>Platz 3: Mushoku Tensei</h3>
<p>Beeindruckende Worldbuilding, tiefe Charakterentwicklung und eine emotionale Geschichte.</p>
<h3>Platz 2: That Time I Got Reincarnated as a Slime</h3>
<p>Entspannend, witzig und mit einem der sympathischsten Protagonisten des Genres.</p>
<h3>Platz 1: Overlord</h3>
<p>Ainz Ooal Gown ist für mich der faszinierendste Isekai-Protagonist. Die politischen Intrigen und die Weltentwicklung sind unübertroffen.</p>
<p>Was sind eure Favoriten? Schreibt es gerne in die Kommentare!</p>`,
        type: "personal",
        status: "published",
        authorId: "00000000-0000-0000-0000-000000000002",
        authorName: "Sakura",
        authorAvatar: null,
        categoryId: null,
        categoryName: null,
        categoryColor: null,
        coverImageUrl: null,
        tags: ["isekai", "top5", "anime", "persönlich"],
        viewCount: 57,
        commentCount: 1,
        allowComments: true,
        isOwner: false,
        publishedAt: oneHourAgo,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
    },
    {
        id: "bp-4",
        title: "Profil-Guide: So richtest du dein Aniverse-Profil ein",
        slug: "profil-guide-so-richtest-du-dein-aniverse-profil-ein",
        excerpt:
            "Ein gepflegtes Profil ist das Aushängeschild in jeder Community. In diesem Tutorial zeige ich euch, wie ihr euer Aniverse-Profil optimal gestaltet.",
        content: `<h2>Dein Aniverse-Profil optimal gestalten</h2>
<p>Ein aussagekräftiges Profil hilft anderen Community-Mitgliedern, euch besser kennenzulernen. Hier ist eine Schritt-für-Schritt-Anleitung.</p>
<h3>Schritt 1: Avatar hochladen</h3>
<p>Geht in eure Profileinstellungen und ladet ein Profilbild hoch. Anime-Avatare sind natürlich besonders willkommen!</p>
<h3>Schritt 2: Bio schreiben</h3>
<p>Erzählt etwas über euch: Welche Anime-Genres mögt ihr? Seit wann schaut ihr Anime? Was sind eure Lieblingsserien?</p>
<h3>Schritt 3: Anime-Liste pflegen</h3>
<p>Nutzt die Anime-Liste-Funktion, um eure gesehenen, laufenden und geplanten Anime zu verwalten. Das hilft euch und anderen bei Empfehlungen.</p>
<h3>Schritt 4: Im Forum aktiv werden</h3>
<p>Durch Forenbeiträge sammelt ihr Reputation-Punkte, die euer Profil aufwerten.</p>`,
        type: "editorial",
        status: "published",
        authorId: "00000000-0000-0000-0000-000000000001",
        authorName: "Aniverse Admin",
        authorAvatar: null,
        categoryId: "bc-2",
        categoryName: "Tutorials",
        categoryColor: "#10B981",
        coverImageUrl: null,
        tags: ["tutorial", "profil", "guide"],
        viewCount: 203,
        commentCount: 0,
        allowComments: true,
        isOwner: false,
        publishedAt: twoDaysAgo,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
    },
    {
        id: "bp-5",
        title: "Tag 1 im Anime-Club: Mein erstes Treffen",
        slug: "tag-1-im-anime-club-mein-erstes-treffen",
        excerpt: "Heute hatte ich mein erstes Treffen im lokalen Anime-Club. Ich war nervös, aber es war großartig!",
        content: `<h2>Mein erstes Anime-Club-Treffen</h2>
<p>Lange hab ich gezögert, aber heute war es endlich so weit: Mein erstes Treffen beim lokalen Anime-Club in der Stadtbibliothek.</p>
<p>Ich war ehrlich gesagt ziemlich nervös. Was, wenn die anderen viel mehr wissen als ich? Was, wenn ich die falschen Anime gemocht habe?</p>
<p>Aber dann war alles ganz anders als befürchtet. Die Leute waren unglaublich nett und offen. Wir haben uns über aktuelle Serien unterhalten, Empfehlungen ausgetauscht und sogar die erste Episode von "Frieren" zusammen angeschaut.</p>
<p>Ich freue mich schon auf das nächste Treffen!</p>`,
        type: "diary",
        status: "draft",
        authorId: "00000000-0000-0000-0000-000000000003",
        authorName: "NarutoFan99",
        authorAvatar: null,
        categoryId: "bc-3",
        categoryName: "Tagebuch",
        categoryColor: "#F59E0B",
        coverImageUrl: null,
        tags: ["tagebuch", "anime-club", "persönlich"],
        viewCount: 0,
        commentCount: 0,
        allowComments: true,
        isOwner: false,
        publishedAt: null,
        createdAt: now,
        updatedAt: now
    }
];

export const mockBlogCommentsByPost = new Map<string, BlogComment[]>([
    [
        "bp-1",
        [
            {
                id: "bc-c1",
                postId: "bp-1",
                authorId: "00000000-0000-0000-0000-000000000002",
                authorName: "Sakura",
                authorAvatar: null,
                content:
                    "Großartig, endlich eine Anime-Community, die sich wirklich anfühlt wie Zuhause. Danke für die tolle Plattform!",
                parentId: null,
                replies: [
                    {
                        id: "bc-c1r1",
                        postId: "bp-1",
                        authorId: "00000000-0000-0000-0000-000000000001",
                        authorName: "Aniverse Admin",
                        authorAvatar: null,
                        content: "Danke für das Feedback! Wir freuen uns, dich hier zu haben, Sakura 😊",
                        parentId: "bc-c1",
                        replies: [],
                        createdAt: oneHourAgo,
                        updatedAt: oneHourAgo
                    }
                ],
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo
            },
            {
                id: "bc-c2",
                postId: "bp-1",
                authorId: "00000000-0000-0000-0000-000000000003",
                authorName: "NarutoFan99",
                authorAvatar: null,
                content: "Der Shop und das Lotto sind meine Lieblingsfeatures! Habt ihr noch mehr geplant?",
                parentId: null,
                replies: [],
                createdAt: oneHourAgo,
                updatedAt: oneHourAgo
            }
        ]
    ],
    [
        "bp-3",
        [
            {
                id: "bc-c3",
                postId: "bp-3",
                authorId: "00000000-0000-0000-0000-000000000003",
                authorName: "NarutoFan99",
                authorAvatar: null,
                content:
                    "Tolle Liste! Aber Overlord auf Platz 1? Das ist mutig 😄 Für mich ist Re:Zero der klare Sieger!",
                parentId: null,
                replies: [],
                createdAt: thirtySecondsAgo,
                updatedAt: thirtySecondsAgo
            }
        ]
    ]
]);

export const mockBlogPostDetails = new Map<string, BlogPostDetail>(
    mockBlogPosts.map((p) => [p.slug, { ...p, comments: mockBlogCommentsByPost.get(p.id) ?? [] }])
);

// ── Coin Admin ──────────────────────────────────────────────────────────────

export const mockCoinConfig: CoinEarnConfig = {
    enabled: true,
    threadCreate: { enabled: true, amount: 5 },
    postReply: { enabled: true, amount: 2 },
    reactionGiven: { enabled: false, amount: 1 },
    reactionReceived: { enabled: true, amount: 1 },
    blogPost: { enabled: true, amount: 10 },
    blogComment: { enabled: true, amount: 2 },
    galleryUpload: { enabled: true, amount: 3 },
    dailyLogin: { enabled: true, amount: 1 },
    excludedCategoryIds: []
};

// ── Marketplace ───────────────────────────────────────────────────────────────

export const mockMarketCategories: Record<string, MarketCategory> = {
    "c1000000-0000-0000-0000-000000000001": {
        id: "c1000000-0000-0000-0000-000000000001",
        name: "Allgemein",
        description: "Allgemeine Artikel",
        parentId: null,
        icon: "pi pi-tag",
        sortOrder: 0,
        requiresApproval: false,
        isActive: true
    },
    "c1000000-0000-0000-0000-000000000002": {
        id: "c1000000-0000-0000-0000-000000000002",
        name: "Anime & Manga",
        description: "Figuren, Poster, Merchandise",
        parentId: null,
        icon: "pi pi-star",
        sortOrder: 1,
        requiresApproval: false,
        isActive: true
    },
    "c1000000-0000-0000-0000-000000000003": {
        id: "c1000000-0000-0000-0000-000000000003",
        name: "Spiele",
        description: "Videospiele und Brettspiele",
        parentId: null,
        icon: "pi pi-desktop",
        sortOrder: 2,
        requiresApproval: false,
        isActive: true
    },
    "c1000000-0000-0000-0000-000000000004": {
        id: "c1000000-0000-0000-0000-000000000004",
        name: "Kleidung",
        description: "Cosplay und Merchandise",
        parentId: null,
        icon: "pi pi-user",
        sortOrder: 3,
        requiresApproval: false,
        isActive: true
    }
};

export const mockMarketListings: Record<string, MarketListing> = {
    "l1000000-0000-0000-0000-000000000001": {
        id: "l1000000-0000-0000-0000-000000000001",
        title: "Attack on Titan Figuren-Set (Staffel 1)",
        description:
            "<p>Verkaufe mein <strong>Attack on Titan</strong> Figuren-Set aus Staffel 1. Alle Figuren sind in einwandfreiem Zustand und vollständig mit OVP.</p><p>Im Set enthalten: Eren, Mikasa, Armin (je ca. 18cm). Keine Beschädigungen, nie bespielt.</p>",
        price: 45.0,
        currency: "EUR",
        type: "sell",
        status: "active",
        categoryId: "c1000000-0000-0000-0000-000000000002",
        categoryName: "Anime & Manga",
        authorId: "00000000-0000-0000-0000-000000000003",
        authorName: "NarutoFan99",
        authorAvatarUrl: null,
        images: [],
        customFields: null,
        tags: ["Attack on Titan", "Figuren", "AOT"],
        expiresAt: null,
        viewCount: 24,
        offerCount: 2,
        commentCount: 3,
        bestOfferId: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    "l1000000-0000-0000-0000-000000000002": {
        id: "l1000000-0000-0000-0000-000000000002",
        title: "Suche: Demon Slayer Manga Band 1-10",
        description:
            "<p>Suche die ersten 10 Bände des Demon Slayer Mangas. Zustand egal, Hauptsache lesbar. Bitte PN mit Preis.</p>",
        price: null,
        currency: "EUR",
        type: "buy",
        status: "active",
        categoryId: "c1000000-0000-0000-0000-000000000002",
        categoryName: "Anime & Manga",
        authorId: "00000000-0000-0000-0000-000000000002",
        authorName: "ModerationQueen",
        authorAvatarUrl: null,
        images: [],
        customFields: null,
        tags: ["Demon Slayer", "Manga"],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        viewCount: 8,
        offerCount: 0,
        commentCount: 1,
        bestOfferId: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    "l1000000-0000-0000-0000-000000000003": {
        id: "l1000000-0000-0000-0000-000000000003",
        title: "PS5 Controller (Weiß) tauschen gegen Xbox Controller",
        description:
            "<p>Tausche meinen PS5 Controller (Weiß, kaum benutzt) gegen einen Xbox Series X/S Controller. Zustand sollte gut sein.</p>",
        price: null,
        currency: "EUR",
        type: "trade",
        status: "active",
        categoryId: "c1000000-0000-0000-0000-000000000003",
        categoryName: "Spiele",
        authorId: "00000000-0000-0000-0000-000000000003",
        authorName: "NarutoFan99",
        authorAvatarUrl: null,
        images: [],
        customFields: null,
        tags: ["PS5", "Controller", "Xbox"],
        expiresAt: null,
        viewCount: 15,
        offerCount: 1,
        commentCount: 2,
        bestOfferId: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
};

export const mockMarketOffers: Record<string, MarketOffer> = {
    "o1000000-0000-0000-0000-000000000001": {
        id: "o1000000-0000-0000-0000-000000000001",
        listingId: "l1000000-0000-0000-0000-000000000001",
        senderId: "00000000-0000-0000-0000-000000000002",
        senderName: "ModerationQueen",
        senderAvatarUrl: null,
        amount: 38.0,
        message: "Hallo! Würde gerne 38€ bieten. Bitte melden!",
        status: "pending",
        counterAmount: null,
        counterMessage: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
};

export const mockMarketComments: Record<string, MarketComment> = {
    "mc000000-0000-0000-0000-000000000001": {
        id: "mc000000-0000-0000-0000-000000000001",
        listingId: "l1000000-0000-0000-0000-000000000001",
        authorId: "00000000-0000-0000-0000-000000000002",
        authorName: "ModerationQueen",
        authorAvatarUrl: null,
        content: "Sind die Figuren noch versiegelt (OVP)?",
        parentId: null,
        isEdited: false,
        replies: [],
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    "mc000000-0000-0000-0000-000000000002": {
        id: "mc000000-0000-0000-0000-000000000002",
        listingId: "l1000000-0000-0000-0000-000000000001",
        authorId: "00000000-0000-0000-0000-000000000003",
        authorName: "NarutoFan99",
        authorAvatarUrl: null,
        content: "Ja, alle drei noch in der Original-Verpackung!",
        parentId: "mc000000-0000-0000-0000-000000000001",
        isEdited: false,
        replies: [],
        createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
    }
};

export const mockMarketRatings: Record<string, MarketRating> = {};
export const mockMarketReports: Record<string, MarketReport> = {};
