import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { delay } from "rxjs/operators";

import { AdminCreateUserPayload, AdminUpdateUserPayload } from "../../../facade/admin/admin-facade";
import { DashboardStats, RecentThread, TopPoster } from "../../../facade/dashboard/dashboard-facade";
import { Anime, AnimeListEntry, AnimeListEntryPayload, AnimeListStatus } from "../../models/anime/anime";
import { AttendeeStatus, RecurrenceRule } from "../../models/calendar/calendar";
import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { Group } from "../../models/group/group";
import { UserProfile } from "../../models/user/user";
import { DrawResult, LottoDraw, LottoResult, LottoTicket } from "../../models/lotto/lotto";
import {
    mockAchievements,
    mockAnimeDetails,
    mockAnimeListStore,
    mockCalendarEventDetails,
    mockCalendarEvents,
    mockCategories,
    mockForums,
    mockGroups,
    mockLottoConfig,
    mockLottoDraws,
    mockLottoResults,
    mockLottoStats,
    mockLottoTickets,
    mockOnlineUsers,
    mockPagePermissions,
    mockPosts,
    mockShopItems,
    mockSlides,
    mockThreads,
    mockUserAchievements,
    mockUserGroupMap,
    mockUserInventory,
    mockUserProfiles,
    mockUsers,
    mockWallets,
    mockWalletTransactions,
    User
} from "../mock-data/mock-data";

const SIMULATED_LATENCY_MS = 300;

// Tracks which postIds the mock member user has reacted to (persists for the session)
const mockReactedPostIds = new Set<string>();

interface LoginRequest {
    username: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

@Injectable()
export class MockInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const { url, method, body } = req;
        const lowerUrl = url.toLowerCase();

        // POST /auth/login
        if (method === "POST" && lowerUrl.endsWith("/auth/login")) {
            const payload = body as LoginRequest | null;
            if (!payload) {
                return this.error("Fehlender Request-Body", 400);
            }
            const { username } = payload;
            const user = Object.values(mockUsers).find((u) => u.username === username);
            if (!user) {
                return this.error("Ungültige Anmeldedaten", 401);
            }

            const fakeTokenPayload = {
                sub: user.id,
                role: user.roles[0] ?? "member",
                exp: Date.now() + 1000 * 60 * 60 // 1h
            };
            const fakeToken = btoa(JSON.stringify(fakeTokenPayload));

            const response: LoginResponse = {
                token: fakeToken,
                user: { ...user }
            };

            return this.ok(response);
        }

        // GET /api/forum/categories/admin  (admin – all categories, must be before :id route)
        if (method === "GET" && lowerUrl.match(/\/api\/forum\/categories\/admin$/)) {
            const categories = Object.values(mockCategories).map((cat) => ({ ...cat, forums: undefined }));
            return this.ok(categories);
        }

        // GET /api/forum/categories
        if (method === "GET" && lowerUrl.match(/\/api\/forum\/categories$/)) {
            const categories = Object.values(mockCategories)
                .filter((cat) => cat.isActive)
                .map((cat) => ({ ...cat, forums: undefined }));
            return this.ok(categories);
        }

        // GET /api/forum/categories/:id
        const categoryDetailMatch = lowerUrl.match(/\/api\/forum\/categories\/([^/]+)$/);
        if (method === "GET" && categoryDetailMatch) {
            const categoryId = categoryDetailMatch[1];
            const category = mockCategories[categoryId];
            if (!category) {
                return this.error("Kategorie nicht gefunden", 404);
            }
            return this.ok(category);
        }

        // PATCH /api/forum/categories/:id
        if (method === "PATCH" && categoryDetailMatch) {
            const categoryId = categoryDetailMatch[1];
            const category = mockCategories[categoryId];
            if (!category) return this.error("Kategorie nicht gefunden", 404);
            const patch = body as Partial<ForumCategory>;
            Object.assign(category, patch, { updatedAt: new Date().toISOString() });
            return this.ok({ ...category, forums: undefined });
        }

        // DELETE /api/forum/categories/:id
        if (method === "DELETE" && categoryDetailMatch) {
            const categoryId = categoryDetailMatch[1];
            if (!mockCategories[categoryId]) return this.error("Kategorie nicht gefunden", 404);
            delete mockCategories[categoryId];
            return this.ok({ success: true });
        }

        // POST /api/forum/categories
        if (method === "POST" && lowerUrl.match(/\/api\/forum\/categories$/)) {
            const payload = body as Partial<ForumCategory> | null;
            if (!payload?.name) return this.error("Fehlender Name", 400);
            const now = new Date().toISOString();
            const newCategory: ForumCategory = {
                id: "mock-" + Math.random().toString(36).substring(2),
                name: payload.name,
                slug: payload.name.toLowerCase().replace(/\s+/g, "-"),
                description: payload.description,
                position: payload.position ?? 0,
                isActive: true,
                forums: [],
                createdAt: now,
                updatedAt: now
            };
            mockCategories[newCategory.id] = newCategory;
            return this.ok({ ...newCategory, forums: undefined });
        }

        // GET /api/forum/forums/:id
        const forumDetailMatch = lowerUrl.match(/\/api\/forum\/forums\/([^/]+)$/);
        if (method === "GET" && forumDetailMatch) {
            const forumId = forumDetailMatch[1];
            const forum = mockForums[forumId];
            if (!forum) {
                return this.error("Forum nicht gefunden", 404);
            }
            return this.ok(forum);
        }

        // PATCH /api/forum/forums/:id
        if (method === "PATCH" && forumDetailMatch) {
            const forumId = forumDetailMatch[1];
            const forum = mockForums[forumId];
            if (!forum) return this.error("Forum nicht gefunden", 404);
            const patch = body as Partial<Forum>;
            Object.assign(forum, patch, { updatedAt: new Date().toISOString() });
            return this.ok(forum);
        }

        // DELETE /api/forum/forums/:id
        if (method === "DELETE" && forumDetailMatch) {
            const forumId = forumDetailMatch[1];
            if (!mockForums[forumId]) return this.error("Forum nicht gefunden", 404);
            delete mockForums[forumId];
            return this.ok({ success: true });
        }

        // POST /api/forum/categories/:categoryId/forums
        const createForumMatch = lowerUrl.match(/\/api\/forum\/categories\/([^/]+)\/forums$/);
        if (method === "POST" && createForumMatch) {
            const categoryId = createForumMatch[1];
            if (!mockCategories[categoryId]) return this.error("Kategorie nicht gefunden", 404);
            const payload = body as Partial<Forum> | null;
            if (!payload?.name) return this.error("Fehlender Name", 400);
            const now = new Date().toISOString();
            const newForum: Forum = {
                id: "mock-" + Math.random().toString(36).substring(2),
                categoryId,
                name: payload.name,
                slug: payload.name.toLowerCase().replace(/\s+/g, "-"),
                description: payload.description,
                position: payload.position ?? 0,
                isLocked: payload.isLocked ?? false,
                isPrivate: payload.isPrivate ?? false,
                threadCount: 0,
                postCount: 0,
                createdAt: now,
                updatedAt: now
            };
            mockForums[newForum.id] = newForum;
            return this.ok(newForum);
        }

