import { Injectable, Logger } from "@nestjs/common";

import { PushGateway } from "./push.gateway";
import { PushEventType } from "./push-event.types";

/**
 * Global service for broadcasting real-time push events.
 *
 * Inject this into any module's service to send targeted events
 * to specific users, threads, or conversations.
 */
@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);

    constructor(private readonly gateway: PushGateway) {}

    /** Send an event to a specific user (all their connected tabs). */
    sendToUser(userId: string, event: PushEventType, payload: unknown): void {
        this.gateway.server.to(`user:${userId}`).emit(event, payload);
        this.logger.debug(`→ ${event} to user:${userId}`);
    }

    /** Send an event to all clients currently viewing a thread. */
    sendToThread(threadId: string, event: PushEventType, payload: unknown): void {
        this.gateway.server.to(`thread:${threadId}`).emit(event, payload);
        this.logger.debug(`→ ${event} to thread:${threadId}`);
    }

    /** Send an event to all clients currently viewing a conversation. */
    sendToConversation(conversationId: string, event: PushEventType, payload: unknown): void {
        this.gateway.server.to(`conversation:${conversationId}`).emit(event, payload);
        this.logger.debug(`→ ${event} to conversation:${conversationId}`);
    }

    /** Broadcast to all connected clients. */
    broadcast(event: PushEventType, payload: unknown): void {
        this.gateway.server.emit(event, payload);
    }

    /** Get currently connected (online) user IDs. */
    getOnlineUserIds(): string[] {
        return [...this.gateway.userSockets.keys()];
    }

    /** Check whether a specific user has at least one connected socket. */
    isUserOnline(userId: string): boolean {
        const sockets = this.gateway.userSockets.get(userId);
        return !!sockets && sockets.size > 0;
    }

    /** Get count of currently connected unique users. */
    getOnlineCount(): number {
        return this.gateway.userSockets.size;
    }
}
