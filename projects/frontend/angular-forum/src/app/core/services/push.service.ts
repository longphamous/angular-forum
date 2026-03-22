import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { Observable, ReplaySubject } from "rxjs";
import { io, Socket } from "socket.io-client";

import { environment } from "../../../environments/environment";
import { API_CONFIG, ApiConfig } from "../config/api.config";
import { PUSH_EVENTS, PushEventType } from "../models/push/push-events";

@Injectable({ providedIn: "root" })
export class PushService implements OnDestroy {
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private socket: Socket | null = null;
    private readonly subjects = new Map<string, ReplaySubject<unknown>>();

    readonly connected = signal(false);

    connect(token: string): void {
        // Clean up existing socket if any
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        // Use dedicated push URL if configured, otherwise derive from API URL
        const wsBase = environment.pushUrl || this.apiConfig.baseUrl.replace(/\/api\/?$/, "");
        console.log("[PushService] Connecting to", `${wsBase}/push`);

        this.socket = io(`${wsBase}/push`, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        this.socket.on("connect", () => {
            console.log("[PushService] Connected (id:", this.socket?.id, ")");
            this.connected.set(true);
        });

        this.socket.on("disconnect", (reason) => {
            console.log("[PushService] Disconnected:", reason);
            this.connected.set(false);
        });

        this.socket.on("connect_error", (err) => {
            console.warn("[PushService] Connection error:", err.message);
            if (err.message.includes("token") || err.message.includes("Authentication")) {
                this.disconnect();
            }
        });

        // Register listeners for ALL known event types
        for (const event of PUSH_EVENTS) {
            this.socket.on(event, (payload: unknown) => {
                console.log(`[PushService] ← ${event}`, payload);
                this.getSubject(event).next(payload);
            });
        }
    }

    disconnect(): void {
        if (this.socket) {
            console.log("[PushService] Disconnecting");
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected.set(false);
    }

    on<T>(event: PushEventType): Observable<T> {
        return this.getSubject(event).asObservable() as Observable<T>;
    }

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

    ngOnDestroy(): void {
        this.disconnect();
    }

    private getSubject(event: string): ReplaySubject<unknown> {
        let subject = this.subjects.get(event);
        if (!subject) {
            // ReplaySubject(1) ensures late subscribers get the last event
            subject = new ReplaySubject<unknown>(1);
            this.subjects.set(event, subject);
        }
        return subject;
    }
}
