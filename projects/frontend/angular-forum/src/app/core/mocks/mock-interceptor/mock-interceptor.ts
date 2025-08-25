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
import { mockCategories, mockForums, mockThreads, mockUsers, mockUserSummaries } from "../mock-data/mock-data";

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

        // GET /forums
        if (method === "GET" && lowerUrl.endsWith("/forums")) {
            const categories = Object.values(mockCategories).map((cat) => ({
                ...cat,
                subforums: cat.subforums ?? []
            }));
            return this.ok({ categories });
        }

        // GET /forum/:id/threads
        const forumThreadsMatch = lowerUrl.match(/\/forum\/([^/]+)\/threads$/);
        if (method === "GET" && forumThreadsMatch) {
            const forumId = forumThreadsMatch[1];
            const forum = mockForums[forumId];
            if (!forum) {
                return this.error("Forum nicht gefunden", 404);
            }

            // For demo: return all threads (could be filtered by forumId if stored)
            const threads = Object.values(mockThreads).map<{
                id: string;
                title: string;
                author: unknown;
                lastPostAt: string;
                replyCount: number;
            }>((t) => ({
                id: t.id,
                title: t.title,
                author: t.author,
                lastPostAt: t.lastPostAt,
                replyCount: t.replyCount
            }));

            return this.ok({ forumId, threads });
        }

        // GET /thread/:id
        const threadMatch = lowerUrl.match(/\/thread\/([^/]+)$/);
        if (method === "GET" && threadMatch) {
            const threadId = threadMatch[1];
            const thread = mockThreads[threadId];
            if (!thread) {
                return this.error("Thread nicht gefunden", 404);
            }
            return this.ok({ thread });
        }

        // POST /thread/:id/reply
        const replyMatch = lowerUrl.match(/\/thread\/([^/]+)\/reply$/);
        if (method === "POST" && replyMatch) {
            const threadId = replyMatch[1];
            const payload = body as {
                content: string;
                authorId: string;
                replyToPostId?: string;
            } | null;
            if (!payload) {
                return this.error("Fehlender Request-Body", 400);
            }
            const { content, authorId, replyToPostId } = payload;

            const thread = mockThreads[threadId] as Thread | undefined;
            if (!thread) {
                return this.error("Thread nicht gefunden", 404);
            }

            const authorSummary = mockUserSummaries[authorId];
            if (!authorSummary) {
                return this.error("Author nicht gefunden", 400);
            }

            const newPost: Post = {
                id: "p_" + Math.random().toString(36).substring(2),
                threadId: thread.id,
                author: authorSummary,
                content: content,
                createdAt: new Date().toISOString(),
                isEdited: false,
                replyToPostId: replyToPostId
            };

            // State mutieren (Mock)
            thread.posts.push(newPost);
            thread.replyCount = thread.posts.length - 1;
            thread.lastPostAt = newPost.createdAt;

            return this.ok({ post: newPost });
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
