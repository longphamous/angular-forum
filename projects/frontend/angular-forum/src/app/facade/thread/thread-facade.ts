import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { Observable } from "rxjs";

import { Post } from "../../core/models/forum/post";
import { Thread } from "../../core/models/forum/thread";

interface ReplyRequest {
    content: string;
}

@Injectable({ providedIn: "root" })
export class ThreadFacade {
    readonly currentThread: ReturnType<WritableSignal<Thread | null>["asReadonly"]>;

    private readonly http = inject(HttpClient);
    private readonly _currentThread: WritableSignal<Thread | null> = signal<Thread | null>(null);

    constructor() {
        this.currentThread = this._currentThread.asReadonly();
    }

    loadThread(threadId: string): void {
        this.http.get<Thread>(`/api/forum/threads/${threadId}`).subscribe({
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
        return this.http.post<Post>(`/api/forum/threads/${threadId}/posts`, payload);
    }
}