        // GET /api/forum/forums/:forumId/threads
        const forumThreadsMatch = lowerUrl.match(/\/api\/forum\/forums\/([^/]+)\/threads/);
        if (method === "GET" && forumThreadsMatch) {
            const forumId = forumThreadsMatch[1];
            const threads = Object.values(mockThreads).filter((t) => t.forumId === forumId);
            return this.ok({ data: threads, total: threads.length, page: 1, limit: 20 });
        }

        // GET /api/forum/threads/:id
        const threadDetailMatch = lowerUrl.match(/\/api\/forum\/threads\/([^/]+)$/);
        if (method === "GET" && threadDetailMatch) {
            const threadId = threadDetailMatch[1];
            const thread = mockThreads[threadId];
            if (!thread) {
                return this.error("Thread nicht gefunden", 404);
            }
            return this.ok(thread);
        }

        // PATCH /api/forum/threads/:id
        if (method === "PATCH" && threadDetailMatch) {
            const threadId = threadDetailMatch[1];
            const thread = mockThreads[threadId];
            if (!thread) return this.error("Thread nicht gefunden", 404);
            const patch = body as Partial<Thread>;
            Object.assign(thread, patch, { updatedAt: new Date().toISOString() });
            return this.ok(thread);
        }

        // DELETE /api/forum/threads/:id
        if (method === "DELETE" && threadDetailMatch) {
            const threadId = threadDetailMatch[1];
            if (!mockThreads[threadId]) return this.error("Thread nicht gefunden", 404);
            delete mockThreads[threadId];
            return this.ok({ success: true });
        }

        // GET /api/forum/threads/:threadId/posts
        const threadPostsMatch = lowerUrl.match(/\/api\/forum\/threads\/([^/]+)\/posts/);
        if (method === "GET" && threadPostsMatch) {
            const threadId = threadPostsMatch[1];
            const posts = Object.values(mockPosts)
                .filter((p) => p.threadId === threadId)
                .map((p) => ({ ...p, authorBalance: mockWallets[p.authorId]?.balance }));
            return this.ok({ data: posts, total: posts.length, page: 1, limit: 20 });
        }

        // POST /api/forum/forums/:forumId/threads
        const createThreadMatch = lowerUrl.match(/\/api\/forum\/forums\/([^/]+)\/threads$/);
        if (method === "POST" && createThreadMatch) {
            const forumId = createThreadMatch[1];
            const payload = body as { title: string; content: string; tags?: string[] } | null;
            if (!payload) {
                return this.error("Fehlender Request-Body", 400);
            }
            const now = new Date().toISOString();
            const authorId = "00000000-0000-0000-0000-000000000003";
            const authorProfile = mockUserProfiles[authorId];
            const newThread: Thread = {
                id: "mock-" + Math.random().toString(36).substring(2),
                forumId,
                authorId,
                authorName: authorProfile?.displayName ?? "Unbekannt",
                authorLevel: authorProfile?.level ?? 1,
                authorLevelName: authorProfile?.levelName ?? "Neuling",
                tags: payload.tags ?? [],
                title: payload.title,
                slug: payload.title.toLowerCase().replace(/\s+/g, "-"),
                isPinned: false,
                isLocked: false,
                isSticky: false,
                viewCount: 0,
                replyCount: 0,
                lastPostAt: now,
                lastPostByUserId: authorId,
                createdAt: now,
                updatedAt: now
            };
            mockThreads[newThread.id] = newThread;
            return this.ok(newThread);
        }

        // GET /api/forum/threads/:threadId/my-reactions
        const myReactionsMatch = lowerUrl.match(/\/api\/forum\/threads\/([^/]+)\/my-reactions$/);
        if (method === "GET" && myReactionsMatch) {
            const threadId = myReactionsMatch[1];
            const reacted = [...mockReactedPostIds].filter((postId) => mockPosts[postId]?.threadId === threadId);
            return this.ok(reacted);
        }

        // POST /api/forum/posts/:id/react
        const postReactMatch = lowerUrl.match(/\/api\/forum\/posts\/([^/]+)\/react$/);
        if (method === "POST" && postReactMatch) {
            const postId = postReactMatch[1];
            const post = mockPosts[postId];
            if (!post) return this.error("Beitrag nicht gefunden", 404);
            if (!mockReactedPostIds.has(postId)) {
                mockReactedPostIds.add(postId);
                post.reactionCount = (post.reactionCount ?? 0) + 1;
            }
            return this.ok({
                id: "mock-reaction",
                postId,
                userId: "00000000-0000-0000-0000-000000000003",
                reactionType: "heart",
                createdAt: new Date().toISOString()
            });
        }

        // DELETE /api/forum/posts/:id/react
        if (method === "DELETE" && postReactMatch) {
            const postId = postReactMatch[1];
            const post = mockPosts[postId];
            if (post && mockReactedPostIds.has(postId)) {
                mockReactedPostIds.delete(postId);
                post.reactionCount = Math.max(0, (post.reactionCount ?? 0) - 1);
            }
            return this.ok({ success: true });
        }

        // POST /api/forum/threads/:threadId/posts
        const createPostMatch = lowerUrl.match(/\/api\/forum\/threads\/([^/]+)\/posts$/);
        if (method === "POST" && createPostMatch) {
            const threadId = createPostMatch[1];
            const payload = body as { content: string } | null;
            if (!payload) {
                return this.error("Fehlender Request-Body", 400);
            }
            const thread = mockThreads[threadId] as Thread | undefined;
            if (!thread) {
                return this.error("Thread nicht gefunden", 404);
            }
            const now = new Date().toISOString();
            const authorId = "00000000-0000-0000-0000-000000000003";
            const postAuthor = mockUserProfiles[authorId];
            const newPost: Post = {
                id: "mock-" + Math.random().toString(36).substring(2),
                threadId,
                authorId,
                authorName: postAuthor?.displayName ?? "Unbekannt",
                authorRole: postAuthor?.role ?? "member",
                authorPostCount: postAuthor?.postCount ?? 0,
                authorAvatarUrl: postAuthor?.avatarUrl,
                authorSignature: postAuthor?.signature,
                authorLevel: postAuthor?.level ?? 1,
                authorLevelName: postAuthor?.levelName ?? "Neuling",
                content: payload.content,
                isFirstPost: false,
                isEdited: false,
                editCount: 0,
                reactionCount: 0,
                createdAt: now,
                updatedAt: now
            };
            mockPosts[newPost.id] = newPost;
            thread.replyCount += 1;
            thread.lastPostAt = now;
            return this.ok(newPost);
        }

