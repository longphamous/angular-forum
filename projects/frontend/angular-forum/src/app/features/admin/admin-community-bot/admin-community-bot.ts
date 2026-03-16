import { JsonPipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

import {
    ActionConfig,
    BotAction,
    BotCondition,
    BotLog,
    BotTrigger,
    CommunityBot,
    CreateBotPayload,
    TriggerConfig
} from "../../../core/models/community-bot/community-bot";
import { CommunityBotFacade } from "../../../facade/community-bot/community-bot-facade";

@Component({
    selector: "admin-community-bot",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MessageService],
    imports: [
        ButtonModule,
        DialogModule,
        DividerModule,
        FormsModule,
        InputTextModule,
        JsonPipe,
        PaginatorModule,
        SelectModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./admin-community-bot.html"
})
export class AdminCommunityBot implements OnInit {
    readonly facade = inject(CommunityBotFacade);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly messageService = inject(MessageService);

    // Dialog state
    readonly editorVisible = signal(false);
    readonly logsDialogVisible = signal(false);
    readonly testResultsVisible = signal(false);
    readonly saving = signal(false);
    readonly testing = signal(false);
    readonly testLogs = signal<BotLog[]>([]);

    editingBot: CommunityBot | null = null;

    // Form fields
    formName = "";
    formDescription = "";
    formEnabled = true;
    formTestMode = false;
    formTrigger: BotTrigger = "new_user";
    formAction: BotAction = "send_notification";
    formLanguage = "auto";
    formInactiveDays = 30;
    formCronExpression = "0 8 * * *";
    formForumId = "";
    formNotificationTitle = "";
    formNotificationBody = "";
    formNotificationLink = "";
    formMessageSubject = "";
    formMessageBody = "";
    formConditions: BotCondition[] = [];

    // Logs pagination
    logsPage = 0;
    logsPageSize = 50;
    selectedBotIdForLogs: string | null = null;

    // Placeholder hint strings rendered via interpolation to avoid Angular template parsing issues
    protected readonly ph = {
        username: "{{username}}",
        displayName: "{{displayName}}",
        threadTitle: "{{threadTitle}}",
        forumName: "{{forumName}}",
        inactiveDays: "{{inactiveDays}}",
        date: "{{date}}"
    };

    readonly triggerOptions = [
        { label: "Neuer Benutzer", value: "new_user" },
        { label: "Benutzer - Geburtstag", value: "user_birthday" },
        { label: "Benutzer - Inaktivität", value: "user_inactivity" },
        { label: "Forum - Neues Thema", value: "new_thread" },
        { label: "Zeitgesteuert", value: "scheduled" },
        { label: "Benutzer - Gruppenänderung", value: "user_group_change" }
    ];

    readonly actionOptions = [
        { label: "Benachrichtigung senden", value: "send_notification" },
        { label: "Private Nachricht senden", value: "send_private_message" },
        { label: "Nur protokollieren", value: "log_only" }
    ];

    readonly languageOptions = [
        { label: "Automatisch ermitteln", value: "auto" },
        { label: "Deutsch", value: "de" },
        { label: "Englisch", value: "en" }
    ];

    readonly conditionFieldOptions = [
        { label: "Benutzerrolle", value: "user_role" },
        { label: "Anzahl Beiträge", value: "user_post_count" },
        { label: "Registrierungsdauer (Tage)", value: "user_registration_days" },
        { label: "Gruppenkennung", value: "user_group_id" }
    ];

    readonly conditionOperatorOptions = [
        { label: "Gleich", value: "eq" },
        { label: "Ungleich", value: "ne" },
        { label: "Größer als", value: "gt" },
        { label: "Kleiner als", value: "lt" },
        { label: "Größer gleich", value: "gte" },
        { label: "Kleiner gleich", value: "lte" }
    ];

    ngOnInit(): void {
        this.facade.loadBots();
        this.facade.loadStats();
        this.facade.loadLogs(this.logsPageSize, 0);
    }

    openCreate(): void {
        this.editingBot = null;
        this.resetForm();
        this.editorVisible.set(true);
    }

    openEdit(bot: CommunityBot): void {
        this.editingBot = bot;
        this.formName = bot.name;
        this.formDescription = bot.description ?? "";
        this.formEnabled = bot.enabled;
        this.formTestMode = bot.testMode;
        this.formTrigger = bot.trigger;
        this.formAction = bot.action;
        this.formLanguage = bot.language;
        this.formConditions = bot.conditions ? [...bot.conditions] : [];
        const tc = bot.triggerConfig;
        this.formInactiveDays = tc?.inactiveDays ?? 30;
        this.formCronExpression = tc?.cronExpression ?? "0 8 * * *";
        this.formForumId = tc?.forumId ?? "";
        const ac = bot.actionConfig;
        this.formNotificationTitle = ac?.notificationTitle ?? "";
        this.formNotificationBody = ac?.notificationBody ?? "";
        this.formNotificationLink = ac?.notificationLink ?? "";
        this.formMessageSubject = ac?.messageSubject ?? "";
        this.formMessageBody = ac?.messageBody ?? "";
        this.editorVisible.set(true);
    }

    saveBot(): void {
        if (!this.formName.trim()) return;
        this.saving.set(true);

        const triggerConfig = this.buildTriggerConfig();
        const actionConfig = this.buildActionConfig();

        const payload: CreateBotPayload = {
            name: this.formName.trim(),
            description: this.formDescription.trim() || undefined,
            enabled: this.formEnabled,
            testMode: this.formTestMode,
            trigger: this.formTrigger,
            triggerConfig: Object.keys(triggerConfig).length ? triggerConfig : undefined,
            conditions: this.formConditions.length ? this.formConditions : undefined,
            action: this.formAction,
            actionConfig: Object.keys(actionConfig).length ? actionConfig : undefined,
            language: this.formLanguage
        };

        const obs = this.editingBot
            ? this.facade.updateBot(this.editingBot.id, payload)
            : this.facade.createBot(payload);

        obs.subscribe({
            next: () => {
                this.saving.set(false);
                this.editorVisible.set(false);
                this.facade.loadBots();
                this.facade.loadStats();
                this.messageService.add({
                    severity: "success",
                    summary: "Gespeichert",
                    detail: "Bot wurde gespeichert."
                });
                this.cd.markForCheck();
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler", detail: "Speichern fehlgeschlagen." });
                this.cd.markForCheck();
            }
        });
    }

    toggleBot(bot: CommunityBot): void {
        this.facade.toggleBot(bot.id).subscribe({
            next: () => {
                this.facade.loadBots();
                this.facade.loadStats();
                this.cd.markForCheck();
            }
        });
    }

    deleteBot(bot: CommunityBot): void {
        if (!confirm(`Bot "${bot.name}" wirklich löschen?`)) return;
        this.facade.deleteBot(bot.id).subscribe({
            next: () => {
                this.facade.loadBots();
                this.facade.loadStats();
                this.cd.markForCheck();
            }
        });
    }

    testBot(bot: CommunityBot): void {
        this.testing.set(true);
        this.facade.testBot(bot.id).subscribe({
            next: (logs) => {
                this.testLogs.set(logs);
                this.testing.set(false);
                this.testResultsVisible.set(true);
                this.cd.markForCheck();
            },
            error: () => {
                this.testing.set(false);
                this.cd.markForCheck();
            }
        });
    }

    openLogs(bot?: CommunityBot): void {
        this.selectedBotIdForLogs = bot?.id ?? null;
        this.logsPage = 0;
        this.facade.loadLogs(this.logsPageSize, 0, this.selectedBotIdForLogs ?? undefined);
        this.logsDialogVisible.set(true);
    }

    onLogsPageChange(event: PaginatorState): void {
        this.logsPage = event.page ?? 0;
        this.facade.loadLogs(
            this.logsPageSize,
            this.logsPage * this.logsPageSize,
            this.selectedBotIdForLogs ?? undefined
        );
    }

    addCondition(): void {
        this.formConditions = [...this.formConditions, { field: "user_role", operator: "eq", value: "member" }];
    }

    removeCondition(index: number): void {
        this.formConditions = this.formConditions.filter((_, i) => i !== index);
    }

    updateCondition(index: number, partial: Partial<BotCondition>): void {
        this.formConditions = this.formConditions.map((c, i) => (i === index ? { ...c, ...partial } : c));
    }

    triggerLabel(trigger: string): string {
        return this.triggerOptions.find((o) => o.value === trigger)?.label ?? trigger;
    }

    actionLabel(action: string): string {
        return this.actionOptions.find((o) => o.value === action)?.label ?? action;
    }

    triggerSeverity(trigger: string): "success" | "info" | "warn" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "secondary"> = {
            new_user: "success",
            user_birthday: "info",
            user_inactivity: "warn",
            new_thread: "success",
            scheduled: "secondary",
            user_group_change: "info"
        };
        return map[trigger] ?? "secondary";
    }

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            success: "success",
            test: "info",
            skipped: "warn",
            failed: "danger"
        };
        return map[status] ?? "secondary";
    }

    formatDate(d: string | null): string {
        if (!d) return "—";
        return new Date(d).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    private resetForm(): void {
        this.formName = "";
        this.formDescription = "";
        this.formEnabled = true;
        this.formTestMode = false;
        this.formTrigger = "new_user";
        this.formAction = "send_notification";
        this.formLanguage = "auto";
        this.formInactiveDays = 30;
        this.formCronExpression = "0 8 * * *";
        this.formForumId = "";
        this.formNotificationTitle = "";
        this.formNotificationBody = "";
        this.formNotificationLink = "";
        this.formMessageSubject = "";
        this.formMessageBody = "";
        this.formConditions = [];
    }

    private buildTriggerConfig(): TriggerConfig {
        const cfg: TriggerConfig = {};
        if (this.formTrigger === "user_inactivity") cfg.inactiveDays = this.formInactiveDays;
        if (this.formTrigger === "scheduled") cfg.cronExpression = this.formCronExpression;
        if (this.formTrigger === "new_thread" && this.formForumId) cfg.forumId = this.formForumId;
        return cfg;
    }

    private buildActionConfig(): ActionConfig {
        const cfg: ActionConfig = {};
        if (this.formAction === "send_notification") {
            if (this.formNotificationTitle) cfg.notificationTitle = this.formNotificationTitle;
            if (this.formNotificationBody) cfg.notificationBody = this.formNotificationBody;
            if (this.formNotificationLink) cfg.notificationLink = this.formNotificationLink;
        }
        if (this.formAction === "send_private_message") {
            if (this.formMessageSubject) cfg.messageSubject = this.formMessageSubject;
            if (this.formMessageBody) cfg.messageBody = this.formMessageBody;
        }
        return cfg;
    }
}
