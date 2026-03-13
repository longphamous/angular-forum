import { Anime, AnimeListEntry, AnimeListStatus } from "../../models/anime/anime";
import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Group, PagePermission } from "../../models/group/group";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { UserProfile } from "../../models/user/user";

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
        role: "moderator",
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
        role: "member",
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
        episodeDuration: 24
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
        episodeDuration: 24
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
        episodeDuration: 23
    }
};

// ── Anime List (mutable, per user) ────────────────────────────────────────────

// key: `${userId}:${animeId}`
export const mockAnimeListStore: Record<string, AnimeListEntry> = {
    [`00000000-0000-0000-0000-000000000003:5114`]: {
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
    [`00000000-0000-0000-0000-000000000003:1`]: {
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
    [`00000000-0000-0000-0000-000000000003:9253`]: {
        animeId: 9253,
        userId: "00000000-0000-0000-0000-000000000003",
        status: "plan_to_watch" as AnimeListStatus,
        episodesWatched: 0,
        createdAt: now,
        updatedAt: now,
        anime: mockAnimeDetails[9253]
    }
};
