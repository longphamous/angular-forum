import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import type {
    CreateTicketPayload,
    Ticket,
    TicketPriority,
    TicketStatus,
    TicketType,
    UpdateTicketPayload
} from "../../../../core/models/ticket/ticket";
import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { BoardFacade } from "../../../../facade/ticket/board-facade";
import { TicketFacade } from "../../../../facade/ticket/ticket-facade";
import { BoardCard } from "./board-card";

@Component({
    selector: "kanban-board",
    standalone: true,
    imports: [
        DatePipe,
        DragDropModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        DatePickerModule,
        DialogModule,
        InputNumberModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        BoardCard
    ],
    providers: [MessageService],
    templateUrl: "./kanban-board.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            :host ::ng-deep {
                .cdk-drag-preview {
                    box-shadow:
                        0 10px 15px -3px rgba(0, 0, 0, 0.15),
                        0 4px 6px -2px rgba(0, 0, 0, 0.1);
                    border-radius: 0.5rem;
                    transform: rotate(2deg);
                    opacity: 0.95;
                }

                .cdk-drag-animating {
                    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
                }

                .board-drag-placeholder {
                    background: var(--primary-color);
                    opacity: 0.12;
                    border: 2px dashed var(--primary-color);
                    border-radius: 0.5rem;
                    min-height: 4rem;
                    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
                }

                .board-drop-zone.cdk-drop-list-dragging .board-drag-item:not(.cdk-drag-placeholder) {
                    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
                }

                .board-drag-item {
                    cursor: grab;
                }

                .board-drag-item:active {
                    cursor: grabbing;
                }
            }
        `
    ]
})
export class KanbanBoard implements OnInit {
    readonly boardFacade = inject(BoardFacade);
    readonly ticketFacade = inject(TicketFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);

    readonly projectId = signal("");
    readonly filterSearch = signal("");
    readonly filterAssignee = signal("");
    readonly filterType = signal("");

    // Quick create
    readonly quickCreateColumnId = signal<string | null>(null);
    readonly quickCreateTitle = signal("");

    // Ticket detail dialog
    readonly detailVisible = signal(false);
    readonly detailTicket = signal<Ticket | null>(null);
    readonly detailComment = signal("");

    // Create dialog
    readonly createVisible = signal(false);
    createForm: {
        title: string;
        description: string;
        type: TicketType;
        priority: TicketPriority;
        assigneeId: string | null;
        dueDate: Date | null;
        storyPoints: number | null;
    } = {
        title: "",
        description: "",
        type: "task",
        priority: "normal",
        assigneeId: null,
        dueDate: null,
        storyPoints: null
    };

    // Options
    readonly typeOptions: { label: string; value: TicketType }[] = [
        { label: "Epic", value: "epic" },
        { label: "Story", value: "story" },
        { label: "Bug", value: "bug" },
        { label: "Task", value: "task" },
        { label: "Sub-Task", value: "sub_task" },
        { label: "Feature", value: "feature" }
    ];

    readonly priorityOptions: { label: string; value: TicketPriority }[] = [
        { label: "Low", value: "low" },
        { label: "Normal", value: "normal" },
        { label: "High", value: "high" },
        { label: "Critical", value: "critical" }
    ];

    readonly statusOptions: { label: string; value: TicketStatus }[] = [
        { label: "Open", value: "open" },
        { label: "In Progress", value: "in_progress" },
        { label: "Waiting", value: "waiting" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" }
    ];

    readonly typeFilterOptions = [
        { label: "All", value: "" },
        { label: "Epic", value: "epic" },
        { label: "Story", value: "story" },
        { label: "Bug", value: "bug" },
        { label: "Task", value: "task" },
        { label: "Feature", value: "feature" }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) {
            this.boardFacade.loadBoard(id);
            this.ticketFacade.loadAssignableUsers();
        }
    }

    // ── Drag & Drop ─────────────────────────────────────────────────────────

    onDrop(event: CdkDragDrop<Ticket[]>, targetStatusId: string): void {
        if (!event.item.data) return;
        const ticket = event.item.data as Ticket;
        if (ticket.workflowStatusId === targetStatusId) return;
        this.boardFacade.moveCard({ ticketId: ticket.id, toStatusId: targetStatusId }, this.projectId());
    }

    // ── Filters ─────────────────────────────────────────────────────────────

    applyFilters(): void {
        const filters: Record<string, string> = {};
        if (this.filterSearch()) filters["search"] = this.filterSearch();
        if (this.filterAssignee()) filters["assigneeId"] = this.filterAssignee();
        if (this.filterType()) filters["type"] = this.filterType();
        this.boardFacade.loadBoard(this.projectId(), filters);
    }

    clearFilters(): void {
        this.filterSearch.set("");
        this.filterAssignee.set("");
        this.filterType.set("");
        this.boardFacade.loadBoard(this.projectId());
    }

    // ── Quick Create ────────────────────────────────────────────────────────

    startQuickCreate(columnStatusId: string): void {
        this.quickCreateColumnId.set(columnStatusId);
        this.quickCreateTitle.set("");
    }

    submitQuickCreate(): void {
        const title = this.quickCreateTitle().trim();
        if (!title) return;

        this.ticketFacade
            .createTicket({
                title,
                description: "",
                projectId: this.projectId()
            })
            .subscribe({
                next: () => {
                    this.quickCreateColumnId.set(null);
                    this.quickCreateTitle.set("");
                    this.boardFacade.loadBoard(this.projectId());
                }
            });
    }

    cancelQuickCreate(): void {
        this.quickCreateColumnId.set(null);
        this.quickCreateTitle.set("");
    }

    // ── Ticket Detail Dialog ────────────────────────────────────────────────

    openTicketDetail(ticket: Ticket): void {
        this.detailTicket.set(ticket);
        this.detailComment.set("");
        this.detailVisible.set(true);

        // Load related data
        this.ticketFacade.loadTicket(ticket.id);
        this.ticketFacade.loadComments(ticket.id);
        this.ticketFacade.loadChildren(ticket.id);
        this.ticketFacade.loadLinks(ticket.id);

        // Keep detailTicket in sync with facade
        const checkUpdate = setInterval(() => {
            const updated = this.ticketFacade.currentTicket();
            if (updated && updated.id === ticket.id) {
                this.detailTicket.set(updated);
                clearInterval(checkUpdate);
            }
        }, 200);
        setTimeout(() => clearInterval(checkUpdate), 5000);
    }

    updateDetailField(field: string, value: unknown): void {
        const ticket = this.detailTicket();
        if (!ticket) return;

        const payload: UpdateTicketPayload = { [field]: value };
        this.ticketFacade.updateTicket(ticket.id, payload).subscribe({
            next: (updated) => {
                this.detailTicket.set(updated);
                this.boardFacade.loadBoard(this.projectId());
                this.messageService.add({
                    severity: "success",
                    summary: this.t.translate("tickets.saved"),
                    life: 2000
                });
            }
        });
    }

    submitDetailComment(): void {
        const ticket = this.detailTicket();
        const text = this.detailComment().trim();
        if (!ticket || !text) return;

        this.ticketFacade.addComment(ticket.id, { content: text }).subscribe({
            next: () => {
                this.detailComment.set("");
                this.ticketFacade.loadComments(ticket.id);
            }
        });
    }

    openTicketFullPage(ticketId: string): void {
        this.detailVisible.set(false);
        this.router.navigate(["/tickets", ticketId]);
    }

    // ── Create Dialog ───────────────────────────────────────────────────────

    openCreateDialog(): void {
        this.createForm = {
            title: "",
            description: "",
            type: "task",
            priority: "normal",
            assigneeId: null,
            dueDate: null,
            storyPoints: null
        };
        this.createVisible.set(true);
    }

    submitCreate(): void {
        const title = this.createForm.title.trim();
        if (!title) return;

        const payload: CreateTicketPayload = {
            title,
            description: this.createForm.description,
            type: this.createForm.type,
            priority: this.createForm.priority,
            projectId: this.projectId(),
            assigneeId: this.createForm.assigneeId ?? undefined,
            dueDate: this.createForm.dueDate?.toISOString(),
            storyPoints: this.createForm.storyPoints ?? undefined
        };

        this.ticketFacade.createTicket(payload).subscribe({
            next: () => {
                this.createVisible.set(false);
                this.boardFacade.loadBoard(this.projectId());
                this.messageService.add({
                    severity: "success",
                    summary: this.t.translate("tickets.board.issueCreated"),
                    life: 3000
                });
            }
        });
    }

    // ── Navigation ──────────────────────────────────────────────────────────

    goToProjectSelect(): void {
        this.router.navigate(["/board-select"]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    getColumnIds(): string[] {
        return this.boardFacade.boardData()?.columns.map((c) => "col-" + c.status.id) ?? [];
    }

    columnBg(category: string): string {
        const map: Record<string, string> = {
            todo: "rgba(107, 114, 128, 0.06)",
            in_progress: "rgba(59, 130, 246, 0.06)",
            done: "rgba(16, 185, 129, 0.06)"
        };
        return map[category] ?? "rgba(107, 114, 128, 0.06)";
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

    typeColor(type: string): string {
        const map: Record<string, string> = {
            epic: "#8B5CF6",
            story: "#10B981",
            bug: "#EF4444",
            task: "#3B82F6",
            sub_task: "#6B7280",
            support: "#06B6D4",
            feature: "#F59E0B"
        };
        return map[type] ?? "#6B7280";
    }

    ticketKey(ticket: Ticket): string {
        const prefix = ticket.projectName ? ticket.projectName.substring(0, 3).toUpperCase() : "TKT";
        return `${prefix}-${ticket.ticketNumber}`;
    }

    initials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    currentUserInitials(): string {
        const user = this.authFacade.currentUser();
        return user?.displayName ? this.initials(user.displayName) : "?";
    }

    toDate(dateStr: string): Date {
        return new Date(dateStr);
    }
}
