import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { Post } from "../../core/models/forum/post";
import { Thread } from "../../core/models/forum/thread";

interface ThreadResponse {
  thread: Thread;
}

interface ReplyRequest {
  authorId: string;
  content: string;
  replyToPostId?: string;
}

interface ReplyResponse {
  post: Post;
}

@Injectable({ providedIn: "root" })
export class ThreadFacade {
  private readonly http = inject(HttpClient);

  private _currentThread: WritableSignal<Thread | null> = signal<Thread | null>(
    null,
  );

  private readonly currentThread = this._currentThread.asReadonly();

  loadThread(threadId: string): void {
    this.http.get<ThreadResponse>(`/thread/${threadId}`).subscribe({
      next: (res) => {
        this._currentThread.set(res.thread);
      },
      error: (err) => {
        console.error("Fehler beim Laden des Threads", err);
        // Hier ggf. Toast / Error State setzen
      },
    });
  }

  postReply(
    threadId: string,
    content: string,
    authorId: string,
    replyToPostId?: string,
  ): Observable<ReplyResponse> {
    const payload: ReplyRequest = {
      content,
      authorId,
      replyToPostId,
    };
    return this.http
      .post<ReplyResponse>(`/thread/${threadId}/reply`, payload)
      .pipe(
        tap((res) => {
          const current = this._currentThread();
          if (current) {
            // Update Zustand immutabel
            const updatedPosts = [...current.posts, res.post];
            const updatedThread: Thread = {
              ...current,
              posts: updatedPosts,
              replyCount: updatedPosts.length - 1,
              lastPostAt: res.post.createdAt,
            };
            this._currentThread.set(updatedThread);
          }
        }),
      );
  }
}
