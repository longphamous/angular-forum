import { Injectable, signal, WritableSignal } from "@angular/core";
import { Observable, of } from "rxjs";

import { Post } from "../../core/models/forum/post";
import { Thread } from "../../core/models/forum/thread";

@Injectable({ providedIn: "root" })
export class ThreadFacade {
  private _currentThread: WritableSignal<Thread | null> = signal(null);
  currentThread = this._currentThread.asReadonly();

  // Lädt Thread (mock)
  loadThread(threadId: string): void {
    // hier später echten HTTP-Call ersetzen
    const mock: Thread = {
      /* gefüllte Dummy-Daten */
    } as any;
    this._currentThread.set(mock);
  }

  // Antwort posten
  postReply(threadId: string, content: string): Observable<Post> {
    const newPost: Post = {
      id: "p_" + Math.random().toString(36).substring(2),
      threadId,
      author: { id: "u1", username: "demo", displayName: "Demo" },
      content,
      createdAt: new Date().toISOString(),
      isEdited: false,
    } as any;
    // Update internal state
    const current = this._currentThread();
    if (current) {
      current.posts.push(newPost);
      this._currentThread.set({ ...current });
    }
    return of(newPost);
  }
}
