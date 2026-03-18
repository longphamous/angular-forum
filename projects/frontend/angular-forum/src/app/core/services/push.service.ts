import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { io, Socket } from "socket.io-client";

import { API_CONFIG, ApiConfig } from "../config/api.config";
import { PUSH_EVENTS, PushEventType } from "../models/push/push-events";

/**
 * Angular service wrapping a Socket.IO client for real-time push events.
 *
 * Usage:
 *   - Call `connect(token)` after login / token restore
 *   - Call `disconnect()` on logout
 *   - Subscribe to typed events via `on<T>(eventName)`
 *   - Join/leave rooms for scoped events (threads, conversations)
 */
@Injectable({ providedIn: "root" })
export class PushService implements OnDestroy {
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private socket: Socket | null = null;
    private readonly subjects = new Map<string, Subject<unknown>>();

    /** Whether the WebSocket connection is currently established. */
    readonly connected = signal(false);

    // ─── Connection lifecycle ─────────────────────────────────────────────────

    connect(token: string): void {
        if (this.socket?.connected) return;

        // Derive WS base from API base (e.g. http://localhost:3000/api → http://localhost:3000)
        const wsBase = this.apiConfig.baseUrl.replace(/\/api\/?$/, "");

        this.socket = io(`${wsBase}/push`, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        this.socket.on("connect", () => this.connected.set(true));
        this.socket.on("disconnect", () => this.connected.set(false));

        // Handle auth errors (expired token)
        this.socket.on("connect_error", (err) => {
            if (err.message.includes("token") || err.message.includes("Authentication")) {
                console.warn("[PushService] Auth error — disconnecting:", err.message);
                this.disconnect();
            }
        });

        // Register listeners for all known event types
        for (const event of PUSH_EVENTS) {
            this.socket.on(event, (payload: unknown) => {
                this.getSubject(event).next(payload);
            });
        }
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected.set(false);
    }

    /** Subscribe to a specific push event type. */
    on<T>(event: PushEventType): Observable<T> {
        return this.getSubject(event).asObservable() as Observable<T>;
    }

    // ─── Room management ──────────────────────────────────────────────────────

    joinThread(threadId: string): void {
        this.socket?.emit("thread:join", threadId);
    }

    leaveThread(threadId: string): void {
        this.socket?.emit("thread:leave", threadId);
    }

    joinConversation(conversationId: string): void {
        this.socket?.emit("conversation:join", conversationId);
    }

    leaveConversation(conversationId: string): void {
        this.socket?.emit("conversation:leave", conversationId);
    }

    emitTyping(conversationId: string): void {
        this.socket?.emit("message:typing", conversationId);
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    ngOnDestroy(): void {
        this.disconnect();
    }

    private getSubject(event: string): Subject<unknown> {
        let subject = this.subjects.get(event);
        if (!subject) {
            subject = new Subject<unknown>();
            this.subjects.set(event, subject);
        }
        return subject;
    }
}
