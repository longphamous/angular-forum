import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ChipModule } from "primeng/chip";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { MessageService } from "primeng/api";

import { CALENDAR_ROUTES } from "../../../core/api/calendar.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    AttendeeStatus,
    CalendarDay,
    CalendarEvent,
    CalendarEventDetail,
    CalendarView,
    CreateEventPayload,
    EVENT_COLORS,
    RecurrenceRule,
    RespondPayload,
    getEventColorClass
} from "../../../core/models/calendar/calendar";
import { AuthFacade } from "../../../facade/auth/auth-facade";

const WEEKDAY_KEYS = ["calendar.week.mo", "calendar.week.tu", "calendar.week.we", "calendar.week.th", "calendar.week.fr", "calendar.week.sa", "calendar.week.su"];

interface EventFormData {
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    isPublic: boolean;
    maxAttendees: number | null;
    color: string;
    isRecurring: boolean;
    recurrenceFrequency: "daily" | "weekly" | "monthly" | "yearly";
    recurrenceInterval: number;
    recurrenceUntil: Date | null;
    recurrenceByDay: string[];
}

function defaultForm(): EventFormData {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
        title: "",
        description: "",
        location: "",
        startDate: start,
        endDate: end,
        allDay: false,
        isPublic: true,
        maxAttendees: null,
        color: "blue",
        isRecurring: false,
        recurrenceFrequency: "weekly",
        recurrenceInterval: 1,
        recurrenceUntil: null,
        recurrenceByDay: []
    };
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        BadgeModule,
        ButtonModule,
        CheckboxModule,
        ChipModule,
        DatePickerModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        RouterModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService],
    selector: "app-calendar-page",
    templateUrl: "./calendar-page.html"
})
export class CalendarPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly translocoService = inject(TranslocoService);
    protected readonly authFacade = inject(AuthFacade);
    protected readonly messageService = inject(MessageService);

    // ─── View state ──────────────────────────────────────────────────────────
    protected readonly view = signal<CalendarView>("month");
    protected readonly currentDate = signal(new Date());
    protected readonly loading = signal(false);
    protected readonly events = signal<CalendarEvent[]>([]);

    // ─── Dialog state ─────────────────────────────────────────────────────────
    protected readonly createDialogVisible = signal(false);
    protected readonly detailDialogVisible = signal(false);
    protected editingId: string | null = null;
    protected form: EventFormData = defaultForm();
    protected readonly saving = signal(false);
    protected readonly selectedEvent = signal<CalendarEventDetail | null>(null);
    protected readonly eventLoading = signal(false);

    // ─── RSVP state ───────────────────────────────────────────────────────────
    protected readonly rsvpStatus = signal<AttendeeStatus | null>(null);
    protected rsvpCompanions = 0;
    protected rsvpDeclineReason = "";
    protected readonly rsvpDialogVisible = signal(false);
    protected readonly rsvpSaving = signal(false);

    // ─── Invite state ─────────────────────────────────────────────────────────
    protected inviteUserIds = "";
    protected readonly inviteDialogVisible = signal(false);
    protected readonly inviteSaving = signal(false);

    // ─── Constants ────────────────────────────────────────────────────────────
    protected readonly eventColors = EVENT_COLORS;
    protected readonly getEventColorClass = getEventColorClass;
    protected readonly weekDayLabels = WEEKDAY_KEYS;
    protected readonly byDayOptions = [
        { label: "Mo", value: "MO" }, { label: "Di", value: "TU" }, { label: "Mi", value: "WE" },
        { label: "Do", value: "TH" }, { label: "Fr", value: "FR" }, { label: "Sa", value: "SA" },
        { label: "So", value: "SU" }
    ];
    protected readonly frequencyOptions = [
        { label: "Täglich", value: "daily" }, { label: "Wöchentlich", value: "weekly" },
        { label: "Monatlich", value: "monthly" }, { label: "Jährlich", value: "yearly" }
    ];

    protected readonly rsvpOptions: { status: AttendeeStatus; icon: string; borderClass: string; bgClass: string }[] = [
        { status: "accepted", icon: "pi-check", borderClass: "border-green-400", bgClass: "bg-green-50 dark:bg-green-900/20" },
        { status: "maybe", icon: "pi-question", borderClass: "border-yellow-400", bgClass: "bg-yellow-50 dark:bg-yellow-900/20" },
        { status: "declined", icon: "pi-times", borderClass: "border-red-400", bgClass: "bg-red-50 dark:bg-red-900/20" }
    ];

    // ─── Computed: Month grid ─────────────────────────────────────────────────
    protected readonly monthDays = computed((): CalendarDay[] => {
        const ref = this.currentDate();
        const year = ref.getFullYear();
        const month = ref.getMonth();
        const firstDay = new Date(year, month, 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start from Monday of the first week
        let dayOfWeek = firstDay.getDay(); // 0=Sun
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0
        const gridStart = new Date(firstDay);
        gridStart.setDate(firstDay.getDate() - dayOfWeek);

        const evs = this.events();
        const days: CalendarDay[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + i);
            const dateStr = date.toDateString();
            days.push({
                date,
                isCurrentMonth: date.getMonth() === month,
                isToday: date.toDateString() === today.toDateString(),
                events: evs.filter((e) => {
                    const s = new Date(e.startDate);
                    return s.toDateString() === dateStr;
                })
            });
        }
        return days;
    });

    // ─── Computed: Week grid ──────────────────────────────────────────────────
    protected readonly weekDays = computed((): CalendarDay[] => {
        const ref = this.currentDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let dow = ref.getDay();
        dow = dow === 0 ? 6 : dow - 1;
        const monday = new Date(ref);
        monday.setDate(ref.getDate() - dow);
        monday.setHours(0, 0, 0, 0);

        const evs = this.events();
        const days: CalendarDay[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.toDateString() === today.toDateString(),
                events: evs.filter((e) => new Date(e.startDate).toDateString() === date.toDateString())
            });
        }
        return days;
    });

    // ─── Computed: List (next 90 days grouped) ────────────────────────────────
    protected readonly listGroups = computed((): { dateLabel: string; events: CalendarEvent[] }[] => {
        const evs = [...this.events()].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of evs) {
            const key = new Date(ev.startDate).toDateString();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        }
        return [...map.entries()].map(([key, events]) => ({
            dateLabel: new Date(key).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            events
        }));
    });

    // ─── Computed: Period label ───────────────────────────────────────────────
    protected readonly periodLabel = computed((): string => {
        const ref = this.currentDate();
        const v = this.view();
        if (v === "month") {
            return ref.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
        }
        if (v === "week") {
            const days = this.weekDays();
            if (!days.length) return "";
            const first = days[0]!.date;
            const last = days[6]!.date;
            return `${first.getDate()}. – ${last.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}`;
        }
        return this.translocoService.translate("calendar.listView");
    });

    protected readonly monthWeeks = computed((): CalendarDay[][] => {
        const days = this.monthDays();
        const weeks: CalendarDay[][] = [];
        for (let i = 0; i < 6; i++) weeks.push(days.slice(i * 7, i * 7 + 7));
        return weeks;
    });

    constructor() {
        effect(() => {
            const date = this.currentDate();
            const v = this.view();
            this.loadEvents(date, v);
        });
    }

    ngOnInit(): void {}

    // ─── Navigation ───────────────────────────────────────────────────────────
    protected prev(): void {
        this.currentDate.update((d) => {
            const n = new Date(d);
            if (this.view() === "month") n.setMonth(d.getMonth() - 1);
            else if (this.view() === "week") n.setDate(d.getDate() - 7);
            else n.setDate(d.getDate() - 30);
            return n;
        });
    }

    protected next(): void {
        this.currentDate.update((d) => {
            const n = new Date(d);
            if (this.view() === "month") n.setMonth(d.getMonth() + 1);
            else if (this.view() === "week") n.setDate(d.getDate() + 7);
            else n.setDate(d.getDate() + 30);
            return n;
        });
    }

    protected goToToday(): void {
        this.currentDate.set(new Date());
    }

    protected setView(v: CalendarView): void {
        this.view.set(v);
    }

    protected jumpToDate(date: Date): void {
        this.currentDate.set(date);
        if (this.view() === "month") this.view.set("week");
    }

    // ─── Event loading ────────────────────────────────────────────────────────
    private loadEvents(ref: Date, view: CalendarView): void {
        let from: Date, to: Date;
        if (view === "month") {
            from = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
            to = new Date(ref.getFullYear(), ref.getMonth() + 2, 0);
        } else if (view === "week") {
            let dow = ref.getDay();
            dow = dow === 0 ? 6 : dow - 1;
            from = new Date(ref);
            from.setDate(ref.getDate() - dow);
            to = new Date(from);
            to.setDate(from.getDate() + 7);
        } else {
            from = new Date();
            to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        }

        this.loading.set(true);
        const url = `${this.apiConfig.baseUrl}${CALENDAR_ROUTES.list(from.toISOString(), to.toISOString())}`;
        this.http.get<CalendarEvent[]>(url).subscribe({
            next: (data) => { this.events.set(data); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    // ─── Create / Edit ────────────────────────────────────────────────────────
    protected openCreate(date?: Date): void {
        this.editingId = null;
        this.form = defaultForm();
        if (date) {
            const start = new Date(date);
            start.setHours(10, 0, 0, 0);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            this.form.startDate = start;
            this.form.endDate = end;
        }
        this.createDialogVisible.set(true);
    }

    protected openEdit(event: CalendarEvent): void {
        this.editingId = event.id;
        const rule = event.recurrenceRule;
        this.form = {
            title: event.title,
            description: event.description ?? "",
            location: event.location ?? "",
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            allDay: event.allDay,
            isPublic: event.isPublic,
            maxAttendees: event.maxAttendees,
            color: event.color ?? "blue",
            isRecurring: !!rule,
            recurrenceFrequency: rule?.frequency ?? "weekly",
            recurrenceInterval: rule?.interval ?? 1,
            recurrenceUntil: rule?.until ? new Date(rule.until) : null,
            recurrenceByDay: rule?.byDay ?? []
        };
        this.createDialogVisible.set(true);
    }

    protected saveEvent(): void {
        if (!this.form.title.trim()) return;
        this.saving.set(true);

        const rule: RecurrenceRule | null = this.form.isRecurring
            ? {
                frequency: this.form.recurrenceFrequency,
                interval: this.form.recurrenceInterval,
                until: this.form.recurrenceUntil?.toISOString().split("T")[0] ?? null,
                byDay: this.form.recurrenceByDay.length ? this.form.recurrenceByDay : undefined
            }
            : null;

        const payload: CreateEventPayload = {
            title: this.form.title,
            description: this.form.description || null,
            location: this.form.location || null,
            startDate: this.form.startDate.toISOString(),
            endDate: this.form.endDate.toISOString(),
            allDay: this.form.allDay,
            isPublic: this.form.isPublic,
            maxAttendees: this.form.maxAttendees,
            color: this.form.color,
            recurrenceRule: rule
        };

        const req$ = this.editingId
            ? this.http.patch<CalendarEvent>(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.update(this.editingId)}`, payload)
            : this.http.post<CalendarEvent>(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.create()}`, payload);

        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.createDialogVisible.set(false);
                this.loadEvents(this.currentDate(), this.view());
                this.messageService.add({ severity: "success", summary: "Gespeichert", life: 2000 });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler beim Speichern", life: 3000 });
            }
        });
    }

    protected deleteEvent(id: string): void {
        this.http.delete(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.delete(id)}`).subscribe({
            next: () => {
                this.detailDialogVisible.set(false);
                this.loadEvents(this.currentDate(), this.view());
                this.messageService.add({ severity: "success", summary: "Termin gelöscht", life: 2000 });
            },
            error: () => this.messageService.add({ severity: "error", summary: "Fehler", life: 3000 })
        });
    }

    // ─── Detail Dialog ────────────────────────────────────────────────────────
    protected openDetail(event: CalendarEvent): void {
        this.selectedEvent.set(null);
        this.eventLoading.set(true);
        this.detailDialogVisible.set(true);
        this.http.get<CalendarEventDetail>(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.detail(event.id)}`).subscribe({
            next: (data) => {
                this.selectedEvent.set(data);
                this.rsvpStatus.set(data.myStatus);
                this.eventLoading.set(false);
            },
            error: () => this.eventLoading.set(false)
        });
    }

    // ─── RSVP ─────────────────────────────────────────────────────────────────
    protected submitRsvp(): void {
        const ev = this.selectedEvent();
        if (!ev || !this.rsvpStatus()) return;
        this.rsvpSaving.set(true);
        const payload: RespondPayload = {
            status: this.rsvpStatus()!,
            companions: this.rsvpCompanions,
            declineReason: this.rsvpStatus() === "declined" ? this.rsvpDeclineReason || null : null
        };
        this.http.post(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.respond(ev.id)}`, payload).subscribe({
            next: () => {
                this.rsvpSaving.set(false);
                this.rsvpDialogVisible.set(false);
                this.openDetail(ev);
                this.loadEvents(this.currentDate(), this.view());
                this.messageService.add({ severity: "success", summary: "Rückmeldung gespeichert", life: 2000 });
            },
            error: () => { this.rsvpSaving.set(false); this.messageService.add({ severity: "error", summary: "Fehler", life: 3000 }); }
        });
    }

    // ─── Invite ───────────────────────────────────────────────────────────────
    protected submitInvite(): void {
        const ev = this.selectedEvent();
        if (!ev) return;
        const ids = this.inviteUserIds.split(",").map((s) => s.trim()).filter(Boolean);
        if (!ids.length) return;
        this.inviteSaving.set(true);
        this.http.post(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.invite(ev.id)}`, { userIds: ids }).subscribe({
            next: () => {
                this.inviteSaving.set(false);
                this.inviteDialogVisible.set(false);
                this.inviteUserIds = "";
                this.openDetail(ev);
                this.messageService.add({ severity: "success", summary: "Einladungen versendet", life: 2000 });
            },
            error: () => { this.inviteSaving.set(false); this.messageService.add({ severity: "error", summary: "Fehler", life: 3000 }); }
        });
    }

    // ─── iCal ─────────────────────────────────────────────────────────────────
    protected downloadIcal(eventId: string): void {
        window.open(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.ical(eventId)}`, "_blank");
    }

    protected downloadMyIcal(): void {
        window.open(`${this.apiConfig.baseUrl}${CALENDAR_ROUTES.myIcal()}`, "_blank");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    protected formatTime(dateStr: string): string {
        return new Date(dateStr).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    }

    protected formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }

    protected formatDateShort(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
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

    protected isCreator(event: CalendarEvent): boolean {
        return event.createdByUserId === this.authFacade.currentUser()?.id;
    }
}
