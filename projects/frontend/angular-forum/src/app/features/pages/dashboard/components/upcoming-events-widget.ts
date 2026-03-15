import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { CALENDAR_ROUTES } from "../../../../core/api/calendar.routes";
import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import { AttendeeStatus, CalendarEvent, getEventColorClass } from "../../../../core/models/calendar/calendar";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, CardModule, RouterModule, SkeletonModule, TagModule, TooltipModule, TranslocoModule],
    selector: "app-upcoming-events-widget",
    template: `
        <p-card *transloco="let t">
            <ng-template #title>
                <div class="flex items-center justify-between">
                    <span class="flex items-center gap-2">
                        <i class="pi pi-calendar text-primary"></i>
                        {{ t('calendar.title') }}
                    </span>
                    <a routerLink="/calendar" class="text-xs text-primary hover:underline">{{ t('common.more') ?? 'Alle' }}</a>
                </div>
            </ng-template>

            @if (loading()) {
                <div class="flex flex-col gap-2">
                    @for (_ of [1,2,3]; track $index) {
                        <p-skeleton height="3.5rem" styleClass="rounded-lg" />
                    }
                </div>
            } @else if (events().length === 0) {
                <div class="flex flex-col items-center py-6 text-center">
                    <i class="pi pi-calendar text-surface-300 text-3xl mb-2"></i>
                    <p class="text-surface-500 text-sm">{{ t('calendar.noEvents') }}</p>
                </div>
            } @else {
                <div class="flex flex-col divide-y divide-surface-100 dark:divide-surface-800">
                    @for (ev of events(); track ev.id) {
                        <div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 px-2 rounded-lg transition-colors" routerLink="/calendar">
                            <!-- Color dot + date -->
                            <div class="flex flex-col items-center gap-0.5 min-w-[2.5rem]">
                                <div class="h-2.5 w-2.5 rounded-full" [class]="getColorClass(ev.color)"></div>
                                <span class="text-xs text-surface-500 text-center leading-tight">{{ formatDate(ev.startDate) }}</span>
                            </div>
                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0 truncate flex items-center gap-1">
                                    {{ ev.title }}
                                    @if (ev.recurrenceRule) {
                                        <i class="pi pi-refresh text-xs text-surface-400 flex-shrink-0"></i>
                                    }
                                </div>
                                <div class="text-xs text-surface-400 flex items-center gap-2 mt-0.5">
                                    @if (ev.allDay) {
                                        <span>{{ t('calendar.allDay') }}</span>
                                    } @else {
                                        <span>{{ formatTime(ev.startDate) }}</span>
                                    }
                                    @if (ev.location) {
                                        <span class="truncate">· {{ ev.location }}</span>
                                    }
                                </div>
                            </div>
                            @if (ev.myStatus) {
                                <p-tag [value]="t('calendar.status.' + ev.myStatus)" [severity]="statusSeverity(ev.myStatus)" styleClass="text-xs flex-shrink-0" />
                            }
                        </div>
                    }
                </div>
            }
        </p-card>
    `
})
export class UpcomingEventsWidget implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    protected readonly loading = signal(true);
    protected readonly events = signal<CalendarEvent[]>([]);
    protected readonly getColorClass = getEventColorClass;

    ngOnInit(): void {
        const from = new Date().toISOString();
        const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const url = `${this.apiConfig.baseUrl}${CALENDAR_ROUTES.list(from, to)}`;
        this.http.get<CalendarEvent[]>(url).subscribe({
            next: (data) => { this.events.set(data.slice(0, 5)); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    protected formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    }

    protected formatTime(dateStr: string): string {
        return new Date(dateStr).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
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
}
