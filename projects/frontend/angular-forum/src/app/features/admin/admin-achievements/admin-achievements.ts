import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { ConfirmationService } from "primeng/api";

import { ACHIEVEMENT_ROUTES } from "../../../core/api/achievement.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { Achievement, AchievementRarity } from "../../../core/models/gamification/achievement";

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
    isActive: true
};

@Component({
    selector: "admin-achievements",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
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

    get rarityOptions() {
        return (["bronze", "silver", "gold", "platinum"] as AchievementRarity[]).map((v) => ({
            label: this.translocoService.translate(RARITY_KEYS[v]),
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
            isActive: f.isActive
        };

        const req = id
            ? this.http.patch<Achievement>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.update(id)}`, payload)
            : this.http.post<Achievement>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.admin.create()}`, payload);

        req.subscribe({
            next: (saved) => {
                if (id) {
                    this.achievements.update((list) => list.map((a) => (a.id === id ? saved : a)));
                    this.successMsg.set(this.translocoService.translate("adminAchievements.updateSuccess", { name: saved.name }));
                } else {
                    this.achievements.update((list) => [saved, ...list]);
                    this.successMsg.set(this.translocoService.translate("adminAchievements.createSuccess", { name: saved.name }));
                }
                this.saving.set(false);
                this.dialogVisible.set(false);
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminAchievements.saveError"));
                this.saving.set(false);
            }
        });
    }

    confirmDelete(achievement: Achievement): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("adminAchievements.deleteDialog.confirm", { name: achievement.name }),
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
                this.successMsg.set(this.translocoService.translate("adminAchievements.deleteSuccess", { name: achievement.name }));
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
        this.form.update((f) => ({ ...f, ...patch }));
    }
}
