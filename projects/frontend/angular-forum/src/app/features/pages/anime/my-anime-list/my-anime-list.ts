import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { AnimeListEntry, AnimeListStatus } from "../../../../core/models/anime/anime";
import { AnimeFacade } from "../../../../facade/anime/anime-facade";
import { AuthFacade } from "../../../../facade/auth/auth-facade";

interface StatCard {
    count: number;
    label: string;
    status: AnimeListStatus;
}

const STATUS_LABELS: Record<AnimeListStatus, string> = {
    completed: "Abgeschlossen",
    dropped: "Abgebrochen",
    on_hold: "Pausiert",
    plan_to_watch: "Plan to Watch",
    watching: "Am Schauen"
};

const STATUS_SEVERITY: Record<AnimeListStatus, "success" | "info" | "warn" | "danger" | "secondary"> = {
    completed: "success",
    dropped: "danger",
    on_hold: "warn",
    plan_to_watch: "info",
    watching: "secondary"
};

const ALL_STATUSES: AnimeListStatus[] = ["watching", "completed", "plan_to_watch", "on_hold", "dropped"];

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        MessageModule,
        NgTemplateOutlet,
        RouterModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TooltipModule
    ],
    selector: "app-my-anime-list",
    templateUrl: "./my-anime-list.html"
})
export class MyAnimeList implements OnInit {
    protected readonly facade = inject(AnimeFacade);
    protected readonly allStatuses = ALL_STATUSES;
    protected readonly isOwnList = computed(() => {
        const uid = this.userId();
        const me = this.authFacade.currentUser()?.id;
        return !uid || uid === me;
    });
    protected readonly list = this.facade.userList;
    protected readonly ownerName = computed(() => this.userId() ?? "User");
    protected readonly removingId = signal<number | null>(null);
    protected readonly statCards = computed((): StatCard[] =>
        ALL_STATUSES.map((status) => ({
            count: this.list().filter((e) => e.status === status).length,
            label: STATUS_LABELS[status],
            status
        }))
    );

    protected activeTab: string = "all";

    private readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly userId = signal<string | null>(null);

    ngOnInit(): void {
        const uid = this.route.snapshot.paramMap.get("userId");
        this.userId.set(uid);

        if (uid && uid !== this.authFacade.currentUser()?.id) {
            this.facade.loadPublicUserList(uid).subscribe({
                next: (entries: AnimeListEntry[]) => {
                    entries.forEach((e: AnimeListEntry) => this.facade.updateUserListLocally(e));
                }
            });
        } else {
            this.facade.loadUserList();
        }
    }

    protected goToDetail(animeId: number): void {
        void this.router.navigate(["/anime", animeId]);
    }

    protected statusLabel(status: AnimeListStatus): string {
        return STATUS_LABELS[status];
    }

    protected statusSeverity(status: AnimeListStatus): "success" | "info" | "warn" | "danger" | "secondary" {
        return STATUS_SEVERITY[status];
    }

    protected countByStatus(status: AnimeListStatus): number {
        return this.list().filter((e) => e.status === status).length;
    }

    protected entriesByStatus(status: AnimeListStatus): AnimeListEntry[] {
        return this.list().filter((e) => e.status === status);
    }

    protected removeEntry(animeId: number): void {
        this.removingId.set(animeId);
        this.facade.removeFromList(animeId).subscribe({
            next: () => {
                this.facade.removeFromUserListLocally(animeId);
                this.removingId.set(null);
            },
            error: () => {
                this.removingId.set(null);
            }
        });
    }
}
