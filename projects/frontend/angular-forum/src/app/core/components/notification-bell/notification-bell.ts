import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { Popover, PopoverModule } from "primeng/popover";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";

import {
    AppNotification,
    NOTIFICATION_COLORS,
    NOTIFICATION_ICONS,
    NotificationType
} from "../../models/notifications/notification";
import { NotificationService } from "../../services/notification.service";

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
    private readonly router = inject(Router);

    ngOnInit(): void {
        this.notifService.startPolling();
    }

    ngOnDestroy(): void {
        this.notifService.stopPolling();
    }

    protected onOpen(): void {
        this.notifService.loadNotifications();
    }

    protected markAllRead(): void {
        this.notifService.markAllAsRead();
    }

    protected onNotificationClick(notif: AppNotification): void {
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
        if (min < 1) return "Gerade eben";
        if (min < 60) return `${min} Min.`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h} Std.`;
        const d = Math.floor(h / 24);
        if (d < 7) return `${d} Tag${d > 1 ? "e" : ""}`;
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
    }
}
