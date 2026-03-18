import { Injectable } from "@nestjs/common";

import { PushEventType } from "./push-event.types";

/**
 * No-op implementation of PushService.
 *
 * Used when PUSH_ENABLED=false. All methods silently do nothing,
 * so existing services that inject PushService keep working.
 */
@Injectable()
export class PushServiceNoop {
    sendToUser(_userId: string, _event: PushEventType, _payload: unknown): void {
        /* noop */
    }

    sendToThread(_threadId: string, _event: PushEventType, _payload: unknown): void {
        /* noop */
    }

    sendToConversation(_conversationId: string, _event: PushEventType, _payload: unknown): void {
        /* noop */
    }

    broadcast(_event: PushEventType, _payload: unknown): void {
        /* noop */
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
}
