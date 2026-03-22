import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Subscription } from "rxjs";

import { NOTIFICATIONS_ROUTES } from "../api/notifications.routes";
import { API_CONFIG, ApiConfig } from "../config/api.config";
import { AppNotification } from "../models/notifications/notification";
import { PushNotificationNew } from "../models/push/push-events";
import { PushService } from "./push.service";

@Injectable({ providedIn: "root" })
export class NotificationService {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly pushService = inject(PushService);

    readonly unreadCount = signal(0);
    readonly notifications = signal<AppNotification[]>([]);
    readonly loading = signal(false);

    private pushSub?: Subscription;
    private started = false;

    /**
     * Initialize push-based notification listening.
     * Fetches current unread count once, then relies entirely on
     * WebSocket push events for real-time updates.
     */
    start(): void {
        if (this.started) return;
        this.started = true;

        // One-time initial load of unread count
        this.fetchUnreadCount();

        // Listen for real-time push notifications
        this.pushSub = this.pushService
            .on<PushNotificationNew>("notification:new")
            .subscribe((ev) => {
                this.unreadCount.update((c) => c + 1);
                const newNotif: AppNotification = {
                    id: ev.id,
                    userId: "",
                    type: ev.type as AppNotification["type"],
                    title: ev.title,
                    body: ev.body,
                    link: ev.link,
                    isRead: false,
                    createdAt: ev.createdAt
                };
                this.notifications.update((list) => [newNotif, ...list]);
            });
    }

    /** @deprecated Use start() instead. Kept for backwards compatibility. */
    startPolling(): void {
        this.start();
    }

    stop(): void {
        this.pushSub?.unsubscribe();
        this.pushSub = undefined;
        this.started = false;
    }

    /** @deprecated Use stop() instead. */
    stopPolling(): void {
        this.stop();
    }

    loadNotifications(): void {
        this.loading.set(true);
        const base = this.apiConfig.baseUrl;
        this.http.get<AppNotification[]>(`${base}${NOTIFICATIONS_ROUTES.list()}`).subscribe({
            next: (list) => {
                this.notifications.set(list);
                this.unreadCount.set(list.filter((n) => !n.isRead).length);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    markAsRead(id: string): void {
        const notif = this.notifications().find((n) => n.id === id);
        if (!notif || notif.isRead) return;

        const base = this.apiConfig.baseUrl;
        this.http.patch(`${base}${NOTIFICATIONS_ROUTES.markRead(id)}`, {}).subscribe({
            next: () => {
                this.notifications.set(this.notifications().map((n) => (n.id === id ? { ...n, isRead: true } : n)));
                this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
            }
        });
    }

    markAllAsRead(): void {
        const base = this.apiConfig.baseUrl;
        this.http.patch(`${base}${NOTIFICATIONS_ROUTES.markAllRead()}`, {}).subscribe({
            next: () => {
                this.notifications.set(this.notifications().map((n) => ({ ...n, isRead: true })));
                this.unreadCount.set(0);
            }
        });
    }

    deleteNotification(id: string): void {
        const wasUnread = this.notifications().some((n) => n.id === id && !n.isRead);
        const base = this.apiConfig.baseUrl;
        this.http.delete(`${base}${NOTIFICATIONS_ROUTES.delete(id)}`).subscribe({
            next: () => {
                this.notifications.set(this.notifications().filter((n) => n.id !== id));
                if (wasUnread) this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
            }
        });
    }

    private fetchUnreadCount(): void {
        const base = this.apiConfig.baseUrl;
        this.http.get<{ count: number }>(`${base}${NOTIFICATIONS_ROUTES.unreadCount()}`).subscribe({
            next: ({ count }) => this.unreadCount.set(count)
        });
    }
}