        // GET /api/anime/genres
        if (method === "GET" && lowerUrl.match(/\/api\/anime\/genres$/)) {
            const allGenres = [
                "Action",
                "Adult Cast",
                "Adventure",
                "Anthropomorphic",
                "Avant Garde",
                "Award Winning",
                "Boys Love",
                "CGDCT",
                "Childcare",
                "Combat Sports",
                "Comedy",
                "Crossdressing",
                "Delinquents",
                "Detective",
                "Drama",
                "Ecchi",
                "Educational",
                "Erotica",
                "Fantasy",
                "Gag Humor",
                "Girls Love",
                "Gore",
                "Gourmet",
                "Harem",
                "Hentai",
                "High Stakes Game",
                "Historical",
                "Horror",
                "Idols (Female)",
                "Idols (Male)",
                "Isekai",
                "Iyashikei",
                "Josei",
                "Kids",
                "Love Polygon",
                "Love Status Quo",
                "Magical Sex Shift",
                "Mahou Shoujo",
                "Martial Arts",
                "Mecha",
                "Medical",
                "Military",
                "Music",
                "Mystery",
                "Mythology",
                "Organized Crime",
                "Otaku Culture",
                "Parody",
                "Performing Arts",
                "Pets",
                "Psychological",
                "Racing",
                "Reincarnation",
                "Reverse Harem",
                "Romance",
                "Samurai",
                "School",
                "Sci-Fi",
                "Seinen",
                "Shoujo",
                "Shounen",
                "Showbiz",
                "Slice of Life",
                "Space",
                "Sports",
                "Strategy Game",
                "Super Power",
                "Supernatural",
                "Survival",
                "Suspense",
                "Team Sports",
                "Time Travel",
                "Urban Fantasy",
                "Vampire",
                "Video Game",
                "Villainess",
                "Visual Arts",
                "Workplace"
            ];
            return this.ok(allGenres);
        }

        // GET /api/anime/list  (must be before /api/anime/:id)
        if (method === "GET" && lowerUrl.match(/\/api\/anime\/list$/)) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const entries = Object.values(mockAnimeListStore).filter((e) => e.userId === decoded.sub);
                return this.ok(entries);
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // POST /api/anime/list
        if (method === "POST" && lowerUrl.match(/\/api\/anime\/list$/)) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const payload = body as AnimeListEntryPayload;
                const key = `${decoded.sub}:${payload.animeId}`;
                const existing = mockAnimeListStore[key];
                const entryNow = new Date().toISOString();
                const mockAnime = mockAnimeDetails[payload.animeId] ?? ({ id: payload.animeId } as Anime);
                const entry: AnimeListEntry = {
                    animeId: payload.animeId,
                    anime: mockAnime,
                    createdAt: existing?.createdAt ?? entryNow,
                    episodesWatched: payload.episodesWatched,
                    review: payload.review,
                    score: payload.score,
                    status: payload.status as AnimeListStatus,
                    updatedAt: entryNow,
                    userId: decoded.sub
                };
                mockAnimeListStore[key] = entry;
                return this.ok(entry);
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // DELETE /api/anime/list/:animeId
        const animeListDeleteMatch = lowerUrl.match(/\/api\/anime\/list\/(\d+)$/);
        if (method === "DELETE" && animeListDeleteMatch) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const animeId = animeListDeleteMatch[1];
                const key = `${decoded.sub}:${animeId}`;
                delete mockAnimeListStore[key];
                return this.ok(null);
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // GET /api/anime/list/user/:userId
        const publicListMatch = lowerUrl.match(/\/api\/anime\/list\/user\/([^/]+)$/);
        if (method === "GET" && publicListMatch) {
            const userId = publicListMatch[1];
            const entries = Object.values(mockAnimeListStore).filter((e) => e.userId === userId);
            return this.ok(entries);
        }

        // GET /api/anime/:id  (numeric id)
        const animeDetailMatch = lowerUrl.match(/\/api\/anime\/(\d+)$/);
        if (method === "GET" && animeDetailMatch) {
            const animeId = parseInt(animeDetailMatch[1], 10);
            const known = mockAnimeDetails[animeId];
            if (known) return this.ok(known);
            // Fallback: construct a placeholder
            const placeholder: Anime = {
                id: animeId,
                title: `Anime #${animeId}`,
                titleEnglish: `Anime #${animeId}`,
                type: "TV",
                status: "Finished Airing",
                episode: 12,
                mean: 7.5,
                rank: animeId,
                popularity: animeId,
                member: 10000,
                startYear: 2020
            };
            return this.ok(placeholder);
        }

        // GET /api/user  (admin – list all users)
        if (method === "GET" && lowerUrl.match(/\/api\/user$/)) {
            return this.ok(Object.values(mockUserProfiles));
        }

        // POST /api/user/admin  (admin – create user)
        if (method === "POST" && lowerUrl.match(/\/api\/user\/admin$/)) {
            const payload = body as AdminCreateUserPayload | null;
            if (!payload?.username || !payload.email || !payload.password) {
                return this.error("Pflichtfelder fehlen", 400);
            }
            const exists = Object.values(mockUserProfiles).find(
                (u) => u.username === payload.username || u.email === payload.email
            );
            if (exists) return this.error("Benutzername oder E-Mail bereits vergeben", 400);
            const newRole = payload.role ?? "member";
            const newUserGroups = ["Jeder", "Registrierte Benutzer"];
            if (newRole === "admin") newUserGroups.push("Admin");
            if (newRole === "moderator") newUserGroups.push("Moderator");
            const newUser: UserProfile = {
                bio: undefined,
                createdAt: new Date().toISOString(),
                displayName: payload.displayName ?? payload.username,
                email: payload.email,
                groups: newUserGroups,
                id: "mock-" + Math.random().toString(36).substring(2),
                postCount: 0,
                level: 1,
                levelName: "Neuling",
                xp: 0,
                xpToNextLevel: 100,
                xpProgressPercent: 0,
                role: newRole,
                status: payload.status ?? "active",
                username: payload.username
            };
            mockUserProfiles[newUser.id] = newUser;
            return this.ok(newUser);
        }

