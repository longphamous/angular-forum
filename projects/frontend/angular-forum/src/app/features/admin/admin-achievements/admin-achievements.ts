import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { ACHIEVEMENT_ROUTES } from "../../../core/api/achievement.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    Achievement,
    AchievementCategory,
    AchievementHistory,
    AchievementRarity
} from "../../../core/models/gamification/achievement";
import { UserAutocomplete, UserSuggestion } from "../../../shared/components/user-autocomplete/user-autocomplete";

type TagSeverity = "secondary" | "info" | "warn" | "danger" | "success" | "contrast";

const RARITY_SEVERITY: Record<AchievementRarity, TagSeverity> = {
    bronze: "warn",
    silver: "secondary",
    gold: "warn",
    platinum: "info"
};

const RARITY_KEYS: Record<AchievementRarity, string> = {
    bronze: "adminAchievements.rarities.bronze",
    silver: "adminAchievements.rarities.silver",
    gold: "adminAchievements.rarities.gold",
    platinum: "adminAchievements.rarities.platinum"
};

const TRIGGER_TYPE_KEYS: Record<string, string> = {
    manual: "adminAchievements.triggerTypes.manual",
    post_count: "adminAchievements.triggerTypes.post_count",
    thread_count: "adminAchievements.triggerTypes.thread_count",
    reaction_received_count: "adminAchievements.triggerTypes.reaction_received_count",
    reaction_given_count: "adminAchievements.triggerTypes.reaction_given_count",
    level_reached: "adminAchievements.triggerTypes.level_reached",
    xp_total: "adminAchievements.triggerTypes.xp_total"
};

export interface AchievementFormData {
    key: string;
    name: string;
    description: string;
    icon: string;
    rarity: AchievementRarity;
    triggerType: string;
    triggerValue: number;
    xpReward: number;
    category: string;
    isActive: boolean;
}

const EMPTY_FORM: AchievementFormData = {
    key: "",
    name: "",
    description: "",
    icon: "pi pi-star",
    rarity: "bronze",
    triggerType: "post_count",
    triggerValue: 1,
    xpReward: 0,
    category: "general",
    isActive: true
};

