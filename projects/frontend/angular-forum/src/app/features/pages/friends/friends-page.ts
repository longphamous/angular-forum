import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";

import { TabPersistenceService } from "../../../core/services/tab-persistence.service";
import { FriendsFacade } from "../../../facade/friends/friends-facade";
import { OnlineIndicator } from "../../../shared/components/online-indicator/online-indicator";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        BadgeModule,
        ButtonModule,
        DatePipe,
        FormsModule,
        InputTextModule,
        RouterModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TranslocoModule,
        OnlineIndicator
    ],
    selector: "app-friends-page",
    standalone: true,
    styleUrl: "./friends-page.css",
    templateUrl: "./friends-page.html"
})
export class FriendsPage implements OnInit {
    protected readonly friendsFacade = inject(FriendsFacade);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly tabService = inject(TabPersistenceService);

    protected readonly searchQuery = signal("");
    protected readonly activeTab = signal(this.tabService.get("0"));

    protected readonly filteredFriends = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const friends = this.friendsFacade.friends();
        if (!query) return friends;
        return friends.filter(
            (f) => f.displayName.toLowerCase().includes(query) || f.username.toLowerCase().includes(query)
        );
    });

    protected readonly incomingCount = computed(() => this.friendsFacade.incomingRequests().length);

    onTabChange(tab: string): void {
        this.activeTab.set(tab);
        this.tabService.set(tab);
    }

    ngOnInit(): void {
        this.friendsFacade.loadFriends();
        this.friendsFacade.loadIncomingRequests();
        this.friendsFacade.loadOutgoingRequests();
        this.friendsFacade.loadFriendCount();
    }

    protected acceptRequest(id: string): void {
        this.friendsFacade.acceptRequest(id).subscribe({
            next: () => this.cd.markForCheck()
        });
    }

    protected declineRequest(id: string): void {
        this.friendsFacade.declineRequest(id).subscribe({
            next: () => this.cd.markForCheck()
        });
    }

    protected cancelRequest(id: string): void {
        this.friendsFacade.cancelRequest(id).subscribe({
            next: () => this.cd.markForCheck()
        });
    }

    protected removeFriend(friendshipId: string, _displayName: string, confirmMessage: string): void {
        if (!confirm(confirmMessage)) return;
        this.friendsFacade.removeFriend(friendshipId).subscribe({
            next: () => this.cd.markForCheck()
        });
    }

    protected getInitial(name: string): string {
        return name.charAt(0).toUpperCase();
    }

    protected formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }
}