        // PATCH /api/user/:userId  (admin – update user role/status)
        const adminUserPatchMatch = url.match(/\/api\/user\/([0-9a-f-]{36})$/i);
        if (method === "PATCH" && adminUserPatchMatch) {
            const userId = adminUserPatchMatch[1];
            const profile = mockUserProfiles[userId];
            if (!profile) return this.error("Benutzer nicht gefunden", 404);
            const patch = body as AdminUpdateUserPayload;
            if (patch.displayName !== undefined) profile.displayName = patch.displayName;
            if (patch.avatarUrl !== undefined) profile.avatarUrl = patch.avatarUrl;
            if (patch.bio !== undefined) profile.bio = patch.bio;
            if (patch.role !== undefined) profile.role = patch.role;
            if (patch.status !== undefined) profile.status = patch.status;
            return this.ok({ ...profile });
        }

        // DELETE /api/user/:userId  (admin – delete user)
        const adminUserDeleteMatch = url.match(/\/api\/user\/([0-9a-f-]{36})$/i);
        if (method === "DELETE" && adminUserDeleteMatch) {
            const userId = adminUserDeleteMatch[1];
            if (!mockUserProfiles[userId]) return this.error("Benutzer nicht gefunden", 404);
            delete mockUserProfiles[userId];
            return this.ok({ success: true });
        }

        // GET /api/group  (list all groups)
        if (method === "GET" && lowerUrl.match(/\/api\/group$/)) {
            return this.ok(Object.values(mockGroups));
        }

        // GET /api/group/:id/users  (users in group)
        const groupUsersMatch = lowerUrl.match(/\/api\/group\/([^/]+)\/users$/);
        if (method === "GET" && groupUsersMatch) {
            const groupId = groupUsersMatch[1];
            const group = mockGroups[groupId];
            if (!group) return this.error("Gruppe nicht gefunden", 404);
            const members = Object.values(mockUserProfiles).filter((u) =>
                (mockUserGroupMap[u.id] ?? []).includes(groupId)
            );
            return this.ok(members);
        }

        // PUT /api/group/:id/users  (set users in group)
        if (method === "PUT" && groupUsersMatch) {
            const groupId = groupUsersMatch[1];
            const group = mockGroups[groupId];
            if (!group) return this.error("Gruppe nicht gefunden", 404);
            const body2 = body as { userIds: string[] };
            // Update userGroupMap
            for (const uid of Object.keys(mockUserGroupMap)) {
                mockUserGroupMap[uid] = (mockUserGroupMap[uid] ?? []).filter((g) => g !== groupId);
            }
            for (const uid of body2.userIds) {
                if (!mockUserGroupMap[uid]) mockUserGroupMap[uid] = [];
                if (!mockUserGroupMap[uid].includes(groupId)) mockUserGroupMap[uid].push(groupId);
            }
            group.userCount = body2.userIds.length;
            return this.ok({ ...group });
        }

