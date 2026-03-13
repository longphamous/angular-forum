import { NgTemplateOutlet } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { USER_ROUTES } from "../../../../core/api/user.routes";
import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import { AnimeListEntry, AnimeListStatus } from "../../../../core/models/anime/anime";
import { UserProfile } from "../../../../core/models/user/user";
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
        AvatarModule,
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
    protected readonly profileLoading = signal(false);
    protected readonly removingId = signal<number | null>(null);
    protected readonly statCards = computed((): StatCard[] =>
        ALL_STATUSES.map((status) => ({
            count: this.list().filter((e) => e.status === status).length,
            label: STATUS_LABELS[status],
            status
        }))
    );
    protected readonly viewedProfile = signal<UserProfile | null>(null);

    protected activeTab: string = "all";

    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly authFacade = inject(AuthFacade);
    private readonly http = inject(HttpClient);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly userId = signal<string | null>(null);

    ngOnInit(): void {
        const uid = this.route.snapshot.paramMap.get("userId");
        this.userId.set(uid);

        if (uid && uid !== this.authFacade.currentUser()?.id) {
            this.profileLoading.set(true);
            this.http.get<UserProfile>(`${this.apiConfig.baseUrl}${USER_ROUTES.publicProfile(uid)}`).subscribe({
                next: (profile) => {
                    this.viewedProfile.set(profile);
                    this.profileLoading.set(false);
                },
                error: () => this.profileLoading.set(false)
            });

            this.facade.loadPublicUserList(uid).subscribe({
                next: (entries: AnimeListEntry[]) => {
                    entries.forEach((e: AnimeListEntry) => this.facade.updateUserListLocally(e));
                }
            });
        } else {
            this.facade.loadUserList();
        }
    }

    protected formatDate(dateStr?: string): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    }

    protected goToDetail(animeId: number): void {
        void this.router.navigate(["/anime", animeId]);
    }

    protected roleLabel(role: string): string {
        const map: Record<string, string> = {
            admin: "Admin",
            moderator: "Moderator",
            member: "Mitglied",
            guest: "Gast"
        };
        return map[role] ?? role;
    }

    protected roleSeverity(role: string): "danger" | "warn" | "info" | "secondary" {
        if (role === "admin") return "danger";
        if (role === "moderator") return "warn";
        if (role === "member") return "info";
        return "secondary";
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
