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

import { Post } from "../../models/forum/post";
import { Thread } from "../../models/forum/thread";
import { User } from "../../models/user/user";
import { mockCategories, mockForums, mockPosts, mockThreads, mockUsers } from "../mock-data/mock-data";

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
                exp: Date.now() + 1000 * 60 * 60 // 1h
            };
            const fakeToken = btoa(JSON.stringify(fakeTokenPayload));

            const response: LoginResponse = {
                token: fakeToken,
                user: { ...user }
            };

            return this.ok(response);
        }

        // GET /api/forum/categories
        if (method === "GET" && lowerUrl.match(/\/api\/forum\/categories$/)) {
            const categories = Object.values(mockCategories).map((cat) => ({
                ...cat,
                forums: undefined
            }));
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
            const newThread: Thread = {
                id: "t_" + Math.random().toString(36).substring(2),
                forumId,
                authorId: "u1",
                title: payload.title,
                slug: payload.title.toLowerCase().replace(/\s+/g, "-"),
                isPinned: false,
                isLocked: false,
                isSticky: false,
                viewCount: 0,
                replyCount: 0,
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
            const newPost: Post = {
                id: "p_" + Math.random().toString(36).substring(2),
                threadId,
                authorId: "u1",
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
