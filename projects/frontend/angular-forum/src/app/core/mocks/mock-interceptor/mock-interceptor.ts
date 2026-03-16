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
import { BlogCategory, BlogComment, BlogPost } from "../../models/blog/blog";
import { AttendeeStatus, RecurrenceRule } from "../../models/calendar/calendar";
import { Forum } from "../../models/forum/forum";
import { ForumCategory } from "../../models/forum/forum-category";
import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { GalleryAlbum, GalleryComment, GalleryMedia } from "../../models/gallery/gallery";
import { Group } from "../../models/group/group";
import { LottoDraw, LottoPrizeClass, LottoResult, LottoTicket } from "../../models/lotto/lotto";
import { MarketComment, MarketListing, MarketOffer, MarketReport } from "../../models/marketplace/marketplace";
import { Conversation, ConversationDetail, Draft, Message } from "../../models/messages/messages";
import { UserProfile } from "../../models/user/user";
import {
    mockAchievements,
    mockAnimeDetails,
    mockAnimeListStore,
    mockBlogCategories,
    mockBlogCommentsByPost,
    mockBlogPostDetails,
    mockBlogPosts,
    mockCalendarEventDetails,
    mockCalendarEvents,
    mockCategories,
    mockCoinConfig,
    mockConversationDetails,
    mockConversations,
    mockDrafts,
    mockForums,
    mockGalleryAlbumDetails,
    mockGalleryAlbums,
    mockGalleryCommentsByMedia,
    mockGroups,
    mockLottoConfig,
    mockLottoDraws,
    mockLottoResults,
    mockLottoStats,
    mockLottoTickets,
    mockMarketCategories,
    mockMarketComments,
    mockMarketListings,
    mockMarketOffers,
    mockMarketRatings,
    mockMarketReports,
    mockNotifications,
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
const MOCK_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

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
                isBestAnswer: false,
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

        // PATCH /api/forum/threads/:threadId/best-answer/:postId
        const bestAnswerMatch = lowerUrl.match(/\/api\/forum\/threads\/([^/]+)\/best-answer\/([^/]+)$/);
        if (method === "PATCH" && bestAnswerMatch) {
            const threadId = bestAnswerMatch[1];
            const postId = bestAnswerMatch[2];
            const thread = mockThreads[threadId] as Thread | undefined;
            if (!thread) return this.error("Thread nicht gefunden", 404);
            const post = mockPosts[postId] as Post | undefined;
            if (!post || post.threadId !== threadId) return this.error("Beitrag nicht gefunden", 404);
            const isSame = thread.bestAnswerPostId === postId;
            if (thread.bestAnswerPostId) {
                const prev = mockPosts[thread.bestAnswerPostId];
                if (prev) prev.isBestAnswer = false;
            }
            if (isSame) {
                thread.bestAnswerPostId = undefined;
                post.isBestAnswer = false;
            } else {
                thread.bestAnswerPostId = postId;
                post.isBestAnswer = true;
            }
            return this.ok(post);
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
            const pending =
                [...mockLottoDraws]
                    .filter((d) => d.status === "pending")
                    .sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime())[0] ?? null;
            const lastDrawn =
                [...mockLottoDraws]
                    .filter((d) => d.status === "drawn")
                    .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())[0] ?? null;
            const biggestJackpot = Math.max(...mockLottoDraws.map((d) => d.jackpot), mockLottoStats.biggestJackpot);
            return this.ok({ ...mockLottoStats, nextDraw: pending, lastDraw: lastDrawn, biggestJackpot });
        }

        if (method === "GET" && /\/api\/credit\/lotto\/draws$/.test(url)) {
            return this.ok([...mockLottoDraws]);
        }

        if (method === "POST" && /\/api\/credit\/lotto\/draws\/[^/]+\/perform$/.test(url)) {
            const id = url.split("/api/credit/lotto/draws/")[1]!.split("/perform")[0]!;
            const draw = mockLottoDraws.find((d) => d.id === id);
            if (!draw) return this.error("Not found", 404);
            if (draw.status === "drawn") return this.error("Already drawn", 400);

            // Draw winning numbers (6 aus 49) and super number (0–9)
            const pool = Array.from({ length: 49 }, (_, i) => i + 1);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j]!, pool[i]!];
            }
            draw.winningNumbers = pool.slice(0, 6).sort((a, b) => a - b);
            draw.superNumber = Math.floor(Math.random() * 10);
            draw.status = "drawn";

            // Evaluate all tickets for this draw
            const ticketsForDraw = mockLottoTickets.filter((t) => t.drawId === id);
            const winners: LottoResult[] = [];
            const FIXED_PRIZES: Record<string, number> = {
                class2: 1_000_000,
                class3: 100_000,
                class4: 5_000,
                class5: 500,
                class6: 50,
                class7: 20,
                class8: 10,
                class9: 5
            };
            for (const ticket of ticketsForDraw) {
                const matched = ticket.numbers.filter((n) => draw.winningNumbers.includes(n));
                const mc = matched.length;
                const sz = ticket.superNumber === draw.superNumber;
                let prizeClass = "no_win";
                if (mc === 6 && sz) prizeClass = "class1";
                else if (mc === 6) prizeClass = "class2";
                else if (mc === 5 && sz) prizeClass = "class3";
                else if (mc === 5) prizeClass = "class4";
                else if (mc === 4 && sz) prizeClass = "class5";
                else if (mc === 4) prizeClass = "class6";
                else if (mc === 3 && sz) prizeClass = "class7";
                else if (mc === 3) prizeClass = "class8";
                else if (mc === 2 && sz) prizeClass = "class9";
                const prizeAmount = prizeClass === "class1" ? draw.jackpot : (FIXED_PRIZES[prizeClass] ?? 0);
                if (prizeAmount > 0) {
                    winners.push({
                        ticketId: ticket.id,
                        userId: ticket.userId,
                        drawId: id,
                        matchedNumbers: matched,
                        matchedCount: mc,
                        superNumberMatched: sz,
                        prizeClass: prizeClass as LottoPrizeClass,
                        prizeAmount
                    });
                }
            }

            // Jackpot rollover: if no class-1 winner, next draw gets current jackpot + % of revenue
            const totalRevenue = ticketsForDraw.reduce((s, t) => s + t.cost, 0);
            const rolloverContrib = Math.floor(totalRevenue * (mockLottoConfig.rolloverPercentage / 100));
            const hasJackpotWinner = winners.some((w) => w.prizeClass === "class1");
            const nextJackpot = hasJackpotWinner ? mockLottoConfig.baseJackpot : draw.jackpot + rolloverContrib;

            // Schedule next draw (next Saturday)
            const nextDate = new Date(draw.drawDate);
            nextDate.setUTCDate(nextDate.getUTCDate() + 7);
            const nextId = `draw-${nextDate.toISOString().slice(0, 10)}`;
            if (!mockLottoDraws.some((d) => d.id === nextId)) {
                mockLottoDraws.push({
                    id: nextId,
                    drawDate: nextDate.toISOString(),
                    winningNumbers: [],
                    superNumber: -1,
                    jackpot: nextJackpot,
                    status: "pending",
                    totalTickets: 0
                });
            }

            const totalPrizesPaid = winners.reduce((s, w) => s + w.prizeAmount, 0);
            mockLottoStats.totalDraws++;
            mockLottoStats.totalPrizePaid += totalPrizesPaid;
            if (draw.jackpot > mockLottoStats.biggestJackpot) mockLottoStats.biggestJackpot = draw.jackpot;
            return this.ok({ draw, totalTickets: ticketsForDraw.length, winners, totalPrizesPaid });
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
            return this.ok({
                draw,
                totalTickets: draw.totalTickets ?? 0,
                winners,
                totalPrizesPaid: winners.reduce((s, r) => s + r.prizeAmount, 0)
            });
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
                // Each ticket contributes rolloverPercentage% of its cost to the draw's jackpot
                const contrib = Math.floor(mockLottoConfig.ticketCost * (mockLottoConfig.rolloverPercentage / 100));
                if (contrib > 0) draw.jackpot += contrib;
                if (draw.totalTickets !== undefined) draw.totalTickets++;
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

        // ── Admin Credit ──────────────────────────────────────────────────────────

        // GET /api/credit/admin/config
        if (method === "GET" && /\/api\/credit\/admin\/config$/.test(url)) {
            return this.ok({ ...mockCoinConfig });
        }

        // PUT /api/credit/admin/config
        if (method === "PUT" && /\/api\/credit\/admin\/config$/.test(url)) {
            Object.assign(mockCoinConfig, body as Partial<typeof mockCoinConfig>);
            return this.ok({ ...mockCoinConfig });
        }

        // GET /api/credit/admin/wallets
        if (method === "GET" && /\/api\/credit\/admin\/wallets/.test(url)) {
            const entries = Object.values(mockUsers).map((u) => ({
                userId: u.id,
                username: u.username,
                displayName: u.displayName,
                balance: mockWallets[u.id]?.balance ?? 0,
                transactionCount: (mockWalletTransactions[u.id] ?? []).length
            }));
            entries.sort((a, b) => b.balance - a.balance);
            return this.ok(entries);
        }

        // GET /api/credit/admin/transactions
        if (method === "GET" && /\/api\/credit\/admin\/transactions/.test(url)) {
            const allTx = Object.values(mockWalletTransactions).flat();
            allTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const params = new URL(url, "http://localhost").searchParams;
            const page = Math.max(1, parseInt(params.get("page") ?? "1") || 1);
            const limit = Math.min(100, parseInt(params.get("limit") ?? "20") || 20);
            const start = (page - 1) * limit;
            return this.ok({ data: allTx.slice(start, start + limit), total: allTx.length, page, limit });
        }

        // POST /api/credit/admin/transfer
        if (method === "POST" && /\/api\/credit\/admin\/transfer$/.test(url)) {
            const payload = body as {
                toUserId: string;
                amount: number;
                type: "reward" | "penalty";
                description: string;
            } | null;
            if (!payload?.toUserId || !payload.amount) return this.error("Pflichtfelder fehlen", 400);
            const wallet = mockWallets[payload.toUserId];
            if (!wallet) return this.error("Wallet nicht gefunden", 404);
            if (payload.type === "reward") {
                wallet.balance += payload.amount;
            } else {
                wallet.balance = Math.max(0, wallet.balance - payload.amount);
            }
            const ts = new Date().toISOString();
            const tx = {
                id: "tx-admin-" + Math.random().toString(36).substring(2),
                fromUserId: MOCK_ADMIN_ID,
                toUserId: payload.toUserId,
                amount: payload.amount,
                type: "admin_transfer" as const,
                description: payload.type === "penalty" ? `[Abzug] ${payload.description}` : payload.description,
                createdAt: ts
            };
            (mockWalletTransactions[payload.toUserId] ??= []).unshift(tx);
            return this.ok(tx);
        }

        // POST /api/credit/admin/recalculate
        if (method === "POST" && /\/api\/credit\/admin\/recalculate$/.test(url)) {
            return this.ok({
                usersProcessed: Object.keys(mockUsers).length,
                totalCoinsAwarded: 1250,
                durationMs: 342,
                message: `Successfully recalculated ${Object.keys(mockUsers).length} user wallets.`
            });
        }

        // ── Notifications ────────────────────────────────────────────────────────

        // GET /api/notifications/unread-count  (must be before :id pattern)
        if (method === "GET" && /\/api\/notifications\/unread-count$/.test(url)) {
            const count = mockNotifications.filter((n) => !n.isRead).length;
            return this.ok({ count });
        }

        // GET /api/notifications
        if (method === "GET" && /\/api\/notifications$/.test(url)) {
            return this.ok(
                [...mockNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
        }

        // PATCH /api/notifications/read-all  (must be before :id/read)
        if (method === "PATCH" && /\/api\/notifications\/read-all$/.test(url)) {
            mockNotifications.forEach((n) => {
                n.isRead = true;
            });
            return this.ok({ success: true });
        }

        // PATCH /api/notifications/:id/read
        const notifReadMatch = url.match(/\/api\/notifications\/([^/]+)\/read$/);
        if (method === "PATCH" && notifReadMatch) {
            const notif = mockNotifications.find((n) => n.id === notifReadMatch[1]);
            if (notif) notif.isRead = true;
            return this.ok({ success: true });
        }

        // DELETE /api/notifications/:id
        const notifDeleteMatch = url.match(/\/api\/notifications\/([^/]+)$/);
        if (method === "DELETE" && notifDeleteMatch) {
            const idx = mockNotifications.findIndex((n) => n.id === notifDeleteMatch[1]);
            if (idx !== -1) mockNotifications.splice(idx, 1);
            return this.ok({ success: true });
        }

        // ── Messages ─────────────────────────────────────────────────────────────

        const CURRENT_USER_ID = "00000000-0000-0000-0000-000000000001";

        // GET /api/messages/conversations
        if (method === "GET" && /\/api\/messages\/conversations$/.test(url)) {
            return this.ok([...mockConversations]);
        }

        // GET /api/messages/conversations/:id
        const convDetailMatch = url.match(/\/api\/messages\/conversations\/([^/]+)$/);
        if (method === "GET" && convDetailMatch) {
            const convId = convDetailMatch[1]!;
            const detail = mockConversationDetails.get(convId);
            if (!detail) return this.error("Konversation nicht gefunden", 404);
            // Mark all messages as read
            detail.messages.forEach((m) => {
                m.isRead = true;
            });
            const conv = mockConversations.find((c) => c.id === convId);
            if (conv) conv.unreadCount = 0;
            return this.ok({ ...detail });
        }

        // POST /api/messages/conversations/:id/messages
        const convSendMatch = url.match(/\/api\/messages\/conversations\/([^/]+)\/messages$/);
        if (method === "POST" && convSendMatch) {
            const convId = convSendMatch[1]!;
            const detail = mockConversationDetails.get(convId);
            if (!detail) return this.error("Konversation nicht gefunden", 404);
            const payload = req.body as { content: string };
            const now = new Date().toISOString();
            const newMsg: Message = {
                id: `msg-${Date.now()}`,
                conversationId: convId,
                senderId: CURRENT_USER_ID,
                senderName: "Aniverse Admin",
                content: payload.content,
                isDraft: false,
                isRead: false,
                createdAt: now,
                updatedAt: now
            };
            detail.messages.push(newMsg);
            const conv = mockConversations.find((c) => c.id === convId);
            if (conv) {
                conv.lastMessage = payload.content.slice(0, 100);
                conv.lastMessageAt = now;
            }
            return this.ok(newMsg);
        }

        // POST /api/messages/conversations (create new)
        if (method === "POST" && /\/api\/messages\/conversations$/.test(url)) {
            const payload = req.body as { recipientId: string; subject?: string; content?: string };
            const now = new Date().toISOString();
            const newConv: Conversation = {
                id: `conv-${Date.now()}`,
                participantIds: [CURRENT_USER_ID, payload.recipientId],
                participants: [
                    { userId: CURRENT_USER_ID, username: "admin", displayName: "Aniverse Admin" },
                    { userId: payload.recipientId, username: "user", displayName: "Benutzer" }
                ],
                subject: payload.subject ?? null,
                lastMessage: payload.content?.slice(0, 100) ?? "",
                lastMessageAt: now,
                unreadCount: 0,
                initiatedByUserId: CURRENT_USER_ID,
                createdAt: now
            };
            mockConversations.unshift(newConv);
            const messages: Message[] = [];
            if (payload.content) {
                messages.push({
                    id: `msg-${Date.now()}`,
                    conversationId: newConv.id,
                    senderId: CURRENT_USER_ID,
                    senderName: "Aniverse Admin",
                    content: payload.content,
                    isDraft: false,
                    isRead: false,
                    createdAt: now,
                    updatedAt: now
                });
            }
            const detail: ConversationDetail = { conversation: newConv, messages };
            mockConversationDetails.set(newConv.id, detail);
            return this.ok(newConv);
        }

        // GET /api/messages/drafts
        if (method === "GET" && /\/api\/messages\/drafts$/.test(url)) {
            return this.ok([...mockDrafts]);
        }

        // POST /api/messages/drafts
        if (method === "POST" && /\/api\/messages\/drafts$/.test(url)) {
            const payload = req.body as { recipientId?: string; subject?: string; content: string };
            const now = new Date().toISOString();
            const draft: Draft = {
                id: `draft-${Date.now()}`,
                recipientId: payload.recipientId,
                subject: payload.subject,
                content: payload.content,
                createdAt: now,
                updatedAt: now
            };
            mockDrafts.unshift(draft);
            return this.ok(draft);
        }

        // DELETE /api/messages/drafts/:id
        const draftIdMatch = url.match(/\/api\/messages\/drafts\/([^/]+)$/);
        if (method === "DELETE" && draftIdMatch) {
            const draftId = draftIdMatch[1]!;
            const idx = mockDrafts.findIndex((d) => d.id === draftId);
            if (idx === -1) return this.error("Entwurf nicht gefunden", 404);
            mockDrafts.splice(idx, 1);
            return this.ok({ success: true });
        }

        // PATCH /api/messages/drafts/:id
        if (method === "PATCH" && draftIdMatch) {
            const draftId = draftIdMatch[1]!;
            const draft = mockDrafts.find((d) => d.id === draftId);
            if (!draft) return this.error("Entwurf nicht gefunden", 404);
            const patch = req.body as Partial<Draft>;
            Object.assign(draft, patch, { updatedAt: new Date().toISOString() });
            return this.ok({ ...draft });
        }

        // ── Blog ─────────────────────────────────────────────────────────────

        // GET /api/blog/categories
        if (method === "GET" && /\/api\/blog\/categories$/.test(url)) {
            return this.ok([...mockBlogCategories]);
        }

        // POST /api/blog/categories
        if (method === "POST" && /\/api\/blog\/categories$/.test(url)) {
            const payload = req.body as Partial<BlogCategory>;
            const newCat: BlogCategory = {
                id: `bc-${Date.now()}`,
                name: payload.name ?? "Neue Kategorie",
                slug: payload.slug ?? `kategorie-${Date.now()}`,
                description: payload.description ?? null,
                color: payload.color ?? "#6b7280",
                postCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockBlogCategories.push(newCat);
            return this.ok(newCat);
        }

        // PUT /api/blog/categories/:id
        const blogCatIdMatch = url.match(/\/api\/blog\/categories\/([^/]+)$/);
        if (method === "PUT" && blogCatIdMatch) {
            const catId = blogCatIdMatch[1]!;
            const cat = mockBlogCategories.find((c) => c.id === catId);
            if (!cat) return this.error("Kategorie nicht gefunden", 404);
            const payload = req.body as Partial<BlogCategory>;
            Object.assign(cat, payload, { updatedAt: new Date().toISOString() });
            return this.ok({ ...cat });
        }

        // DELETE /api/blog/categories/:id
        if (method === "DELETE" && blogCatIdMatch) {
            const catId = blogCatIdMatch[1]!;
            const idx = mockBlogCategories.findIndex((c) => c.id === catId);
            if (idx !== -1) mockBlogCategories.splice(idx, 1);
            return this.ok({ success: true });
        }

        // DELETE /api/blog/comments/:id  (must be before posts/:slug)
        const blogCommentIdMatch = url.match(/\/api\/blog\/comments\/([^/]+)$/);
        if (method === "DELETE" && blogCommentIdMatch) {
            const commentId = blogCommentIdMatch[1]!;
            for (const [postId, comments] of mockBlogCommentsByPost) {
                const idx = comments.findIndex((c) => c.id === commentId);
                if (idx !== -1) {
                    comments.splice(idx, 1);
                    // Also remove from detail
                    for (const [, detail] of mockBlogPostDetails) {
                        detail.comments = detail.comments
                            .filter((c) => c.id !== commentId)
                            .map((c) => ({ ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }));
                    }
                    const post = mockBlogPosts.find((p) => p.id === postId);
                    if (post) post.commentCount = Math.max(0, post.commentCount - 1);
                    break;
                }
                // check replies
                for (const c of comments) {
                    const rIdx = (c.replies ?? []).findIndex((r) => r.id === commentId);
                    if (rIdx !== -1) {
                        c.replies!.splice(rIdx, 1);
                        const post = mockBlogPosts.find((p) => p.id === postId);
                        if (post) post.commentCount = Math.max(0, post.commentCount - 1);
                        break;
                    }
                }
            }
            return this.ok({ success: true });
        }

        // GET /api/blog/posts/:postId/comments
        const blogPostCommentsMatch = url.match(/\/api\/blog\/posts\/([^/]+)\/comments$/);
        if (method === "GET" && blogPostCommentsMatch) {
            const postId = blogPostCommentsMatch[1]!;
            return this.ok(mockBlogCommentsByPost.get(postId) ?? []);
        }

        // POST /api/blog/posts/:postId/comments
        if (method === "POST" && blogPostCommentsMatch) {
            const postId = blogPostCommentsMatch[1]!;
            const payload = req.body as { content: string; parentId?: string };
            const newComment: BlogComment = {
                id: `bc-c${Date.now()}`,
                postId,
                authorId: MOCK_ADMIN_ID,
                authorName: "Aniverse Admin",
                authorAvatar: null,
                content: payload.content,
                parentId: payload.parentId ?? null,
                replies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const existing = mockBlogCommentsByPost.get(postId) ?? [];
            if (payload.parentId) {
                const parent = existing.find((c) => c.id === payload.parentId);
                if (parent) (parent.replies = parent.replies ?? []).push(newComment);
            } else {
                existing.push(newComment);
            }
            mockBlogCommentsByPost.set(postId, existing);
            // Update detail
            const detail = [...mockBlogPostDetails.values()].find((d) => d.id === postId);
            if (detail) {
                if (payload.parentId) {
                    const parent = detail.comments.find((c) => c.id === payload.parentId);
                    if (parent) (parent.replies = parent.replies ?? []).push(newComment);
                } else {
                    detail.comments.push(newComment);
                }
                detail.commentCount++;
            }
            const post = mockBlogPosts.find((p) => p.id === postId);
            if (post) post.commentCount++;
            return this.ok(newComment);
        }

        // GET /api/blog/posts  (list)
        if (method === "GET" && /\/api\/blog\/posts$/.test(url)) {
            // Admin gets all, otherwise only published
            const isAdminReq = url.includes("status=all");
            const list = isAdminReq ? mockBlogPosts : mockBlogPosts.filter((p) => p.status === "published");
            return this.ok(list.map((p) => ({ ...p, isOwner: p.authorId === MOCK_ADMIN_ID })));
        }

        // POST /api/blog/posts  (create)
        if (method === "POST" && /\/api\/blog\/posts$/.test(url)) {
            const payload = req.body as Partial<BlogPost>;
            const title = payload.title ?? "Neuer Artikel";
            const slug =
                title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") + `-${Date.now()}`;
            const now2 = new Date().toISOString();
            const cat = mockBlogCategories.find((c) => c.id === payload.categoryId);
            const newPost: BlogPost = {
                id: `bp-${Date.now()}`,
                title,
                slug,
                excerpt: payload.excerpt ?? null,
                content: payload.content ?? "",
                type: payload.type ?? "personal",
                status: payload.status ?? "draft",
                authorId: MOCK_ADMIN_ID,
                authorName: "Aniverse Admin",
                authorAvatar: null,
                categoryId: payload.categoryId ?? null,
                categoryName: cat?.name ?? null,
                categoryColor: cat?.color ?? null,
                coverImageUrl: payload.coverImageUrl ?? null,
                tags: payload.tags ?? [],
                viewCount: 0,
                commentCount: 0,
                allowComments: payload.allowComments ?? true,
                isOwner: true,
                publishedAt: payload.status === "published" ? now2 : null,
                createdAt: now2,
                updatedAt: now2
            };
            mockBlogPosts.unshift(newPost);
            mockBlogPostDetails.set(slug, { ...newPost, comments: [] });
            return this.ok({ ...newPost });
        }

        // PUT /api/blog/posts/:id  (update — id-based)
        const blogPostIdMatch = url.match(/\/api\/blog\/posts\/([^/]+)$/);
        if (method === "PUT" && blogPostIdMatch) {
            const postId = blogPostIdMatch[1]!;
            const post = mockBlogPosts.find((p) => p.id === postId);
            if (!post) return this.error("Artikel nicht gefunden", 404);
            const payload = req.body as Partial<BlogPost>;
            const oldSlug = post.slug;
            if (payload.title) {
                post.slug =
                    payload.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "") + `-${Date.now()}`;
            }
            Object.assign(post, payload, {
                updatedAt: new Date().toISOString(),
                isOwner: true,
                publishedAt: post.publishedAt ?? (payload.status === "published" ? new Date().toISOString() : null)
            });
            // Update detail map
            const oldDetail = mockBlogPostDetails.get(oldSlug);
            mockBlogPostDetails.delete(oldSlug);
            mockBlogPostDetails.set(post.slug, { ...(oldDetail ?? { ...post, comments: [] }), ...post });
            return this.ok({ ...post });
        }

        // DELETE /api/blog/posts/:id
        if (method === "DELETE" && blogPostIdMatch) {
            const postId = blogPostIdMatch[1]!;
            const idx = mockBlogPosts.findIndex((p) => p.id === postId);
            if (idx !== -1) {
                const [removed] = mockBlogPosts.splice(idx, 1);
                mockBlogPostDetails.delete(removed.slug);
            }
            return this.ok({ success: true });
        }

        // GET /api/blog/posts/:slug  (detail — slug-based)
        if (method === "GET" && blogPostIdMatch) {
            const slug = blogPostIdMatch[1]!;
            const detail = mockBlogPostDetails.get(slug);
            if (!detail) return this.error("Artikel nicht gefunden", 404);
            detail.viewCount++;
            const post = mockBlogPosts.find((p) => p.slug === slug);
            if (post) post.viewCount++;
            return this.ok({ ...detail, isOwner: detail.authorId === MOCK_ADMIN_ID });
        }

        // ── Gallery ──────────────────────────────────────────────────────────

        // GET /api/gallery/albums
        if (method === "GET" && url.match(/\/api\/gallery\/albums$/)) {
            const albums = mockGalleryAlbums.map((a) => ({ ...a, isOwner: a.ownerId === MOCK_ADMIN_ID }));
            return this.ok(albums);
        }

        // POST /api/gallery/albums
        if (method === "POST" && url.match(/\/api\/gallery\/albums$/)) {
            const payload = req.body as Partial<GalleryAlbum>;
            const newAlbum: GalleryAlbum = {
                id: `album-${Date.now()}`,
                title: (payload.title as string | undefined) ?? "Neues Album",
                description: payload.description ?? null,
                category: payload.category ?? null,
                coverUrl: null,
                ownerId: MOCK_ADMIN_ID,
                ownerName: "Aniverse Admin",
                ownerAvatar: null,
                accessLevel: payload.accessLevel ?? "public",
                watermarkEnabled: payload.watermarkEnabled ?? false,
                allowComments: payload.allowComments ?? true,
                allowRatings: payload.allowRatings ?? true,
                allowDownload: payload.allowDownload ?? true,
                tags: payload.tags ?? [],
                mediaCount: 0,
                isOwner: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockGalleryAlbums.unshift(newAlbum);
            mockGalleryAlbumDetails.set(newAlbum.id, { ...newAlbum, media: [] });
            return this.ok(newAlbum);
        }

        // GET /api/gallery/albums/:id
        const galleryAlbumIdMatch = url.match(/\/api\/gallery\/albums\/([^/]+)$/);
        if (method === "GET" && galleryAlbumIdMatch) {
            const albumId = galleryAlbumIdMatch[1]!;
            const detail = mockGalleryAlbumDetails.get(albumId);
            if (!detail) return this.error("Album nicht gefunden", 404);
            return this.ok({ ...detail, isOwner: detail.ownerId === MOCK_ADMIN_ID });
        }

        // DELETE /api/gallery/albums/:id
        if (method === "DELETE" && galleryAlbumIdMatch) {
            const albumId = galleryAlbumIdMatch[1]!;
            const idx = mockGalleryAlbums.findIndex((a) => a.id === albumId);
            if (idx !== -1) mockGalleryAlbums.splice(idx, 1);
            mockGalleryAlbumDetails.delete(albumId);
            return this.ok({ success: true });
        }

        // POST /api/gallery/albums/:albumId/media
        const galleryAlbumMediaMatch = url.match(/\/api\/gallery\/albums\/([^/]+)\/media$/);
        if (method === "POST" && galleryAlbumMediaMatch) {
            const albumId = galleryAlbumMediaMatch[1]!;
            const detail = mockGalleryAlbumDetails.get(albumId);
            if (!detail) return this.error("Album nicht gefunden", 404);
            const payload = req.body as Partial<GalleryMedia>;
            const newMedia: GalleryMedia = {
                id: `media-${Date.now()}`,
                albumId,
                ownerId: MOCK_ADMIN_ID,
                type: payload.type ?? "image",
                url: payload.url ?? "",
                youtubeId: payload.youtubeId ?? null,
                title: payload.title ?? null,
                description: payload.description ?? null,
                filename: null,
                mimeType: null,
                fileSize: null,
                width: null,
                height: null,
                takenAt: null,
                latitude: null,
                longitude: null,
                sortOrder: detail.media.length,
                commentCount: 0,
                averageRating: 0,
                userRating: null,
                isOwner: true,
                createdAt: new Date().toISOString()
            };
            detail.media.push(newMedia);
            const albumEntry = mockGalleryAlbums.find((a) => a.id === albumId);
            if (albumEntry) albumEntry.mediaCount++;
            return this.ok(newMedia);
        }

        // DELETE /api/gallery/media/:id
        const galleryMediaIdMatch = url.match(/\/api\/gallery\/media\/([^/]+)$/);
        if (method === "DELETE" && galleryMediaIdMatch) {
            const mediaId = galleryMediaIdMatch[1]!;
            for (const [, detail] of mockGalleryAlbumDetails) {
                const idx = detail.media.findIndex((m) => m.id === mediaId);
                if (idx !== -1) {
                    detail.media.splice(idx, 1);
                    const albumEntry = mockGalleryAlbums.find((a) => a.id === detail.id);
                    if (albumEntry) albumEntry.mediaCount = Math.max(0, albumEntry.mediaCount - 1);
                    break;
                }
            }
            return this.ok({ success: true });
        }

        // GET /api/gallery/media/:id/comments
        const galleryCommentsMatch = url.match(/\/api\/gallery\/media\/([^/]+)\/comments$/);
        if (method === "GET" && galleryCommentsMatch) {
            const mediaId = galleryCommentsMatch[1]!;
            return this.ok(mockGalleryCommentsByMedia.get(mediaId) ?? []);
        }

        // POST /api/gallery/media/:id/comments
        if (method === "POST" && galleryCommentsMatch) {
            const mediaId = galleryCommentsMatch[1]!;
            const payload = req.body as { content: string };
            const newComment: GalleryComment = {
                id: `comment-${Date.now()}`,
                mediaId,
                authorId: MOCK_ADMIN_ID,
                authorName: "Aniverse Admin",
                authorAvatar: null,
                content: payload.content,
                createdAt: new Date().toISOString()
            };
            const existing = mockGalleryCommentsByMedia.get(mediaId) ?? [];
            existing.push(newComment);
            mockGalleryCommentsByMedia.set(mediaId, existing);
            return this.ok(newComment);
        }

        // DELETE /api/gallery/comments/:id
        const galleryCommentIdMatch = url.match(/\/api\/gallery\/comments\/([^/]+)$/);
        if (method === "DELETE" && galleryCommentIdMatch) {
            const commentId = galleryCommentIdMatch[1]!;
            for (const [mediaId, comments] of mockGalleryCommentsByMedia) {
                const idx = comments.findIndex((c) => c.id === commentId);
                if (idx !== -1) {
                    comments.splice(idx, 1);
                    mockGalleryCommentsByMedia.set(mediaId, comments);
                    break;
                }
            }
            return this.ok({ success: true });
        }

        // POST /api/gallery/media/:id/rate
        const galleryRateMatch = url.match(/\/api\/gallery\/media\/([^/]+)\/rate$/);
        if (method === "POST" && galleryRateMatch) {
            return this.ok({ success: true });
        }

        // ── Marketplace ──────────────────────────────────────────────────────

        const MOCK_MEMBER_ID = "00000000-0000-0000-0000-000000000003";

        // GET /api/marketplace/categories
        if (method === "GET" && /\/api\/marketplace\/categories$/.test(url)) {
            return this.ok(Object.values(mockMarketCategories));
        }

        // GET /api/marketplace/admin/pending
        if (method === "GET" && /\/api\/marketplace\/admin\/pending$/.test(url)) {
            return this.ok(Object.values(mockMarketListings).filter((l) => l.status === "pending"));
        }

        // GET /api/marketplace/admin/reports
        if (method === "GET" && /\/api\/marketplace\/admin\/reports$/.test(url)) {
            return this.ok(Object.values(mockMarketReports));
        }

        // POST /api/marketplace/admin/:id/approve
        const marketAdminApproveMatch = url.match(/\/api\/marketplace\/admin\/([^/]+)\/approve$/);
        if (method === "POST" && marketAdminApproveMatch) {
            const id = marketAdminApproveMatch[1]!;
            const listing = mockMarketListings[id];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            listing.status = "active";
            listing.updatedAt = new Date().toISOString();
            return this.ok({ ...listing });
        }

        // POST /api/marketplace/admin/:id/reject
        const marketAdminRejectMatch = url.match(/\/api\/marketplace\/admin\/([^/]+)\/reject$/);
        if (method === "POST" && marketAdminRejectMatch) {
            const id = marketAdminRejectMatch[1]!;
            const listing = mockMarketListings[id];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            listing.status = "archived";
            listing.updatedAt = new Date().toISOString();
            return this.ok({ ...listing });
        }

        // PATCH /api/marketplace/admin/reports/:id
        const marketAdminReportPatchMatch = url.match(/\/api\/marketplace\/admin\/reports\/([^/]+)$/);
        if (method === "PATCH" && marketAdminReportPatchMatch) {
            const id = marketAdminReportPatchMatch[1]!;
            const report = mockMarketReports[id];
            if (!report) return this.error("Meldung nicht gefunden", 404);
            const patch = req.body as Partial<MarketReport>;
            Object.assign(report, patch, { updatedAt: new Date().toISOString() });
            return this.ok({ ...report });
        }

        // GET /api/marketplace/listings/my-offers
        if (method === "GET" && /\/api\/marketplace\/listings\/my-offers$/.test(url)) {
            return this.ok(Object.values(mockMarketOffers).filter((o) => o.senderId === MOCK_MEMBER_ID));
        }

        // GET /api/marketplace/listings/my
        if (method === "GET" && /\/api\/marketplace\/listings\/my$/.test(url)) {
            return this.ok(Object.values(mockMarketListings).filter((l) => l.authorId === MOCK_MEMBER_ID));
        }

        // POST /api/marketplace/listings/:id/close
        const marketListingCloseMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/close$/);
        if (method === "POST" && marketListingCloseMatch) {
            const id = marketListingCloseMatch[1]!;
            const listing = mockMarketListings[id];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            listing.status = "closed";
            listing.updatedAt = new Date().toISOString();
            return this.ok({ ...listing });
        }

        // POST /api/marketplace/listings/:id/report
        const marketListingReportMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/report$/);
        if (method === "POST" && marketListingReportMatch) {
            const id = marketListingReportMatch[1]!;
            const listing = mockMarketListings[id];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            const payload = req.body as { reason: string };
            const reportId = `rep-${Date.now()}`;
            const newReport: MarketReport = {
                id: reportId,
                listingId: id,
                listingTitle: listing.title,
                reporterId: MOCK_MEMBER_ID,
                reason: payload.reason,
                status: "pending",
                moderatorNote: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockMarketReports[reportId] = newReport;
            return this.ok(null);
        }

        // POST /api/marketplace/listings/:id/offers/:offerId/accept
        const marketOfferAcceptMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/offers\/([^/]+)\/accept$/);
        if (method === "POST" && marketOfferAcceptMatch) {
            const offerId = marketOfferAcceptMatch[2]!;
            const listingId = marketOfferAcceptMatch[1]!;
            const offer = mockMarketOffers[offerId];
            if (!offer) return this.error("Angebot nicht gefunden", 404);
            offer.status = "accepted";
            offer.updatedAt = new Date().toISOString();
            const listing = mockMarketListings[listingId];
            if (listing) {
                listing.status = "sold";
                listing.bestOfferId = offerId;
            }
            return this.ok({ ...offer });
        }

        // POST /api/marketplace/listings/:id/offers/:offerId/reject
        const marketOfferRejectMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/offers\/([^/]+)\/reject$/);
        if (method === "POST" && marketOfferRejectMatch) {
            const offerId = marketOfferRejectMatch[2]!;
            const offer = mockMarketOffers[offerId];
            if (!offer) return this.error("Angebot nicht gefunden", 404);
            offer.status = "rejected";
            offer.updatedAt = new Date().toISOString();
            return this.ok({ ...offer });
        }

        // POST /api/marketplace/listings/:id/offers/:offerId/counter
        const marketOfferCounterMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/offers\/([^/]+)\/counter$/);
        if (method === "POST" && marketOfferCounterMatch) {
            const offerId = marketOfferCounterMatch[2]!;
            const offer = mockMarketOffers[offerId];
            if (!offer) return this.error("Angebot nicht gefunden", 404);
            const payload = req.body as { counterAmount?: number | null; counterMessage: string };
            offer.status = "countered";
            offer.counterAmount = payload.counterAmount ?? null;
            offer.counterMessage = payload.counterMessage;
            offer.updatedAt = new Date().toISOString();
            return this.ok({ ...offer });
        }

        // DELETE /api/marketplace/listings/:id/offers/:offerId (withdraw)
        const marketOfferDeleteMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/offers\/([^/]+)$/);
        if (method === "DELETE" && marketOfferDeleteMatch) {
            const offerId = marketOfferDeleteMatch[2]!;
            const offer = mockMarketOffers[offerId];
            if (offer) {
                offer.status = "withdrawn";
                offer.updatedAt = new Date().toISOString();
            }
            return this.ok(null);
        }

        // PATCH /api/marketplace/listings/:id/offers/:offerId
        if (method === "PATCH" && marketOfferDeleteMatch) {
            const offerId = marketOfferDeleteMatch[2]!;
            const offer = mockMarketOffers[offerId];
            if (!offer) return this.error("Angebot nicht gefunden", 404);
            const patch = req.body as Partial<MarketOffer>;
            Object.assign(offer, patch, { updatedAt: new Date().toISOString() });
            return this.ok({ ...offer });
        }

        // GET /api/marketplace/listings/:id/offers
        const marketOffersMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/offers$/);
        if (method === "GET" && marketOffersMatch) {
            const listingId = marketOffersMatch[1]!;
            return this.ok(Object.values(mockMarketOffers).filter((o) => o.listingId === listingId));
        }

        // POST /api/marketplace/listings/:id/offers
        if (method === "POST" && marketOffersMatch) {
            const listingId = marketOffersMatch[1]!;
            const listing = mockMarketListings[listingId];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            const payload = req.body as { amount?: number | null; message: string };
            const offerId = `offer-${Date.now()}`;
            const newOffer: MarketOffer = {
                id: offerId,
                listingId,
                senderId: MOCK_MEMBER_ID,
                senderName: "NarutoFan99",
                senderAvatarUrl: null,
                amount: payload.amount ?? null,
                message: payload.message,
                status: "pending",
                counterAmount: null,
                counterMessage: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockMarketOffers[offerId] = newOffer;
            listing.offerCount++;
            return this.ok(newOffer);
        }

        // GET /api/marketplace/listings/:id/ratings
        const marketRatingsMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/ratings$/);
        if (method === "GET" && marketRatingsMatch) {
            const listingId = marketRatingsMatch[1]!;
            return this.ok(Object.values(mockMarketRatings).filter((r) => r.listingId === listingId));
        }

        // POST /api/marketplace/listings/:id/ratings
        if (method === "POST" && marketRatingsMatch) {
            const listingId = marketRatingsMatch[1]!;
            const payload = req.body as { offerId: string; ratedUserId: string; score: number; text?: string };
            const ratingId = `rating-${Date.now()}`;
            const newRating = {
                id: ratingId,
                listingId,
                offerId: payload.offerId,
                raterId: MOCK_MEMBER_ID,
                raterName: "NarutoFan99",
                raterAvatarUrl: null,
                ratedUserId: payload.ratedUserId,
                score: payload.score,
                text: payload.text ?? null,
                reply: null,
                createdAt: new Date().toISOString()
            };
            mockMarketRatings[ratingId] = newRating;
            return this.ok(newRating);
        }

        // DELETE /api/marketplace/listings/:id/comments/:commentId
        const marketCommentDeleteMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/comments\/([^/]+)$/);
        if (method === "DELETE" && marketCommentDeleteMatch) {
            const commentId = marketCommentDeleteMatch[2]!;
            delete mockMarketComments[commentId];
            return this.ok(null);
        }

        // GET /api/marketplace/listings/:id/comments
        const marketCommentsMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)\/comments$/);
        if (method === "GET" && marketCommentsMatch) {
            const listingId = marketCommentsMatch[1]!;
            const topLevel = Object.values(mockMarketComments).filter((c) => c.listingId === listingId && !c.parentId);
            // Build tree
            const tree = topLevel.map((c) => ({
                ...c,
                replies: Object.values(mockMarketComments).filter(
                    (r) => r.parentId === c.id && r.listingId === listingId
                )
            }));
            return this.ok(tree);
        }

        // POST /api/marketplace/listings/:id/comments
        if (method === "POST" && marketCommentsMatch) {
            const listingId = marketCommentsMatch[1]!;
            const payload = req.body as { content: string; parentId?: string | null };
            const commentId = `mc-${Date.now()}`;
            const newComment: MarketComment = {
                id: commentId,
                listingId,
                authorId: MOCK_MEMBER_ID,
                authorName: "NarutoFan99",
                authorAvatarUrl: null,
                content: payload.content,
                parentId: payload.parentId ?? null,
                isEdited: false,
                replies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockMarketComments[commentId] = newComment;
            const listing = mockMarketListings[listingId];
            if (listing) listing.commentCount++;
            return this.ok(newComment);
        }

        // GET /api/marketplace/listings (paginated) — must be before /:id
        if (method === "GET" && /\/api\/marketplace\/listings(\?|$)/.test(url)) {
            const params = new URL(url, "http://localhost").searchParams;
            const page = parseInt(params.get("page") ?? "1", 10);
            const limit = parseInt(params.get("limit") ?? "12", 10);
            const categoryId = params.get("categoryId");
            const type = params.get("type");
            const search = params.get("search");

            let all = Object.values(mockMarketListings).filter((l) => l.status === "active");
            if (categoryId) all = all.filter((l) => l.categoryId === categoryId);
            if (type) all = all.filter((l) => l.type === type);
            if (search) {
                const q = search.toLowerCase();
                all = all.filter(
                    (l) =>
                        l.title.toLowerCase().includes(q) ||
                        l.description.toLowerCase().includes(q) ||
                        l.tags.some((t) => t.toLowerCase().includes(q))
                );
            }
            const total = all.length;
            const data = all.slice((page - 1) * limit, page * limit);
            return this.ok({ data, total, page, limit });
        }

        // POST /api/marketplace/listings (create)
        if (method === "POST" && /\/api\/marketplace\/listings$/.test(url)) {
            const payload = req.body as {
                title: string;
                description: string;
                price?: number | null;
                currency?: string;
                type: string;
                categoryId: string;
                tags?: string[];
                expiresAt?: string | null;
            };
            const category = mockMarketCategories[payload.categoryId];
            const listingId = `listing-${Date.now()}`;
            const newListing: MarketListing = {
                id: listingId,
                title: payload.title,
                description: payload.description,
                price: payload.price ?? null,
                currency: payload.currency ?? "EUR",
                type: payload.type as MarketListing["type"],
                status: category?.requiresApproval ? "pending" : "active",
                categoryId: payload.categoryId,
                categoryName: category?.name ?? "Unbekannt",
                authorId: MOCK_MEMBER_ID,
                authorName: "NarutoFan99",
                authorAvatarUrl: null,
                images: [],
                customFields: null,
                tags: payload.tags ?? [],
                expiresAt: payload.expiresAt ?? null,
                viewCount: 0,
                offerCount: 0,
                commentCount: 0,
                bestOfferId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockMarketListings[listingId] = newListing;
            return this.ok(newListing);
        }

        // PATCH /api/marketplace/listings/:id
        const marketListingDetailMatch = url.match(/\/api\/marketplace\/listings\/([^/]+)$/);
        if (method === "PATCH" && marketListingDetailMatch) {
            const id = marketListingDetailMatch[1]!;
            const listing = mockMarketListings[id];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            const patch = req.body as Partial<MarketListing>;
            Object.assign(listing, patch, { updatedAt: new Date().toISOString() });
            return this.ok({ ...listing });
        }

        // DELETE /api/marketplace/listings/:id
        if (method === "DELETE" && marketListingDetailMatch) {
            const id = marketListingDetailMatch[1]!;
            if (!mockMarketListings[id]) return this.error("Inserat nicht gefunden", 404);
            delete mockMarketListings[id];
            return this.ok(null);
        }

        // GET /api/marketplace/listings/:id
        if (method === "GET" && marketListingDetailMatch) {
            const id = marketListingDetailMatch[1]!;
            const listing = mockMarketListings[id];
            if (!listing) return this.error("Inserat nicht gefunden", 404);
            listing.viewCount++;
            return this.ok({ ...listing });
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
