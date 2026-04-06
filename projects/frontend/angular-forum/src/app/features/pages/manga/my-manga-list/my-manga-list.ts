import { NgTemplateOutlet } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { USER_ROUTES } from "../../../../core/api/user.routes";
import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import { MangaListEntry, MangaListStatus } from "../../../../core/models/manga/manga";
import { UserProfile } from "../../../../core/models/user/user";
import { TabPersistenceService } from "../../../../core/services/tab-persistence.service";
import { MangaFacade } from "../../../../facade/manga/manga-facade";
import { AuthFacade } from "../../../../facade/auth/auth-facade";

interface StatCard {
    count: number;
    label: string;
    status: MangaListStatus;
}

const STATUS_KEYS: Record<MangaListStatus, string> = {
    completed: "manga.detail.listStatuses.completed",
    dropped: "manga.detail.listStatuses.dropped",
    on_hold: "manga.detail.listStatuses.on_hold",
    plan_to_read: "manga.detail.listStatuses.plan_to_read",
    reading: "manga.detail.listStatuses.reading"
};

const STATUS_SEVERITY: Record<MangaListStatus, "success" | "info" | "warn" | "danger" | "secondary"> = {
    completed: "success",
    dropped: "danger",
    on_hold: "warn",
    plan_to_read: "info",
    reading: "secondary"
};

const ALL_STATUSES: MangaListStatus[] = ["reading", "completed", "plan_to_read", "on_hold", "dropped"];

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
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-my-manga-list",
    templateUrl: "./my-manga-list.html"
})
export class MyMangaList implements OnInit {
    protected readonly facade = inject(MangaFacade);
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
            label: this.translocoService.translate(STATUS_KEYS[status]),
            status
        }))
    );
    protected readonly viewedProfile = signal<UserProfile | null>(null);

    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly authFacade = inject(AuthFacade);
    private readonly http = inject(HttpClient);
    private readonly route = inject(ActivatedRoute);
    private readonly tabService = inject(TabPersistenceService);
    readonly activeTab = signal(this.tabService.get("all"));
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);
    private readonly userId = signal<string | null>(null);

    onTabChange(tab: string): void {
        this.activeTab.set(tab);
        this.tabService.set(tab);
    }

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
                next: (entries: MangaListEntry[]) => {
                    entries.forEach((e: MangaListEntry) => this.facade.updateUserListLocally(e));
                }
            });
        } else {
            this.facade.loadUserList();
        }
    }

    protected formatDate(dateStr?: string): string {
        if (!dateStr) return "—";
        const locale = this.translocoService.getActiveLang() === "de" ? "de-DE" : "en-US";
        return new Date(dateStr).toLocaleDateString(locale, { month: "long", year: "numeric" });
    }

    protected goToDetail(mangaId: number): void {
        void this.router.navigate(["/manga", mangaId]);
    }

    protected roleLabel(role: string): string {
        return this.translocoService.translate("userProfile.roles." + role);
    }

    protected roleSeverity(role: string): "danger" | "warn" | "info" | "secondary" {
        if (role === "admin") return "danger";
        if (role === "moderator") return "warn";
        if (role === "member") return "info";
        return "secondary";
    }

    protected statusLabel(status: MangaListStatus): string {
        return this.translocoService.translate(STATUS_KEYS[status]);
    }

    protected statusSeverity(status: MangaListStatus): "success" | "info" | "warn" | "danger" | "secondary" {
        return STATUS_SEVERITY[status];
    }

    protected countByStatus(status: MangaListStatus): number {
        return this.list().filter((e) => e.status === status).length;
    }

    protected entriesByStatus(status: MangaListStatus): MangaListEntry[] {
        return this.list().filter((e) => e.status === status);
    }

    protected removeEntry(mangaId: number): void {
        this.removingId.set(mangaId);
        this.facade.removeFromList(mangaId).subscribe({
            next: () => {
                this.facade.removeFromUserListLocally(mangaId);
                this.removingId.set(null);
            },
            error: () => {
                this.removingId.set(null);
            }
        });
    }
}
