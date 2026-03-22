import { Injectable, Logger } from "@nestjs/common";

import { PushEventType } from "./push-event.types";

/**
 * Remote push service that forwards events via HTTP to a standalone push server.
 * Used when `PUSH_MODE=remote` and `PUSH_SERVER_URL` is configured.
 */
@Injectable()
export class PushServiceRemote {
    private readonly logger = new Logger(PushServiceRemote.name);
    private readonly pushServerUrl: string;

    constructor() {
        this.pushServerUrl = process.env["PUSH_SERVER_URL"] ?? "http://localhost:3001/api/push";
        this.logger.log(`Remote push service configured → ${this.pushServerUrl}`);
    }

    sendToUser(userId: string, event: PushEventType, payload: unknown): void {
        this.logger.log(`→ ${event} → user:${userId.slice(0, 8)}… (via remote)`);
        void this.emit({ target: "user", targetId: userId, event, payload });
    }

    sendToThread(threadId: string, event: PushEventType, payload: unknown): void {
        void this.emit({ target: "thread", targetId: threadId, event, payload });
    }

    sendToConversation(conversationId: string, event: PushEventType, payload: unknown): void {
        void this.emit({ target: "conversation", targetId: conversationId, event, payload });
    }

    broadcast(event: PushEventType, payload: unknown): void {
        void this.emit({ target: "broadcast", event, payload });
    }

    getOnlineUserIds(): string[] {
        return [];
    }

    isUserOnline(_userId: string): boolean {
        return false;
    }

    getOnlineCount(): number {
        return 0;
    }

    private async emit(body: Record<string, unknown>): Promise<void> {
        try {
            const res = await fetch(`${this.pushServerUrl}/emit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(3000)
            });
            if (!res.ok) {
                this.logger.warn(`Push server responded with ${res.status}`);
            }
        } catch (err) {
            this.logger.warn(`Failed to reach push server: ${(err as Error).message}`);
        }
    }
}
