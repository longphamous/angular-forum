import { DecimalPipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { GAMIFICATION_ROUTES } from "../../../core/api/gamification.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { LEVEL_CONFIG } from "../../../core/config/level.config";

export interface XpConfigEntry {
    eventType: string;
    xpAmount: number;
    label: string;
    description?: string;
}

@Component({
    selector: "admin-gamification",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        DecimalPipe,
        DividerModule,
        FormsModule,
        InputNumberModule,
        MessageModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./admin-gamification.html"
})
export class AdminGamification implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly t = inject(TranslocoService);

    readonly loading = signal(true);
    readonly saving = signal<string | null>(null);
    readonly recalculating = signal(false);
    readonly error = signal<string | null>(null);
    readonly successMsg = signal<string | null>(null);
    readonly configs = signal<XpConfigEntry[]>([]);
    readonly levels = LEVEL_CONFIG;

    // Editable copies of xpAmount per event type
    readonly editAmounts: Record<string, number> = {};

    ngOnInit(): void {
        this.loadConfig();
    }

    private loadConfig(): void {
        this.loading.set(true);
        this.error.set(null);
        this.http.get<XpConfigEntry[]>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.config.list()}`).subscribe({
            next: (entries) => {
                this.configs.set(entries);
                entries.forEach((e) => (this.editAmounts[e.eventType] = e.xpAmount));
                this.loading.set(false);
            },
            error: () => {
                this.error.set(this.t.translate("adminGamification.loadError"));
                this.loading.set(false);
            }
        });
    }

    saveConfig(entry: XpConfigEntry): void {
        const amount = this.editAmounts[entry.eventType];
        if (amount === entry.xpAmount) return;
        this.saving.set(entry.eventType);
        this.error.set(null);
        this.successMsg.set(null);
        this.http
            .patch<XpConfigEntry>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.config.update(entry.eventType)}`, {
                xpAmount: amount
            })
            .subscribe({
                next: (updated) => {
                    this.configs.update((list) =>
                        list.map((e) => (e.eventType === updated.eventType ? { ...e, xpAmount: updated.xpAmount } : e))
                    );
                    this.successMsg.set(
                        this.t.translate("adminGamification.saveSuccess", { label: entry.label, amount })
                    );
                    this.saving.set(null);
                    this.loadConfig();
                },
                error: () => {
                    this.error.set(this.t.translate("adminGamification.saveError"));
                    this.saving.set(null);
                }
            });
    }

    recalculate(): void {
        this.recalculating.set(true);
        this.error.set(null);
        this.successMsg.set(null);
        this.http
            .post<{ updatedUsers: number }>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.recalculate()}`, {})
            .subscribe({
                next: (result) => {
                    this.successMsg.set(
                        this.t.translate("adminGamification.recalculateSuccessCount", { count: result.updatedUsers })
                    );
                    this.recalculating.set(false);
                    this.loadConfig();
                },
                error: () => {
                    this.error.set(this.t.translate("adminGamification.recalculateError"));
                    this.recalculating.set(false);
                }
            });
    }

    isDirty(entry: XpConfigEntry): boolean {
        return this.editAmounts[entry.eventType] !== entry.xpAmount;
    }

    eventTypeIcon(eventType: string): string {
        const icons: Record<string, string> = {
            create_thread: "pi-plus-circle",
            create_post: "pi-comment",
            receive_reaction: "pi-heart-fill",
            give_reaction: "pi-heart"
        };
        return "pi " + (icons[eventType] ?? "pi-star");
    }
}
