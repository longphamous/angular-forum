import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { InputNumberModule } from "primeng/inputnumber";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { LOTTO_ROUTES } from "../../../core/api/lotto.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { DrawResult, DrawScheduleConfig, LottoDraw } from "../../../core/models/lotto/lotto";

interface DayOption {
    value: number;
    label: string;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        FormsModule,
        InputNumberModule,
        SkeletonModule,
        TableModule,
        TagModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService, ConfirmationService],
    selector: "app-admin-lotto",
    templateUrl: "./admin-lotto.html"
})
export class AdminLotto implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    protected readonly messageService = inject(MessageService);
    protected readonly confirmationService = inject(ConfirmationService);

    protected readonly loading = signal(true);
    protected readonly saving = signal(false);
    protected readonly draws = signal<LottoDraw[]>([]);
    protected readonly config = signal<DrawScheduleConfig | null>(null);

    protected readonly dayOptions: DayOption[] = [
        { value: 1, label: "Mo" }, { value: 2, label: "Di" }, { value: 3, label: "Mi" },
        { value: 4, label: "Do" }, { value: 5, label: "Fr" }, { value: 6, label: "Sa" }, { value: 0, label: "So" }
    ];

    protected form: DrawScheduleConfig = {
        drawDays: [6],
        drawHourUtc: 19,
        drawMinuteUtc: 0,
        baseJackpot: 1_000_000,
        rolloverPercentage: 50,
        ticketCost: 2
    };

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.loading.set(true);
        const base = this.apiConfig.baseUrl;
        this.http.get<DrawScheduleConfig>(`${base}${LOTTO_ROUTES.config()}`).subscribe({
            next: (c) => {
                this.config.set(c);
                this.form = { ...c };
            }
        });
        this.http.get<LottoDraw[]>(`${base}${LOTTO_ROUTES.draws()}`).subscribe({
            next: (d) => { this.draws.set(d); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    protected isDaySelected(day: number): boolean {
        return this.form.drawDays.includes(day as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    }

    protected toggleDay(day: number): void {
        const days = [...this.form.drawDays];
        const idx = days.indexOf(day as 0 | 1 | 2 | 3 | 4 | 5 | 6);
        if (idx !== -1) {
            if (days.length > 1) days.splice(idx, 1);
        } else {
            days.push(day as 0 | 1 | 2 | 3 | 4 | 5 | 6);
        }
        this.form = { ...this.form, drawDays: days };
    }

    protected saveConfig(): void {
        this.saving.set(true);
        this.http.patch<DrawScheduleConfig>(`${this.apiConfig.baseUrl}${LOTTO_ROUTES.config()}`, this.form).subscribe({
            next: (c) => {
                this.saving.set(false);
                this.config.set(c);
                this.messageService.add({ severity: "success", summary: "Konfiguration gespeichert", life: 2000 });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler beim Speichern", life: 3000 });
            }
        });
    }

    protected scheduleNextDraw(): void {
        this.http.post<LottoDraw>(`${this.apiConfig.baseUrl}${LOTTO_ROUTES.scheduleNextDraw()}`, {}).subscribe({
            next: (draw) => {
                this.draws.update((d) => [...d, draw]);
                this.messageService.add({ severity: "success", summary: "Ziehung geplant", life: 2000 });
            },
            error: () => this.messageService.add({ severity: "error", summary: "Fehler", life: 3000 })
        });
    }

    protected confirmPerformDraw(draw: LottoDraw): void {
        this.confirmationService.confirm({
            message: `Ziehung "${draw.id}" jetzt manuell ausführen?`,
            header: "Ziehung ausführen",
            icon: "pi pi-exclamation-triangle",
            accept: () => this.performDraw(draw.id)
        });
    }

    private performDraw(drawId: string): void {
        this.http.post<DrawResult>(`${this.apiConfig.baseUrl}${LOTTO_ROUTES.performDraw(drawId)}`, {}).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: "success",
                    summary: `Ziehung abgeschlossen! ${result.winners.length} Gewinner`,
                    life: 4000
                });
                this.loadData();
            },
            error: () => this.messageService.add({ severity: "error", summary: "Fehler bei der Ziehung", life: 3000 })
        });
    }

    protected formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    }

    protected formatCredits(n: number): string {
        return n.toLocaleString("de-DE") + " Coins";
    }
}
