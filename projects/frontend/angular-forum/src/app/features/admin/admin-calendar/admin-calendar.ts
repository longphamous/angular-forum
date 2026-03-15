import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { ConfirmationService, MessageService } from "primeng/api";

import { CALENDAR_ROUTES } from "../../../core/api/calendar.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { AttendeeStatus, CalendarEventDetail, getEventColorClass } from "../../../core/models/calendar/calendar";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, ConfirmDialogModule, SkeletonModule, TableModule, TagModule, ToastModule, TooltipModule, TranslocoModule],
    providers: [ConfirmationService, MessageService],
    selector: "app-admin-calendar",
    templateUrl: "./admin-calendar.html"
})
export class AdminCalendar implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    protected readonly loading = signal(true);
    protected readonly events = signal<CalendarEventDetail[]>([]);
    protected readonly getEventColorClass = getEventColorClass;

    ngOnInit(): void {
        this.load();
    }

    protected confirmDelete(event: CalendarEventDetail): void {
        this.confirmationService.confirm({
            message: `"${event.title}" wirklich löschen?`,
            header: "Bestätigung",
            icon: "pi pi-trash",
            accept: () => this.deleteEvent(event.id)
        });
    }

    protected statusSeverity(status: AttendeeStatus | null): "success" | "warn" | "danger" | "info" | "secondary" {
        switch (status) {
            case "accepted": return "success";
            case "declined": return "danger";
            case "maybe": return "warn";
            case "pending": return "info";
            default: return "secondary";
        }
    }

    protected formatDateTime(dateStr: string): string {
        return new Date(dateStr).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    private deleteEvent(id: string): void {
        this.http.delete(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.admin.delete(id)}`).subscribe({
            next: () => { this.load(); this.messageService.add({ severity: "success", summary: "Gelöscht", life: 2000 }); },
            error: () => this.messageService.add({ severity: "error", summary: "Fehler", life: 3000 })
        });
    }

    private load(): void {
        this.loading.set(true);
        this.http.get<CalendarEventDetail[]>(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.admin.all()}`).subscribe({
            next: (data) => { this.events.set(data); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }
}