@Component({
    selector: "admin-achievements",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        RouterModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule,
        UserAutocomplete
    ],
    providers: [ConfirmationService],
    templateUrl: "./admin-achievements.html"
})
export class AdminAchievements implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translocoService = inject(TranslocoService);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly error = signal<string | null>(null);
    readonly successMsg = signal<string | null>(null);
    readonly achievements = signal<Achievement[]>([]);
    readonly dialogVisible = signal(false);
    readonly editingId = signal<string | null>(null);
    readonly form = signal<AchievementFormData>({ ...EMPTY_FORM });

    // Categories
    readonly categories = signal<AchievementCategory[]>([]);
    readonly categoryDialogVisible = signal(false);
    readonly editingCategoryId = signal<string | null>(null);
    readonly categoryForm = signal({ key: "", name: "", description: "", icon: "pi pi-folder", position: 0 });

    // Manual grant
    readonly grantDialogVisible = signal(false);
    readonly grantSelectedUser = signal<UserSuggestion | null>(null);
    readonly grantAchievementId = signal("");

    // Detail
    readonly detailDialogVisible = signal(false);
    readonly detailAchievementId = signal<string | null>(null);
    readonly detailData = signal<{
        name: string;
        icon: string;
        rarity: string;
        totalGranted: number;
        recipients: {
            userId: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
            source: string;
            earnedAt: string;
        }[];
    } | null>(null);
    readonly detailLoading = signal(false);
    readonly detailGrantUser = signal<UserSuggestion | null>(null);

    // History
    readonly history = signal<AchievementHistory[]>([]);
    readonly historyLoading = signal(false);
    readonly activeTab = signal<"achievements" | "categories" | "history">("achievements");

    get rarityOptions() {
        return (["bronze", "silver", "gold", "platinum"] as AchievementRarity[]).map((v) => ({
            label: this.translocoService.translate(RARITY_KEYS[v]),
            value: v
        }));
    }

    get categoryOptions() {
        const cats = this.categories();
        if (cats.length > 0) {
            return cats.map((c) => ({ label: c.name, value: c.key }));
        }
        return ["general", "community", "content", "social", "milestones"].map((v) => ({
            label: this.translocoService.translate(`achievements.categories.${v}`),
            value: v
        }));
    }

    get triggerTypeOptions() {
        return Object.entries(TRIGGER_TYPE_KEYS).map(([value, key]) => ({
            label: this.translocoService.translate(key),
            value
        }));
    }

    ngOnInit(): void {
        this.loadAchievements();
        this.loadCategories();
    }

    private loadAchievements(): void {
        this.loading.set(true);
        this.http.get<Achievement[]>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.list()}`).subscribe({
            next: (data) => {
                this.achievements.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminAchievements.loadError"));
                this.loading.set(false);
            }
        });
    }

    openCreate(): void {
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.error.set(null);
        this.successMsg.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(achievement: Achievement): void {
        this.editingId.set(achievement.id);
        this.form.set({
            key: achievement.key,
            name: achievement.name,
            description: achievement.description ?? "",
            icon: achievement.icon,
            rarity: achievement.rarity as AchievementRarity,
            triggerType: achievement.triggerType,
            triggerValue: achievement.triggerValue,
            xpReward: achievement.xpReward ?? 0,
            category: achievement.category ?? "general",
            isActive: achievement.isActive
        });
        this.error.set(null);
        this.successMsg.set(null);
        this.dialogVisible.set(true);
    }

    saveAchievement(): void {
        const f = this.form();
        if (!f.key || !f.name || !f.icon) return;
        this.saving.set(true);
        this.error.set(null);

        const id = this.editingId();
        const payload = {
            key: f.key,
            name: f.name,
            description: f.description || undefined,
            icon: f.icon,
            rarity: f.rarity,
            triggerType: f.triggerType,
            triggerValue: f.triggerValue,
            xpReward: f.xpReward,
            category: f.category || undefined,
            isActive: f.isActive
        };

        const req = id
            ? this.http.patch<Achievement>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.update(id)}`, payload)
            : this.http.post<Achievement>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.create()}`, payload);

        req.subscribe({
            next: (saved) => {
                if (id) {
                    this.achievements.update((list) => list.map((a) => (a.id === id ? saved : a)));
                    this.successMsg.set(
                        this.translocoService.translate("adminAchievements.updateSuccess", { name: saved.name })
                    );
                } else {
                    this.achievements.update((list) => [saved, ...list]);
                    this.successMsg.set(
                        this.translocoService.translate("adminAchievements.createSuccess", { name: saved.name })
                    );
                }
                this.saving.set(false);
                this.dialogVisible.set(false);
                this.loadAchievements();
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminAchievements.saveError"));
                this.saving.set(false);
            }
        });
    }

    confirmDelete(achievement: Achievement): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("adminAchievements.deleteDialog.confirm", {
                name: achievement.name
            }),
            header: this.translocoService.translate("adminAchievements.deleteDialog.header"),
            icon: "pi pi-trash",
            acceptLabel: this.translocoService.translate("adminAchievements.deleteDialog.submit"),
            rejectLabel: this.translocoService.translate("common.cancel"),
            acceptButtonProps: { severity: "danger" },
            accept: () => this.deleteAchievement(achievement)
        });
    }

    private deleteAchievement(achievement: Achievement): void {
        this.http.delete(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.delete(achievement.id)}`).subscribe({
            next: () => {
                this.achievements.update((list) => list.filter((a) => a.id !== achievement.id));
                this.successMsg.set(
                    this.translocoService.translate("adminAchievements.deleteSuccess", { name: achievement.name })
                );
                this.loadAchievements();
            },
            error: () => this.error.set(this.translocoService.translate("adminAchievements.deleteError"))
        });
    }

    raritySeverity(rarity: string): TagSeverity {
        return RARITY_SEVERITY[rarity as AchievementRarity] ?? "secondary";
    }

    rarityLabel(rarity: string): string {
        const key = RARITY_KEYS[rarity as AchievementRarity];
        return key ? this.translocoService.translate(key) : rarity;
    }

    triggerTypeLabel(type: string): string {
        const key = TRIGGER_TYPE_KEYS[type];
        return key ? this.translocoService.translate(key) : type;
    }

    updateForm(patch: Partial<AchievementFormData>): void {
        this.form.update((f) => {
            const updated = { ...f, ...patch };
            // Auto-generate key from name (only in create mode)
            if (patch.name !== undefined && !this.editingId()) {
                updated.key = this.generateKey(patch.name);
            }
            // Set triggerValue to 0 for manual trigger type
            if (patch.triggerType === "manual") {
                updated.triggerValue = 0;
            }
            return updated;
        });
    }

    private generateKey(name: string): string {
        return name
            .toLowerCase()
            .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "");
    }

    updateCategoryForm(
        patch: Partial<{ key: string; name: string; description: string; icon: string; position: number }>
    ): void {
        this.categoryForm.update((f) => ({ ...f, ...patch }));
    }

    // ── Detail ──────────────────────────────────────────────────────────

    openDetail(achievement: Achievement): void {
        this.detailAchievementId.set(achievement.id);
        this.detailGrantUser.set(null);
        this.loadDetail(achievement.id);
        this.detailDialogVisible.set(true);
    }

    private loadDetail(achievementId: string): void {
        this.detailLoading.set(true);
        this.detailData.set(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.http.get<any>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.detail(achievementId)}`).subscribe({
            next: (data) => {
                this.detailData.set(data);
                this.detailLoading.set(false);
            },
            error: () => this.detailLoading.set(false)
        });
    }

    grantFromDetail(): void {
        const userId = this.detailGrantUser()?.id;
        const achievementId = this.detailAchievementId();
        if (!userId || !achievementId) return;

        this.saving.set(true);
        this.http
            .post(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.grant()}`, { userId, achievementId })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.detailGrantUser.set(null);
                    this.loadDetail(achievementId);
                    this.successMsg.set("Achievement vergeben");
                },
                error: (err) => {
                    this.saving.set(false);
                    this.error.set(err.error?.message ?? "Fehler beim Vergeben");
                }
            });
    }

    revokeFromDetail(userId: string): void {
        const achievementId = this.detailAchievementId();
        if (!achievementId) return;

        this.http
            .delete(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.revoke(userId, achievementId)}`)
            .subscribe({
                next: () => {
                    this.loadDetail(achievementId);
                    this.successMsg.set("Achievement zurückgezogen");
                },
                error: () => this.error.set("Fehler beim Zurückziehen")
            });
    }

    getCategoryName(key: string): string {
        const cat = this.categories().find((c) => c.key === key);
        return cat?.name ?? key;
    }

    // ── Categories ──────────────────────────────────────────────────────────

    loadCategories(): void {
        this.http.get<AchievementCategory[]>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.categories()}`).subscribe({
            next: (data) => this.categories.set(data)
        });
    }

    openCreateCategory(): void {
        this.editingCategoryId.set(null);
        this.categoryForm.set({ key: "", name: "", description: "", icon: "pi pi-folder", position: 0 });
        this.categoryDialogVisible.set(true);
    }

    openEditCategory(cat: AchievementCategory): void {
        this.editingCategoryId.set(cat.id);
        this.categoryForm.set({
            key: cat.key,
            name: cat.name,
            description: cat.description ?? "",
            icon: cat.icon,
            position: cat.position
        });
        this.categoryDialogVisible.set(true);
    }

    saveCategory(): void {
        const f = this.categoryForm();
        if (!f.key || !f.name) return;
        this.saving.set(true);

        const id = this.editingCategoryId();
        const req = id
            ? this.http.patch<AchievementCategory>(
                  `${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.updateCategory(id)}`,
                  f
              )
            : this.http.post<AchievementCategory>(
                  `${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.createCategory()}`,
                  f
              );

        req.subscribe({
            next: () => {
                this.saving.set(false);
                this.categoryDialogVisible.set(false);
                this.loadCategories();
                this.successMsg.set(id ? "Category updated" : "Category created");
            },
            error: () => {
                this.saving.set(false);
                this.error.set("Failed to save category");
            }
        });
    }

    deleteCategory(cat: AchievementCategory): void {
        this.confirmationService.confirm({
            message: `Delete category "${cat.name}"?`,
            header: "Delete Category",
            icon: "pi pi-trash",
            acceptLabel: this.translocoService.translate("common.delete"),
            rejectLabel: this.translocoService.translate("common.cancel"),
            acceptButtonProps: { severity: "danger" },
            accept: () => {
                this.http
                    .delete(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.deleteCategory(cat.id)}`)
                    .subscribe({
                        next: () => {
                            this.loadCategories();
                            this.successMsg.set("Category deleted");
                        },
                        error: () => this.error.set("Failed to delete category")
                    });
            }
        });
    }

    // ── Manual Grant ────────────────────────────────────────────────────────

    openGrantDialog(): void {
        this.grantSelectedUser.set(null);
        this.grantAchievementId.set("");
        this.grantDialogVisible.set(true);
    }

    onGrantUserSelected(user: UserSuggestion | null): void {
        this.grantSelectedUser.set(user);
    }

    grantAchievement(): void {
        const userId = this.grantSelectedUser()?.id;
        const achievementId = this.grantAchievementId();
        if (!userId || !achievementId) return;

        this.saving.set(true);
        this.http
            .post(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.grant()}`, { userId, achievementId })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.grantDialogVisible.set(false);
                    this.successMsg.set("Achievement granted");
                    if (this.activeTab() === "history") this.loadHistory();
                },
                error: (err) => {
                    this.saving.set(false);
                    this.error.set(err.error?.message ?? "Failed to grant achievement");
                }
            });
    }

    // ── History ─────────────────────────────────────────────────────────────

    loadHistory(): void {
        this.historyLoading.set(true);
        this.http
            .get<AchievementHistory[]>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.history()}`)
            .subscribe({
                next: (data) => {
                    this.history.set(data);
                    this.historyLoading.set(false);
                },
                error: () => this.historyLoading.set(false)
            });
    }

    onTabChange(tab: "achievements" | "categories" | "history"): void {
        this.activeTab.set(tab);
        if (tab === "history" && this.history().length === 0) this.loadHistory();
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}