        // POST /api/group  (create group)
        if (method === "POST" && lowerUrl.match(/\/api\/group$/)) {
            const payload = body as { name: string; description?: string } | null;
            if (!payload?.name) return this.error("Name fehlt", 400);
            if (Object.values(mockGroups).find((g) => g.name === payload.name)) {
                return this.error("Gruppe existiert bereits", 400);
            }
            const newGroup: Group = {
                id: "g-" + Math.random().toString(36).substring(2),
                name: payload.name,
                description: payload.description,
                isSystem: false,
                userCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockGroups[newGroup.id] = newGroup;
            return this.ok(newGroup);
        }

        // PATCH /api/group/:id  (update group)
        const groupDetailMatch = lowerUrl.match(/\/api\/group\/([^/]+)$/);
        if (method === "PATCH" && groupDetailMatch) {
            const groupId = groupDetailMatch[1];
            const group = mockGroups[groupId];
            if (!group) return this.error("Gruppe nicht gefunden", 404);
            const patch = body as { name?: string; description?: string };
            if (patch.name !== undefined) group.name = patch.name;
            if (patch.description !== undefined) group.description = patch.description;
            group.updatedAt = new Date().toISOString();
            return this.ok({ ...group });
        }

        // DELETE /api/group/:id  (delete group)
        if (method === "DELETE" && groupDetailMatch) {
            const groupId = groupDetailMatch[1];
            const group = mockGroups[groupId];
            if (!group) return this.error("Gruppe nicht gefunden", 404);
            if (group.isSystem) return this.error("Systemgruppe kann nicht gelöscht werden", 400);
            delete mockGroups[groupId];
            return this.ok({ success: true });
        }

        // PUT /api/group/user/:userId/groups  (set user groups)
        const userGroupsMatch = lowerUrl.match(/\/api\/group\/user\/([^/]+)\/groups$/);
        if (method === "PUT" && userGroupsMatch) {
            const userId = userGroupsMatch[1];
            const profile = mockUserProfiles[userId];
            if (!profile) return this.error("Benutzer nicht gefunden", 404);
            const body3 = body as { groupIds: string[] };
            mockUserGroupMap[userId] = body3.groupIds;
            profile.groups = body3.groupIds.map((id) => mockGroups[id]?.name).filter((n): n is string => Boolean(n));
            // Update user counts
            for (const g of Object.values(mockGroups)) {
                g.userCount = Object.values(mockUserGroupMap).filter((ids) => ids.includes(g.id)).length;
            }
            return this.ok({ ...profile });
        }

        // GET /api/page-permission  (list all page permissions)
        if (method === "GET" && lowerUrl.match(/\/api\/page-permission$/)) {
            return this.ok(Object.values(mockPagePermissions));
        }

        // PUT /api/page-permission/:id/groups  (set groups for permission)
        const permGroupsMatch = lowerUrl.match(/\/api\/page-permission\/([^/]+)\/groups$/);
        if (method === "PUT" && permGroupsMatch) {
            const permId = permGroupsMatch[1];
            const perm = mockPagePermissions[permId];
            if (!perm) return this.error("Berechtigung nicht gefunden", 404);
            const body4 = body as { groupIds: string[] };
            perm.groups = body4.groupIds
                .map((id) => mockGroups[id])
                .filter((g): g is Group => Boolean(g))
                .map((g) => ({ id: g.id, name: g.name }));
            perm.updatedAt = new Date().toISOString();
            return this.ok({ ...perm });
        }

        // GET /api/user/profile/:userId  (public profile)
        const publicProfileMatch = lowerUrl.match(/\/api\/user\/profile\/([0-9a-f-]{36})$/i);
        if (method === "GET" && publicProfileMatch) {
            const userId = publicProfileMatch[1];
            const profile = mockUserProfiles[userId];
            if (!profile) return this.error("Benutzer nicht gefunden", 404);
            return this.ok({ ...profile });
        }

        // PATCH /api/user/profile
        if (method === "PATCH" && lowerUrl.match(/\/api\/user\/profile$/)) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const user = mockUsers[decoded.sub];
                if (!user) return this.error("Benutzer nicht gefunden", 404);
                const patch = body as { displayName?: string; bio?: string; avatarUrl?: string };
                if (patch.displayName !== undefined) user.displayName = patch.displayName;
                const profile = mockUserProfiles[decoded.sub];
                const userGroups = profile?.groups ?? ["Jeder", "Registrierte Benutzer"];
                return this.ok({ ...user, groups: userGroups, role: user.roles[0] ?? "member", status: "active" });
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // POST /api/user/change-password
        if (method === "POST" && lowerUrl.match(/\/api\/user\/change-password$/)) {
            return this.ok(null);
        }

        // GET /api/gamification/config
        if (method === "GET" && lowerUrl.match(/\/api\/gamification\/config$/)) {
            return this.ok([
                {
                    eventType: "create_thread",
                    xpAmount: 10,
                    label: "Thread erstellen",
                    description: "XP für das Erstellen eines neuen Threads"
                },
                {
                    eventType: "create_post",
                    xpAmount: 5,
                    label: "Beitrag schreiben",
                    description: "XP für das Verfassen einer Antwort"
                },
                {
                    eventType: "receive_reaction",
                    xpAmount: 3,
                    label: "Reaktion erhalten",
                    description: "XP wenn ein eigener Beitrag eine Reaktion bekommt"
                },
                {
                    eventType: "give_reaction",
                    xpAmount: 1,
                    label: "Reaktion geben",
                    description: "XP für das Reagieren auf einen fremden Beitrag"
                }
            ]);
        }

        // PATCH /api/gamification/config/:eventType
        const gamificationConfigPatchMatch = lowerUrl.match(/\/api\/gamification\/config\/([^/]+)$/);
        if (method === "PATCH" && gamificationConfigPatchMatch) {
            const eventType = gamificationConfigPatchMatch[1];
            const patch = body as { xpAmount: number };
            return this.ok({ eventType, xpAmount: patch.xpAmount });
        }

        // POST /api/gamification/recalculate
        if (method === "POST" && lowerUrl.match(/\/api\/gamification\/recalculate$/)) {
            return this.ok({ updatedUsers: Object.keys(mockUserProfiles).length });
        }

        // GET /api/gamification/achievements/admin
        if (method === "GET" && lowerUrl.match(/\/api\/gamification\/achievements\/admin$/)) {
            return this.ok(Object.values(mockAchievements));
        }

        // GET /api/gamification/achievements/user/:userId
        const achievementsUserMatch = lowerUrl.match(/\/api\/gamification\/achievements\/user\/([0-9a-f-]+)$/i);
        if (method === "GET" && achievementsUserMatch) {
            const userId = achievementsUserMatch[1];
            return this.ok(mockUserAchievements[userId] ?? []);
        }

        // GET /api/gamification/achievements
        if (method === "GET" && lowerUrl.match(/\/api\/gamification\/achievements$/)) {
            return this.ok(Object.values(mockAchievements).filter((a) => a.isActive));
        }

        // POST /api/gamification/achievements/admin
        if (method === "POST" && lowerUrl.match(/\/api\/gamification\/achievements\/admin$/)) {
            const payload = body as Partial<(typeof mockAchievements)[string]> | null;
            if (!payload?.key || !payload.name) return this.error("Pflichtfelder fehlen", 400);
            const id = "ach-" + Math.random().toString(36).substring(2, 8);
            const ts = new Date().toISOString();
            const created = {
                ...payload,
                id,
                isActive: payload.isActive ?? true,
                createdAt: ts,
                updatedAt: ts
            } as (typeof mockAchievements)[string];
            mockAchievements[id] = created;
            return this.ok(created);
        }

        // PATCH /api/gamification/achievements/admin/:id
        const achievementPatchMatch = lowerUrl.match(/\/api\/gamification\/achievements\/admin\/([^/]+)$/);
        if (method === "PATCH" && achievementPatchMatch) {
            const id = achievementPatchMatch[1];
            const achievement = mockAchievements[id];
            if (!achievement) return this.error("Achievement nicht gefunden", 404);
            const patch = body as Partial<(typeof mockAchievements)[string]>;
            Object.assign(achievement, patch, { updatedAt: new Date().toISOString() });
            return this.ok({ ...achievement });
        }

        // DELETE /api/gamification/achievements/admin/:id
        const achievementDeleteMatch = url.match(/\/api\/gamification\/achievements\/admin\/([^/]+)$/i);
        if (method === "DELETE" && achievementDeleteMatch) {
            const id = achievementDeleteMatch[1];
            if (!mockAchievements[id]) return this.error("Achievement nicht gefunden", 404);
            delete mockAchievements[id];
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS));
        }

        // GET /api/dashboard/stats
        if (method === "GET" && lowerUrl.match(/\/api\/dashboard\/stats$/)) {
            const stats: DashboardStats = {
                animeCount: 1247,
                postCount: Object.keys(mockPosts).length + 46,
                threadCount: Object.keys(mockThreads).length + 15,
                userCount: Object.keys(mockUsers).length + 42
            };
            return this.ok(stats);
        }

        // GET /api/dashboard/recent-threads
        if (method === "GET" && lowerUrl.match(/\/api\/dashboard\/recent-threads$/)) {
            const recentThreads: RecentThread[] = Object.values(mockThreads)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((t) => ({
                    authorName: mockUsers[t.authorId]?.displayName ?? t.authorId,
                    forumName: mockForums[t.forumId]?.name ?? t.forumId,
                    id: t.id,
                    lastPostAt: t.lastPostAt ?? t.updatedAt,
                    replyCount: t.replyCount,
                    title: t.title
                }));
            return this.ok(recentThreads);
        }

        // GET /api/dashboard/top-posters
        if (method === "GET" && lowerUrl.match(/\/api\/dashboard\/top-posters$/)) {
            const adminUser = mockUsers["00000000-0000-0000-0000-000000000001"];
            const modUser = mockUsers["00000000-0000-0000-0000-000000000002"];
            const memberUser = mockUsers["00000000-0000-0000-0000-000000000003"];
            const topPosters: TopPoster[] = [
                { displayName: "Sakura", postCount: 234, userId: modUser.id, username: "sakura_mod" },
                { displayName: "NarutoFan99", postCount: 120, userId: memberUser.id, username: "naruto_fan" },
                { displayName: "Aniverse Admin", postCount: 87, userId: adminUser.id, username: "admin" },
                { displayName: "AnimeLover42", postCount: 63, userId: "mock-4", username: "anime_lover" },
                { displayName: "Otaku42", postCount: 41, userId: "mock-5", username: "otaku_42" }
            ];
            return this.ok(topPosters);
        }

        // GET /api/credit/leaderboard
        if (method === "GET" && lowerUrl.match(/\/api\/credit\/leaderboard/)) {
            const entries = Object.values(mockWallets)
                .sort((a, b) => b.balance - a.balance)
                .map((w) => {
                    const profile = mockUserProfiles[w.userId];
                    return {
                        userId: w.userId,
                        displayName: profile?.displayName ?? w.userId,
                        username: profile?.username ?? w.userId,
                        balance: w.balance
                    };
                });
            return this.ok(entries);
        }

        // GET /api/credit/wallet
        if (method === "GET" && lowerUrl.match(/\/api\/credit\/wallet$/)) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const wallet = mockWallets[decoded.sub];
                if (!wallet) return this.error("Wallet nicht gefunden", 404);
                return this.ok(wallet);
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // GET /api/credit/transactions
        if (method === "GET" && lowerUrl.match(/\/api\/credit\/transactions/)) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const txs = mockWalletTransactions[decoded.sub] ?? [];
                return this.ok({ data: txs, total: txs.length, page: 1, limit: 20 });
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // POST /api/credit/transfer
        if (method === "POST" && lowerUrl.match(/\/api\/credit\/transfer$/)) {
            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return this.error("Nicht authentifiziert", 401);
            try {
                const decoded = JSON.parse(atob(token)) as { sub: string };
                const payload = body as { toUserId: string; amount: number; description?: string } | null;
                if (!payload?.toUserId || !payload.amount) return this.error("Pflichtfelder fehlen", 400);
                const senderWallet = mockWallets[decoded.sub];
                const receiverWallet = mockWallets[payload.toUserId];
                if (!senderWallet) return this.error("Sender-Wallet nicht gefunden", 404);
                if (!receiverWallet) return this.error("Empfänger-Wallet nicht gefunden", 404);
                if (senderWallet.balance < payload.amount) return this.error("Unzureichendes Guthaben", 400);
                senderWallet.balance -= payload.amount;
                receiverWallet.balance += payload.amount;
                const ts = new Date().toISOString();
                const tx = {
                    id: "tx-" + Math.random().toString(36).substring(2),
                    fromUserId: decoded.sub,
                    toUserId: payload.toUserId,
                    amount: payload.amount,
                    type: "transfer" as const,
                    description: payload.description ?? "Transfer",
                    createdAt: ts
                };
                (mockWalletTransactions[decoded.sub] ??= []).unshift(tx);
                (mockWalletTransactions[payload.toUserId] ??= []).unshift({ ...tx, fromUserId: decoded.sub });
                return this.ok(tx);
            } catch {
                return this.error("Ungültiger Token", 401);
            }
        }

        // ── Online users ───────────────────────────────────────────────────────

        if (method === "GET" && url.includes("/api/user/online")) {
            const params = new URL(url, "http://localhost").searchParams;
            const sort = params.get("sort") ?? "lastSeen";
            const order = params.get("order") ?? "desc";
            const limit = Math.min(parseInt(params.get("limit") ?? "20") || 20, 100);

            const result = [...mockOnlineUsers];
            if (sort === "username") {
                result.sort((a, b) => a.username.localeCompare(b.username));
            } else {
                result.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
            }
            if (order === "asc") result.reverse();
            return this.ok(result.slice(0, limit));
        }

        // ── Slideshow ──────────────────────────────────────────────────────────

        if (method === "GET" && url.includes("/api/slideshow/admin")) {
            return this.ok([...mockSlides]);
        }

        if (method === "GET" && url.includes("/api/slideshow")) {
            return this.ok(mockSlides.filter((s) => s.isActive));
        }

        if (method === "POST" && url.includes("/api/slideshow/admin/upload")) {
            return this.ok({
                url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=400&fit=crop"
            });
        }

        if (method === "POST" && url.includes("/api/slideshow/admin")) {
            const body = req.body as {
                title: string;
                description?: string;
                translations?: Record<string, { title?: string; description?: string }>;
                imageUrl: string;
                linkUrl?: string;
                linkLabel?: string;
                linkFullSlide?: boolean;
                textStyle?: string;
                textAlign?: string;
                isActive?: boolean;
                sortOrder?: number;
                validFrom?: string | null;
                validUntil?: string | null;
            };
            const newSlide = {
                id: `slide-${Date.now()}`,
                title: body.title,
                description: body.description ?? null,
                translations: body.translations ?? null,
                imageUrl: body.imageUrl,
                linkUrl: body.linkUrl ?? null,
                linkLabel: body.linkLabel ?? null,
                linkFullSlide: body.linkFullSlide ?? false,
                textStyle: (body.textStyle ?? "overlay") as "overlay" | "glass",
                textAlign: (body.textAlign ?? "left") as "left" | "center",
                isActive: body.isActive ?? true,
                sortOrder: body.sortOrder ?? 0,
                validFrom: body.validFrom ?? null,
                validUntil: body.validUntil ?? null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockSlides.push(newSlide);
            return this.ok(newSlide);
        }

        if (method === "PATCH" && url.includes("/api/slideshow/admin/")) {
            const id = url.split("/api/slideshow/admin/")[1].split("?")[0];
            const idx = mockSlides.findIndex((s) => s.id === id);
            if (idx === -1) return this.error("Not found", 404);
            const body = req.body as Partial<(typeof mockSlides)[0]>;
            mockSlides[idx] = { ...mockSlides[idx], ...body, id, updatedAt: new Date().toISOString() };
            return this.ok(mockSlides[idx]);
        }

        if (method === "DELETE" && url.includes("/api/slideshow/admin/")) {
            const id = url.split("/api/slideshow/admin/")[1].split("?")[0];
            const idx = mockSlides.findIndex((s) => s.id === id);
            if (idx !== -1) mockSlides.splice(idx, 1);
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS)) as Observable<
                HttpEvent<never>
            >;
        }

        // ── Virtual Shop ───────────────────────────────────────────────────────

        if (method === "GET" && url.includes("/api/shop/admin/inventory/all")) {
            return this.ok([...mockUserInventory]);
        }

        if (method === "GET" && url.includes("/api/shop/admin")) {
            return this.ok([...mockShopItems]);
        }

        if (method === "GET" && url.includes("/api/shop/inventory")) {
            return this.ok([...mockUserInventory]);
        }

        if (method === "GET" && /\/api\/shop(\?|$)/.test(url)) {
            return this.ok(mockShopItems.filter((i) => i.isActive));
        }

        if (method === "POST" && url.includes("/api/shop/purchase/")) {
            const itemId = url.split("/api/shop/purchase/")[1].split("?")[0];
            const item = mockShopItems.find((i) => i.id === itemId);
            if (!item || !item.isActive) return this.error("Item nicht gefunden", 404);
            if (item.stock !== null && item.stock <= 0) return this.error("Ausverkauft", 400);
            if (item.stock !== null) item.stock -= 1;
            const existing = mockUserInventory.find((e) => e.itemId === itemId);
            if (existing) {
                existing.quantity += 1;
                return this.ok(existing);
            }
            const entry = {
                id: `inv-${Date.now()}`,
                userId: "00000000-0000-0000-0000-000000000001",
                itemId,
                item,
                quantity: 1,
                purchasedAt: new Date().toISOString()
            };
            mockUserInventory.push(entry);
            return this.ok(entry);
        }

        if (method === "POST" && url.includes("/api/shop/admin")) {
            const body = req.body as {
                name: string;
                description?: string | null;
                price: number;
                imageUrl?: string | null;
                icon?: string | null;
                category?: string | null;
                isActive?: boolean;
                stock?: number | null;
                maxPerUser?: number | null;
                sortOrder?: number;
            };
            const newItem = {
                id: `shop-${Date.now()}`,
                name: body.name,
                description: body.description ?? null,
                price: body.price,
                imageUrl: body.imageUrl ?? null,
                icon: body.icon ?? null,
                category: body.category ?? null,
                isActive: body.isActive ?? true,
                stock: body.stock ?? null,
                maxPerUser: body.maxPerUser ?? null,
                sortOrder: body.sortOrder ?? 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockShopItems.push(newItem);
            return this.ok(newItem);
        }

        if (method === "PATCH" && url.includes("/api/shop/admin/")) {
            const id = url.split("/api/shop/admin/")[1].split("?")[0];
            const idx = mockShopItems.findIndex((i) => i.id === id);
            if (idx === -1) return this.error("Not found", 404);
            const body = req.body as Partial<(typeof mockShopItems)[0]>;
            mockShopItems[idx] = { ...mockShopItems[idx]!, ...body, id, updatedAt: new Date().toISOString() };
            return this.ok(mockShopItems[idx]);
        }

        if (method === "DELETE" && url.includes("/api/shop/admin/")) {
            const id = url.split("/api/shop/admin/")[1].split("?")[0];
            const idx = mockShopItems.findIndex((i) => i.id === id);
            if (idx !== -1) mockShopItems.splice(idx, 1);
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS)) as Observable<
                HttpEvent<never>
            >;
        }

        // ── Calendar ───────────────────────────────────────────────────────────

        if (method === "GET" && url.includes("/api/calendar/admin/all")) {
            return this.ok([...mockCalendarEventDetails.values()]);
        }

        if (method === "GET" && url.includes("/api/calendar/my")) {
            return this.ok([...mockCalendarEvents]);
        }

        if (method === "GET" && url.includes("/api/calendar/ical/feed")) {
            return this.ok("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR");
        }

        if (method === "GET" && /\/api\/calendar\/[^/]+\/ical/.test(url)) {
            return this.ok("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR");
        }

        if (method === "GET" && /\/api\/calendar\/[^/?]+(\?|$)/.test(url)) {
            const id = url.split("/api/calendar/")[1]!.split("?")[0]!;
            const detail = mockCalendarEventDetails.get(id);
            if (!detail) return this.error("Not found", 404);
            return this.ok(detail);
        }

        if (method === "GET" && /\/api\/calendar(\?|$)/.test(url)) {
            const params = new URL(url, "http://localhost").searchParams;
            const from = params.get("from") ? new Date(params.get("from")!) : new Date(0);
            const to = params.get("to")
                ? new Date(params.get("to")!)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            return this.ok(
                mockCalendarEvents.filter((e) => {
                    const d = new Date(e.startDate);
                    return d >= from && d <= to;
                })
            );
        }

        if (method === "POST" && /\/api\/calendar\/[^/]+\/respond/.test(url)) {
            const eventId = url.split("/api/calendar/")[1]!.split("/respond")[0]!;
            const body = req.body as { status: string; companions?: number; declineReason?: string | null };
            const detail = mockCalendarEventDetails.get(eventId);
            if (detail) {
                const existing = detail.attendees.find((a) => a.userId === "00000000-0000-0000-0000-000000000001");
                if (existing) {
                    existing.status = body.status as "pending" | "accepted" | "declined" | "maybe";
                    existing.companions = body.companions ?? 0;
                    existing.declineReason = body.declineReason ?? null;
                    existing.respondedAt = new Date().toISOString();
                }
                const ev = mockCalendarEvents.find((e) => e.id === eventId);
                if (ev) ev.myStatus = body.status as "pending" | "accepted" | "declined" | "maybe";
            }
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS)) as Observable<
                HttpEvent<never>
            >;
        }

        if (method === "POST" && /\/api\/calendar\/[^/]+\/invite/.test(url)) {
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS)) as Observable<
                HttpEvent<never>
            >;
        }

        if (method === "POST" && /\/api\/calendar(\?|$)/.test(url)) {
            const body = req.body as {
                title: string;
                description?: string | null;
                location?: string | null;
                startDate: string;
                endDate: string;
                allDay?: boolean;
                isPublic?: boolean;
                maxAttendees?: number | null;
                color?: string | null;
                recurrenceRule?: unknown;
            };
            const newEvent = {
                id: `cal-${Date.now()}`,
                title: body.title,
                description: body.description ?? null,
                location: body.location ?? null,
                startDate: body.startDate,
                endDate: body.endDate,
                allDay: body.allDay ?? false,
                isPublic: body.isPublic ?? true,
                maxAttendees: body.maxAttendees ?? null,
                createdByUserId: "00000000-0000-0000-0000-000000000001",
                createdByDisplayName: "Aniverse Admin",
                threadId: null,
                recurrenceRule: (body.recurrenceRule as RecurrenceRule | null) ?? null,
                color: body.color ?? "blue",
                attendeeCount: 0,
                acceptedCount: 0,
                myStatus: null as AttendeeStatus | null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockCalendarEvents.push(newEvent);
            const detail = { ...newEvent, attendees: [] };
            mockCalendarEventDetails.set(newEvent.id, detail);
            return this.ok(detail);
        }

        if (method === "PATCH" && /\/api\/calendar\/admin\//.test(url)) {
            const id = url.split("/api/calendar/admin/")[1]!.split("?")[0]!;
            const ev = mockCalendarEvents.find((e) => e.id === id);
            if (!ev) return this.error("Not found", 404);
            Object.assign(ev, req.body);
            return this.ok(mockCalendarEventDetails.get(id) ?? ev);
        }

        if (method === "PATCH" && /\/api\/calendar\/[^/]+$/.test(url)) {
            const id = url.split("/api/calendar/")[1]!.split("?")[0]!;
            const ev = mockCalendarEvents.find((e) => e.id === id);
            if (!ev) return this.error("Not found", 404);
            Object.assign(ev, req.body);
            const detail = mockCalendarEventDetails.get(id);
            if (detail) Object.assign(detail, req.body);
            return this.ok(detail ?? ev);
        }

        if (method === "DELETE" && /\/api\/calendar\/admin\//.test(url)) {
            const id = url.split("/api/calendar/admin/")[1]!.split("?")[0]!;
            const idx = mockCalendarEvents.findIndex((e) => e.id === id);
            if (idx !== -1) mockCalendarEvents.splice(idx, 1);
            mockCalendarEventDetails.delete(id);
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS)) as Observable<
                HttpEvent<never>
            >;
        }

        if (method === "DELETE" && /\/api\/calendar\/[^/]+$/.test(url)) {
            const id = url.split("/api/calendar/")[1]!.split("?")[0]!;
            const idx = mockCalendarEvents.findIndex((e) => e.id === id);
            if (idx !== -1) mockCalendarEvents.splice(idx, 1);
            mockCalendarEventDetails.delete(id);
            return of(new HttpResponse({ status: 204 })).pipe(delay(SIMULATED_LATENCY_MS)) as Observable<
                HttpEvent<never>
            >;
        }

        // ── Lotto ──────────────────────────────────────────────────────────────

        if (method === "GET" && /\/api\/credit\/lotto\/config$/.test(url)) {
            return this.ok({ ...mockLottoConfig });
        }

        if (method === "PATCH" && /\/api\/credit\/lotto\/config$/.test(url)) {
            Object.assign(mockLottoConfig, req.body);
            return this.ok({ ...mockLottoConfig });
        }

        if (method === "GET" && /\/api\/credit\/lotto\/stats$/.test(url)) {
            const pending = mockLottoDraws.find((d) => d.status === "pending") ?? null;
            const lastDrawn = [...mockLottoDraws].filter((d) => d.status === "drawn").sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())[0] ?? null;
            return this.ok({ ...mockLottoStats, nextDraw: pending, lastDraw: lastDrawn });
        }

        if (method === "GET" && /\/api\/credit\/lotto\/draws$/.test(url)) {
            return this.ok([...mockLottoDraws]);
        }

        if (method === "POST" && /\/api\/credit\/lotto\/draws\/[^/]+\/perform$/.test(url)) {
            const id = url.split("/api/credit/lotto/draws/")[1]!.split("/perform")[0]!;
            const draw = mockLottoDraws.find((d) => d.id === id);
            if (!draw) return this.error("Not found", 404);
            if (draw.status === "drawn") return this.error("Already drawn", 400);
            const nums: number[] = [];
            const pool = Array.from({ length: 49 }, (_, i) => i + 1);
            for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
            draw.winningNumbers = pool.slice(0, 6).sort((a, b) => a - b);
            draw.superNumber = Math.floor(Math.random() * 10);
            draw.status = "drawn";
            const ticketsForDraw = mockLottoTickets.filter((t) => t.drawId === id);
            const winners: LottoResult[] = [];
            const result: DrawResult = { draw, totalTickets: ticketsForDraw.length, winners, totalPrizesPaid: 0 };
            return this.ok(result);
        }

        if (method === "POST" && /\/api\/credit\/lotto\/draws$/.test(url)) {
            const nextDate = new Date(Date.now() + 7 * 24 * 3600_000);
            const newDraw: LottoDraw = {
                id: `draw-${nextDate.toISOString().slice(0, 10)}`,
                drawDate: nextDate.toISOString(),
                winningNumbers: [],
                superNumber: -1,
                jackpot: mockLottoConfig.baseJackpot,
                status: "pending",
                totalTickets: 0
            };
            mockLottoDraws.push(newDraw);
            return this.ok(newDraw);
        }

        if (method === "GET" && /\/api\/credit\/lotto\/draws\/[^/]+\/results$/.test(url)) {
            const id = url.split("/api/credit/lotto/draws/")[1]!.split("/results")[0]!;
            const draw = mockLottoDraws.find((d) => d.id === id);
            if (!draw || draw.status !== "drawn") return this.error("Not drawn yet", 400);
            const winners = mockLottoResults.filter((r) => r.drawId === id && r.prizeAmount > 0);
            return this.ok({ draw, totalTickets: draw.totalTickets ?? 0, winners, totalPrizesPaid: winners.reduce((s, r) => s + r.prizeAmount, 0) });
        }

        if (method === "GET" && /\/api\/credit\/lotto\/draws\/[^/]+$/.test(url)) {
            const id = url.split("/api/credit/lotto/draws/")[1]!.split("?")[0]!;
            const draw = mockLottoDraws.find((d) => d.id === id);
            if (!draw) return this.error("Not found", 404);
            return this.ok({ ...draw });
        }

        if (method === "GET" && /\/api\/credit\/lotto\/my-tickets$/.test(url)) {
            return this.ok([...mockLottoTickets]);
        }

        if (method === "GET" && /\/api\/credit\/lotto\/my-results/.test(url)) {
            return this.ok([...mockLottoResults]);
        }

        if (method === "POST" && /\/api\/credit\/lotto\/tickets$/.test(url)) {
            const body = req.body as { numbers: number[]; superNumber: number; drawId: string; repeatWeeks?: number };
            const repeatWeeks = Math.max(1, body.repeatWeeks ?? 1);
            const createdTickets: LottoTicket[] = [];
            let currentDrawId = body.drawId;
            for (let w = 0; w < repeatWeeks; w++) {
                const draw = mockLottoDraws.find((d) => d.id === currentDrawId);
                if (!draw || draw.status === "drawn") break;
                const ticket: LottoTicket = {
                    id: `lt-${Date.now()}-${w}`,
                    userId: "00000000-0000-0000-0000-000000000001",
                    numbers: [...body.numbers].sort((a, b) => a - b),
                    superNumber: body.superNumber,
                    drawId: currentDrawId,
                    purchasedAt: new Date().toISOString(),
                    cost: mockLottoConfig.ticketCost,
                    repeatWeeks: repeatWeeks > 1 ? repeatWeeks : undefined
                };
                mockLottoTickets.push(ticket);
                createdTickets.push(ticket);
                // advance to next draw for next iteration
                const nextDraw = mockLottoDraws.find((d) => d.status === "pending" && d.id !== currentDrawId);
                if (nextDraw) currentDrawId = nextDraw.id;
                else break;
            }
            // deduct from mock wallet
            const wallet = mockWallets["00000000-0000-0000-0000-000000000001"];
            if (wallet) wallet.balance -= mockLottoConfig.ticketCost * repeatWeeks;
            return this.ok(createdTickets);
        }

        // Fallback: durchreichen
        return next.handle(req);
    }

    private ok<T>(body: T): Observable<HttpEvent<T>> {
        return of(new HttpResponse<T>({ status: 200, body })).pipe(delay(SIMULATED_LATENCY_MS));
    }

    private error(message: string, status = 400): Observable<HttpEvent<never>> {
        return throwError(() => new HttpErrorResponse({ status, error: { message } })).pipe(
            delay(SIMULATED_LATENCY_MS)
        );
    }
}
