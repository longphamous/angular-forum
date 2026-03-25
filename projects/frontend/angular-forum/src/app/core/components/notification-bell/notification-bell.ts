import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { Popover, PopoverModule } from "primeng/popover";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";

import {
    AppNotification,
    NOTIFICATION_CATEGORY_MAP,
    NOTIFICATION_COLORS,
    NOTIFICATION_ICONS,
    NotificationCategory,
    NotificationType
} from "../../models/notifications/notification";
import { NotificationService } from "../../services/notification.service";
import { FriendsFacade } from "../../../facade/friends/friends-facade";

interface TabItem {
    label: string;
    value: NotificationCategory;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-notification-bell",
    standalone: true,
    imports: [ButtonModule, PopoverModule, RouterModule, SkeletonModule, TooltipModule, TranslocoModule],
    templateUrl: "./notification-bell.html"
})
export class NotificationBell implements OnInit, OnDestroy {
    @ViewChild("notifPopover") notifPopover!: Popover;

    protected readonly notifService = inject(NotificationService);
    private readonly friendsFacade = inject(FriendsFacade);
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);

    protected readonly activeTab = signal<NotificationCategory>("all");

    protected readonly tabs: TabItem[] = [
        { label: "notifications.tabs.all", value: "all" },
        { label: "notifications.tabs.friends", value: "friends" },
        { label: "notifications.tabs.system", value: "system" }
    ];

    protected readonly filteredNotifications = computed(() => {
        const tab = this.activeTab();
        const all = this.notifService.notifications();
        if (tab === "all") return all;
        return all.filter((n) => NOTIFICATION_CATEGORY_MAP[n.type] === tab);
    });

    protected readonly friendRequestCount = computed(() =>
        this.notifService.notifications().filter((n) => this.isFriendRequest(n)).length
    );

    ngOnInit(): void {
        this.notifService.start();
    }

    ngOnDestroy(): void {
        this.notifService.stop();
    }

    protected onOpen(): void {
        this.notifService.loadNotifications();
    }

    protected markAllRead(): void {
        this.notifService.markAllAsRead();
    }

    protected onNotificationClick(notif: AppNotification): void {
        if (this.isFriendRequest(notif)) return;
        if (!notif.isRead) {
            this.notifService.markAsRead(notif.id);
        }
        if (notif.link) {
            this.notifPopover.hide();
            void this.router.navigate([notif.link]);
        }
    }

    protected deleteNotification(event: Event, id: string): void {
        event.stopPropagation();
        this.notifService.deleteNotification(id);
    }

    protected isFriendRequest(notif: AppNotification): boolean {
        return notif.type === "friend_request" || (notif.type === "system" && notif.title === "Freundschaftsanfrage");
    }

    protected acceptFriendRequest(event: Event, notif: AppNotification): void {
        event.stopPropagation();
        const friendshipId = this.extractFriendshipId(notif);
        if (!friendshipId) return;

        this.friendsFacade.acceptRequest(friendshipId).subscribe({
            next: () => {
                this.notifService.markAsRead(notif.id);
                this.notifService.deleteNotification(notif.id);
            }
        });
    }

    protected declineFriendRequest(event: Event, notif: AppNotification): void {
        event.stopPropagation();
        const friendshipId = this.extractFriendshipId(notif);
        if (!friendshipId) return;

        this.friendsFacade.declineRequest(friendshipId).subscribe({
            next: () => {
                this.notifService.deleteNotification(notif.id);
            }
        });
    }

    private extractFriendshipId(notif: AppNotification): string | null {
        if (notif.metadata?.["friendshipId"]) {
            return notif.metadata["friendshipId"] as string;
        }
        // Fallback: use the link which points to /users/{userId}
        if (notif.link) {
            const parts = notif.link.split("/");
            return parts[parts.length - 1] ?? null;
        }
        return null;
    }

    protected badgeLabel(): string {
        const count = this.notifService.unreadCount();
        return count > 99 ? "99+" : count.toString();
    }

    protected notificationIcon(type: NotificationType): string {
        return NOTIFICATION_ICONS[type] ?? "pi-bell";
    }

    protected notificationColor(type: NotificationType): string {
        return NOTIFICATION_COLORS[type] ?? "text-surface-500";
    }

    protected formatTime(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const min = Math.floor(diff / 60_000);
        if (min < 1) return this.translocoService.translate("common.justNow");
        if (min < 60) return this.translocoService.translate("common.minutesAgo", { count: min });
        const h = Math.floor(min / 60);
        if (h < 24) return this.translocoService.translate("common.hoursAgo", { count: h });
        const d = Math.floor(h / 24);
        if (d < 7) {
            const key = d > 1 ? "common.daysAgoPlural" : "common.daysAgo";
            return this.translocoService.translate(key, { count: d });
        }
        return new Date(dateStr).toLocaleDateString(this.translocoService.getActiveLang(), { day: "numeric", month: "short" });
    }
}
