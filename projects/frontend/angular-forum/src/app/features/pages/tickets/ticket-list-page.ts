import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import type { TicketPriority, TicketStatus, TicketType } from "../../../core/models/ticket/ticket";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { TicketFacade } from "../../../facade/ticket/ticket-facade";

@Component({
    selector: "ticket-list-page",
    standalone: true,
    imports: [
        DatePipe,
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        PaginatorModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TooltipModule
    ],
    templateUrl: "./ticket-list-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketListPage implements OnInit {
    readonly facade = inject(TicketFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);

    // Filters
    readonly filterStatus = signal<TicketStatus | "">("");
    readonly filterPriority = signal<TicketPriority | "">("");
    readonly filterType = signal<TicketType | "">("");
    readonly filterProject = signal("");
    readonly filterMyTickets = signal(false);
    readonly searchQuery = signal("");
    readonly page = signal(1);
    readonly limit = signal(20);
    readonly sortField = signal("createdAt");
    readonly sortOrder = signal<"ASC" | "DESC">("DESC");

    // Create dialog
    readonly createDialogVisible = signal(false);
    readonly createTitle = signal("");
    readonly createDescription = signal("");
    readonly createPriority = signal<TicketPriority>("normal");
    readonly createType = signal<TicketType>("task");
    readonly createCategoryId = signal<string | null>(null);
    readonly createAssigneeId = signal<string | null>(null);
    readonly createProjectId = signal<string | null>(null);
    readonly createStoryPoints = signal<number | null>(null);
    readonly createSaving = signal(false);

    readonly statusOptions = computed(() => [
        { label: this.t.translate("tickets.filterAll"), value: "" },
        { label: this.t.translate("tickets.status.open"), value: "open" },
        { label: this.t.translate("tickets.status.inProgress"), value: "in_progress" },
        { label: this.t.translate("tickets.status.waiting"), value: "waiting" },
        { label: this.t.translate("tickets.status.followUp"), value: "follow_up" },
        { label: this.t.translate("tickets.status.resolved"), value: "resolved" },
        { label: this.t.translate("tickets.status.closed"), value: "closed" }
    ]);

    readonly priorityOptions = computed(() => [
        { label: this.t.translate("tickets.filterAll"), value: "" },
        { label: this.t.translate("tickets.priority.low"), value: "low" },
        { label: this.t.translate("tickets.priority.normal"), value: "normal" },
        { label: this.t.translate("tickets.priority.high"), value: "high" },
        { label: this.t.translate("tickets.priority.critical"), value: "critical" }
    ]);

    readonly typeFilterOptions = computed(() => [
        { label: this.t.translate("tickets.filterAll"), value: "" },
        { label: this.t.translate("tickets.type.epic"), value: "epic" },
        { label: this.t.translate("tickets.type.story"), value: "story" },
        { label: this.t.translate("tickets.type.bug"), value: "bug" },
        { label: this.t.translate("tickets.type.task"), value: "task" },
        { label: this.t.translate("tickets.type.subTask"), value: "sub_task" },
        { label: this.t.translate("tickets.type.support"), value: "support" },
        { label: this.t.translate("tickets.type.feature"), value: "feature" }
    ]);

    readonly typeOptions = computed(() => [
        { label: this.t.translate("tickets.type.epic"), value: "epic" },
        { label: this.t.translate("tickets.type.story"), value: "story" },
        { label: this.t.translate("tickets.type.bug"), value: "bug" },
        { label: this.t.translate("tickets.type.task"), value: "task" },
        { label: this.t.translate("tickets.type.subTask"), value: "sub_task" },
        { label: this.t.translate("tickets.type.support"), value: "support" },
        { label: this.t.translate("tickets.type.feature"), value: "feature" }
    ]);

    ngOnInit(): void {
        this.loadTickets();
        this.facade.loadStats();
        this.facade.loadCategories();
        this.facade.loadProjects();
        this.facade.loadAssignableUsers();
    }

    loadTickets(): void {
        const params: Record<string, string | number> = {
            page: this.page(),
            limit: this.limit(),
            sortBy: this.sortField(),
            sortOrder: this.sortOrder()
        };
        if (this.filterStatus()) params["status"] = this.filterStatus();
        if (this.filterPriority()) params["priority"] = this.filterPriority();
        if (this.filterType()) params["type"] = this.filterType();
        if (this.filterProject()) params["projectId"] = this.filterProject();
        if (this.filterMyTickets()) params["assigneeId"] = this.authFacade.currentUser()?.id ?? "";
        if (this.searchQuery()) params["search"] = this.searchQuery();
        this.facade.loadTickets(params);
    }

    onSort(field: string): void {
        if (this.sortField() === field) {
            this.sortOrder.set(this.sortOrder() === "ASC" ? "DESC" : "ASC");
        } else {
            this.sortField.set(field);
            this.sortOrder.set("ASC");
        }
        this.page.set(1);
        this.loadTickets();
    }

    toggleMyTickets(): void {
        this.filterMyTickets.set(!this.filterMyTickets());
        this.page.set(1);
        this.loadTickets();
    }

    onPageChange(event: { first?: number; rows?: number }): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.limit();
        this.page.set(Math.floor(first / rows) + 1);
        this.limit.set(rows);
        this.loadTickets();
    }

    onFilterChange(): void {
        this.page.set(1);
        this.loadTickets();
    }

    openTicket(id: string): void {
        this.router.navigate(["/tickets", id]);
    }

    openCreateDialog(): void {
        this.createTitle.set("");
        this.createDescription.set("");
        this.createPriority.set("normal");
        this.createType.set("task");
        this.createCategoryId.set(null);
        this.createAssigneeId.set(null);
        this.createProjectId.set(null);
        this.createStoryPoints.set(null);
        this.createDialogVisible.set(true);
    }

    submitTicket(): void {
        if (!this.createTitle() || !this.createDescription()) return;
        this.createSaving.set(true);

        this.facade
            .createTicket({
                title: this.createTitle(),
                description: this.createDescription(),
                priority: this.createPriority(),
                type: this.createType(),
                categoryId: this.createCategoryId() ?? undefined,
                assigneeId: this.createAssigneeId() ?? undefined,
                projectId: this.createProjectId() ?? undefined,
                storyPoints: this.createStoryPoints() ?? undefined
            })
            .subscribe({
                next: (ticket) => {
                    this.createSaving.set(false);
                    this.createDialogVisible.set(false);
                    this.router.navigate(["/tickets", ticket.id]);
                },
                error: () => this.createSaving.set(false)
            });
    }

    typeSeverity(type: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            epic: "warn",
            story: "success",
            bug: "danger",
            task: "info",
            sub_task: "secondary",
            support: "info",
            feature: "success"
        };
        return map[type] ?? "info";
    }

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            epic: "pi pi-bolt",
            story: "pi pi-bookmark",
            bug: "pi pi-bug",
            task: "pi pi-check-square",
            sub_task: "pi pi-minus",
            support: "pi pi-question-circle",
            feature: "pi pi-star"
        };
        return map[type] ?? "pi pi-ticket";
    }

    statusSeverity(status: TicketStatus): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
            open: "info",
            in_progress: "warn",
            waiting: "secondary",
            follow_up: "contrast",
            resolved: "success",
            closed: "secondary"
        };
        return map[status] ?? "info";
    }

    prioritySeverity(p: TicketPriority): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            low: "secondary",
            normal: "info",
            high: "warn",
            critical: "danger"
        };
        return map[p] ?? "info";
    }
}
