import { DatePipe, JsonPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type { LogCategory, LogLevel } from "../../../core/models/admin-logs/admin-logs";
import { AdminLogsFacade } from "../../../facade/admin-logs/admin-logs-facade";

interface SelectOption<T> {
    label: string;
    value: T | undefined;
}

@Component({
    selector: "app-admin-logs",
    standalone: true,
    imports: [
        DatePipe,
        JsonPipe,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        CardModule,
        ConfirmDialogModule,
        InputTextModule,
        PaginatorModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TooltipModule
    ],
    providers: [ConfirmationService],
    templateUrl: "./admin-logs.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLogs implements OnInit {
    readonly facade = inject(AdminLogsFacade);
    private readonly confirmationService = inject(ConfirmationService);

    // Filters
    readonly filterLevel = signal<LogLevel | undefined>(undefined);
    readonly filterCategory = signal<LogCategory | undefined>(undefined);
    readonly filterSearch = signal("");
    readonly filterFrom = signal("");
    readonly filterTo = signal("");
    readonly currentPage = signal(1);

    readonly levelOptions: SelectOption<LogLevel>[] = [
        { label: "-- All --", value: undefined },
        { label: "Info", value: "info" },
        { label: "Warning", value: "warn" },
        { label: "Error", value: "error" }
    ];

    readonly categoryOptions: SelectOption<LogCategory>[] = [
        { label: "-- All --", value: undefined },
        { label: "Auth", value: "auth" },
        { label: "User", value: "user" },
        { label: "Forum", value: "forum" },
        { label: "Credit", value: "credit" },
        { label: "Shop", value: "shop" },
        { label: "Marketplace", value: "marketplace" },
        { label: "Gamification", value: "gamification" },
        { label: "TCG", value: "tcg" },
        { label: "Lotto", value: "lotto" },
        { label: "Gallery", value: "gallery" },
        { label: "Blog", value: "blog" },
        { label: "Admin", value: "admin" },
        { label: "System", value: "system" }
    ];

    readonly totalRecords = computed(() => this.facade.logs().total);

    ngOnInit(): void {
        this.facade.loadLogs();
        this.facade.loadStats();
    }

    onFilter(): void {
        this.currentPage.set(1);
        this.loadWithFilters();
    }

    onClearFilters(): void {
        this.filterLevel.set(undefined);
        this.filterCategory.set(undefined);
        this.filterSearch.set("");
        this.filterFrom.set("");
        this.filterTo.set("");
        this.currentPage.set(1);
        this.facade.loadLogs();
    }

    onPageChange(event: { first: number; rows: number }): void {
        const page = Math.floor(event.first / event.rows) + 1;
        this.currentPage.set(page);
        this.loadWithFilters();
    }

    onCleanup(event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: "Delete logs older than 90 days?",
            accept: () => this.facade.cleanup(90)
        });
    }

    getLevelSeverity(level: LogLevel): "info" | "warn" | "danger" | "success" | "secondary" | "contrast" {
        switch (level) {
            case "info":
                return "info";
            case "warn":
                return "warn";
            case "error":
                return "danger";
            default:
                return "secondary";
        }
    }

    getLevelIcon(level: LogLevel): string {
        switch (level) {
            case "info":
                return "pi pi-info-circle";
            case "warn":
                return "pi pi-exclamation-triangle";
            case "error":
                return "pi pi-times-circle";
            default:
                return "pi pi-circle";
        }
    }

    private loadWithFilters(): void {
        this.facade.loadLogs({
            level: this.filterLevel(),
            category: this.filterCategory(),
            search: this.filterSearch() || undefined,
            from: this.filterFrom() || undefined,
            to: this.filterTo() || undefined,
            page: this.currentPage(),
            limit: 50
        });
    }
}
