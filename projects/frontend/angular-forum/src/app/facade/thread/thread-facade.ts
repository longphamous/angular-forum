import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { Observable } from "rxjs";

import { FORUM_ROUTES } from "../../core/api/forum.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { Post } from "../../core/models/forum/post";
import { Thread } from "../../core/models/forum/thread";

interface ReplyRequest {
    content: string;
}

@Injectable({ providedIn: "root" })
export class ThreadFacade {
    readonly currentThread: ReturnType<WritableSignal<Thread | null>["asReadonly"]>;

    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly _currentThread: WritableSignal<Thread | null> = signal<Thread | null>(null);

    constructor() {
        this.currentThread = this._currentThread.asReadonly();
    }

    loadThread(threadId: string): void {
        this.http.get<Thread>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.threads.detail(threadId)}`).subscribe({
            next: (thread) => {
                this._currentThread.set(thread);
            },
            error: (err) => {
                console.error("Fehler beim Laden des Threads", err);
            }
        });
    }

    postReply(threadId: string, content: string): Observable<Post> {
        const payload: ReplyRequest = { content };
        return this.http.post<Post>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.threads.posts(threadId)}`, payload);
    }
}
