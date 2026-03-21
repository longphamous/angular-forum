import { Injectable, Logger } from "@nestjs/common";

import { PushEventType } from "./push-event.types";

import { PushGateway } from "./push.gateway";

@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);

    constructor(private readonly gateway: PushGateway) {}

    sendToUser(userId: string, event: PushEventType, payload: unknown): void {
        try {
            this.gateway.server.to(`user:${userId}`).emit(event, payload);
        } catch (err) {
            this.logger.error(`Failed ${event} → user:${userId}: ${(err as Error).message}`);
        }
    }

    sendToThread(threadId: string, event: PushEventType, payload: unknown): void {
        try {
            this.gateway.server.to(`thread:${threadId}`).emit(event, payload);
        } catch (err) {
            this.logger.error(`Failed ${event} → thread:${threadId}: ${(err as Error).message}`);
        }
    }

    sendToConversation(conversationId: string, event: PushEventType, payload: unknown): void {
        try {
            this.gateway.server.to(`conversation:${conversationId}`).emit(event, payload);
        } catch (err) {
            this.logger.error(`Failed ${event} → conversation:${conversationId}: ${(err as Error).message}`);
        }
    }

    broadcast(event: PushEventType, payload: unknown): void {
        try {
            this.gateway.server.emit(event, payload);
        } catch (err) {
            this.logger.error(`Failed broadcast ${event}: ${(err as Error).message}`);
        }
    }

    getOnlineUserIds(): string[] {
        return [...this.gateway.userSockets.keys()];
    }

    isUserOnline(userId: string): boolean {
        const s = this.gateway.userSockets.get(userId);
        return !!s && s.size > 0;
    }

    getOnlineCount(): number {
        return this.gateway.userSockets.size;
    }
}
