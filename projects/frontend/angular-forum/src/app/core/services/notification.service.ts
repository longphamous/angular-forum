import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";

import { NOTIFICATIONS_ROUTES } from "../api/notifications.routes";
import { API_CONFIG, ApiConfig } from "../config/api.config";
import { AppNotification } from "../models/notifications/notification";

@Injectable({ providedIn: "root" })
export class NotificationService {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    readonly unreadCount = signal(0);
    readonly notifications = signal<AppNotification[]>([]);
    readonly loading = signal(false);

    private pollInterval: ReturnType<typeof setInterval> | null = null;

    startPolling(): void {
        this.fetchUnreadCount();
        if (this.pollInterval !== null) return;
        this.pollInterval = setInterval(() => this.fetchUnreadCount(), 30_000);
    }

    stopPolling(): void {
        if (this.pollInterval !== null) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
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
