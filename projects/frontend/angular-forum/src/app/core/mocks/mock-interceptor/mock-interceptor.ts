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
import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { Group } from "../../models/group/group";
import { UserProfile } from "../../models/user/user";
import {
    mockAnimeDetails,
    mockAnimeListStore,
    mockCategories,
    mockForums,
    mockGroups,
    mockPagePermissions,
    mockPosts,
    mockThreads,
    mockUserGroupMap,
    mockUserProfiles,
    mockUsers,
    User
} from "../mock-data/mock-data";

const SIMULATED_LATENCY_MS = 300;

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
            const posts = Object.values(mockPosts).filter((p) => p.threadId === threadId);
            return this.ok({ data: posts, total: posts.length, page: 1, limit: 20 });
        }

        // POST /api/forum/forums/:forumId/threads
        const createThreadMatch = lowerUrl.match(/\/api\/forum\/forums\/([^/]+)\/threads$/);
        if (method === "POST" && createThreadMatch) {
            const forumId = createThreadMatch[1];
            const payload = body as { title: string; content: string } | null;
            if (!payload) {
                return this.error("Fehlender Request-Body", 400);
            }
            const now = new Date().toISOString();
            const authorId = "00000000-0000-0000-0000-000000000003";
            const newThread: Thread = {
                id: "mock-" + Math.random().toString(36).substring(2),
                forumId,
                authorId,
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
            const newPost: Post = {
                id: "mock-" + Math.random().toString(36).substring(2),
                threadId,
                authorId,
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

        // GET /api/users/:userId/anime-list
        const publicListMatch = lowerUrl.match(/\/api\/users\/([^/]+)\/anime-list$/);
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
