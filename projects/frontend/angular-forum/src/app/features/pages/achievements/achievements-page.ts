import { KeyValuePipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { ACHIEVEMENT_ROUTES } from "../../../core/api/achievement.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { AchievementProgress, AchievementRarity, RARITY_STYLES } from "../../../core/models/gamification/achievement";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

type SortMode = "rarity" | "progress" | "name";
type FilterMode = "all" | "earned" | "inProgress" | "locked";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-achievements-page",
    standalone: true,
    imports: [
        AdminQuicklink,
        ButtonModule,
        FormsModule,
        KeyValuePipe,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ProgressBarModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./achievements-page.html"
})
export class AchievementsPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly authFacade = inject(AuthFacade);

    protected readonly loading = signal(true);
    protected readonly achievements = signal<AchievementProgress[]>([]);
    protected readonly searchQuery = signal("");
    protected readonly filterMode = signal<FilterMode>("all");
    protected readonly sortMode = signal<SortMode>("rarity");

    protected readonly filterOptions: { label: string; value: FilterMode }[] = [
        { label: "achievements.filterAll", value: "all" },
        { label: "achievements.filterEarned", value: "earned" },
        { label: "achievements.filterInProgress", value: "inProgress" },
        { label: "achievements.filterLocked", value: "locked" }
    ];

    protected readonly sortOptions: { label: string; value: SortMode }[] = [
        { label: "achievements.sortRarity", value: "rarity" },
        { label: "achievements.sortProgress", value: "progress" },
        { label: "achievements.sortName", value: "name" }
    ];

    protected readonly filteredAchievements = computed(() => {
        let list = this.achievements();
        const q = this.searchQuery().toLowerCase();
        const filter = this.filterMode();

        if (q) {
            list = list.filter(
                (a) =>
                    a.name.toLowerCase().includes(q) ||
                    (a.description?.toLowerCase().includes(q) ?? false) ||
                    (a.category?.toLowerCase().includes(q) ?? false)
            );
        }

        if (filter === "earned") {
            list = list.filter((a) => a.earned);
        } else if (filter === "inProgress") {
            list = list.filter((a) => !a.earned && a.progressPercent > 0);
        } else if (filter === "locked") {
            list = list.filter((a) => !a.earned && a.progressPercent === 0);
        }

        const sort = this.sortMode();
        if (sort === "progress") {
            list = [...list].sort((a, b) => b.progressPercent - a.progressPercent);
        } else if (sort === "name") {
            list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        }

        return list;
    });

    protected readonly groupedAchievements = computed(() => {
        const list = this.filteredAchievements();
        const groups = new Map<string, AchievementProgress[]>();
        for (const a of list) {
            const cat = a.category ?? "general";
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat)!.push(a);
        }
        return groups;
    });

    protected readonly stats = computed(() => {
        const all = this.achievements();
        const earned = all.filter((a) => a.earned).length;
        return { total: all.length, earned, percent: all.length ? Math.round((earned / all.length) * 100) : 0 };
    });

    ngOnInit(): void {
        this.loadProgress();
    }

    private loadProgress(): void {
        const userId = this.authFacade.currentUser()?.id;
        if (!userId) {
            this.loading.set(false);
            return;
        }
        this.http.get<AchievementProgress[]>(`${this.config.baseUrl}${ACHIEVEMENT_ROUTES.progress(userId)}`).subscribe({
            next: (data) => {
                this.achievements.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    protected rarityStyle(rarity: AchievementRarity): { bg: string; text: string; border: string } {
        return RARITY_STYLES[rarity] ?? RARITY_STYLES.bronze;
    }

    protected raritySeverity(rarity: AchievementRarity): "info" | "success" | "warn" | "secondary" {
        switch (rarity) {
            case "platinum":
                return "info";
            case "gold":
                return "warn";
            case "silver":
                return "secondary";
            default:
                return "success";
        }
    }

    protected formatDate(dateStr: string | null): string {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    }
}
