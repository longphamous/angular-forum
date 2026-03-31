import { DatePipe, DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import type {
    Ticket,
    TicketLinkType,
    TicketPriority,
    TicketStatus,
    TicketType,
    UpdateTicketPayload
} from "../../../core/models/ticket/ticket";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { TicketFacade } from "../../../facade/ticket/ticket-facade";

@Component({
    selector: "ticket-detail-page",
    standalone: true,
    imports: [
        DatePipe,
        DecimalPipe,
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        InputNumberModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./ticket-detail-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailPage implements OnInit {
    readonly facade = inject(TicketFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly cd = inject(ChangeDetectorRef);

    readonly commentText = signal("");
    readonly commentInternal = signal(false);
    readonly commentSaving = signal(false);

    // Rating dialog
    readonly ratingDialogVisible = signal(false);
    readonly ratingValue = signal(5);
    readonly ratingComment = signal("");

    // Title inline edit
    readonly editingTitle = signal(false);
    readonly editTitleValue = signal("");

    // Edit dialog
    readonly editDialogVisible = signal(false);
    editForm: {
        title: string;
        description: string;
        type: TicketType;
        priority: TicketPriority;
        status: TicketStatus;
        assigneeId: string | null;
        storyPoints: number | null;
        dueDate: Date | null;
        followUpDate: Date | null;
        originalEstimateMinutes: number | null;
    } = {
        title: "",
        description: "",
        type: "task",
        priority: "normal",
        status: "open",
        assigneeId: null,
        storyPoints: null,
        dueDate: null,
        followUpDate: null,
        originalEstimateMinutes: null
    };

    readonly typeOptions: { label: string; value: TicketType }[] = [
        { label: "Epic", value: "epic" },
        { label: "Story", value: "story" },
        { label: "Bug", value: "bug" },
        { label: "Task", value: "task" },
        { label: "Sub-Task", value: "sub_task" },
        { label: "Support", value: "support" },
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
        { label: "Follow Up", value: "follow_up" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" }
    ];

    // Link dialog
    readonly linkDialogVisible = signal(false);
    readonly linkTargetId = signal("");
    readonly linkType = signal<TicketLinkType>("relates_to");
    readonly linkSearchResults = signal<{ label: string; value: string }[]>([]);

    // Work log dialog
    readonly workLogDialogVisible = signal(false);
    readonly workLogMinutes = signal(60);
    readonly workLogDescription = signal("");

    // Active detail tab
    readonly activeTab = signal("0");

    ticketId = "";

    readonly linkTypeOptions = [
        { label: "tickets.links.blocks", value: "blocks" as TicketLinkType },
        { label: "tickets.links.blockedBy", value: "is_blocked_by" as TicketLinkType },
        { label: "tickets.links.relatesTo", value: "relates_to" as TicketLinkType },
        { label: "tickets.links.duplicates", value: "duplicates" as TicketLinkType }
    ];

    ngOnInit(): void {
        this.ticketId = this.route.snapshot.paramMap.get("id") ?? "";
        if (this.ticketId) {
            this.facade.loadTicket(this.ticketId);
            this.facade.loadComments(this.ticketId);
            this.facade.loadChildren(this.ticketId);
            this.facade.loadLinks(this.ticketId);
            this.facade.loadActivity(this.ticketId);
            this.facade.loadWatchers(this.ticketId);
            this.facade.loadAttachments(this.ticketId);
            this.facade.loadWorkLogs(this.ticketId);
            this.facade.loadAssignableUsers();
        }
    }

    submitComment(): void {
        if (!this.commentText()) return;
        this.commentSaving.set(true);
        this.facade
            .addComment(this.ticketId, {
                content: this.commentText(),
                isInternal: this.commentInternal()
            })
            .subscribe({
                next: () => {
                    this.commentText.set("");
                    this.commentInternal.set(false);
                    this.commentSaving.set(false);
                    this.facade.loadTicket(this.ticketId);
                    this.facade.loadActivity(this.ticketId);
                },
                error: () => this.commentSaving.set(false)
            });
    }

    updateStatus(status: TicketStatus): void {
        this.facade.updateTicket(this.ticketId, { status }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: "success",
                    summary: this.t.translate("tickets.saved"),
                    detail: this.t.translate("tickets.statusUpdated")
                });
                this.facade.loadActivity(this.ticketId);
            }
        });
    }

    updatePriority(priority: TicketPriority): void {
        this.facade.updateTicket(this.ticketId, { priority }).subscribe({
            next: () => this.facade.loadActivity(this.ticketId)
        });
    }

    togglePin(): void {
        const ticket = this.facade.currentTicket();
        if (!ticket) return;
        this.facade.updateTicket(this.ticketId, { isPinned: !ticket.isPinned }).subscribe();
    }

    submitRating(): void {
        this.facade
            .updateTicket(this.ticketId, { rating: this.ratingValue(), ratingComment: this.ratingComment() })
            .subscribe({
                next: () => {
                    this.ratingDialogVisible.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: this.t.translate("tickets.saved"),
                        detail: this.t.translate("tickets.ratingSubmitted")
                    });
                }
            });
    }

    // ── Title Inline Edit ────────────────────────────────────────────────────

    startEditTitle(currentTitle: string): void {
        this.editTitleValue.set(currentTitle);
        this.editingTitle.set(true);
    }

    saveTitle(): void {
        const newTitle = this.editTitleValue().trim();
        if (!newTitle || newTitle === this.facade.currentTicket()?.title) {
            this.editingTitle.set(false);
            return;
        }
        this.facade.updateTicket(this.ticketId, { title: newTitle }).subscribe({
            next: () => {
                this.editingTitle.set(false);
                this.facade.loadActivity(this.ticketId);
            }
        });
    }

    // ── Edit Dialog ──────────────────────────────────────────────────────────

    openEditDialog(): void {
        const ticket = this.facade.currentTicket();
        if (!ticket) return;
        this.editForm = {
            title: ticket.title,
            description: ticket.description,
            type: ticket.type,
            priority: ticket.priority,
            status: ticket.status,
            assigneeId: ticket.assigneeId ?? null,
            storyPoints: ticket.storyPoints ?? null,
            dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null,
            followUpDate: ticket.followUpDate ? new Date(ticket.followUpDate) : null,
            originalEstimateMinutes: ticket.originalEstimateMinutes ?? null
        };
        this.editDialogVisible.set(true);
    }

    saveEditDialog(): void {
        const ticket = this.facade.currentTicket();
        if (!ticket) return;

        const payload: UpdateTicketPayload = {};
        if (this.editForm.title !== ticket.title) payload.title = this.editForm.title;
        if (this.editForm.description !== ticket.description) payload.description = this.editForm.description;
        if (this.editForm.type !== ticket.type) payload.type = this.editForm.type;
        if (this.editForm.priority !== ticket.priority) payload.priority = this.editForm.priority;
        if (this.editForm.status !== ticket.status) payload.status = this.editForm.status;
        if (this.editForm.assigneeId !== (ticket.assigneeId ?? null)) payload.assigneeId = this.editForm.assigneeId;
        if (this.editForm.storyPoints !== (ticket.storyPoints ?? null)) payload.storyPoints = this.editForm.storyPoints;
        payload.dueDate = this.editForm.dueDate?.toISOString() ?? null;
        payload.followUpDate = this.editForm.followUpDate?.toISOString() ?? null;
        payload.originalEstimateMinutes = this.editForm.originalEstimateMinutes;

        if (Object.keys(payload).length === 0) {
            this.editDialogVisible.set(false);
            return;
        }

        this.facade.updateTicket(this.ticketId, payload).subscribe({
            next: () => {
                this.editDialogVisible.set(false);
                this.facade.loadActivity(this.ticketId);
                this.messageService.add({
                    severity: "success",
                    summary: this.t.translate("tickets.saved"),
                    detail: this.t.translate("tickets.ticketUpdated")
                });
                this.cd.markForCheck();
            }
        });
    }

    // ── Links ────────────────────────────────────────────────────────────────

    openLinkDialog(): void {
        this.linkTargetId.set("");
        this.linkType.set("relates_to");
        this.linkSearchResults.set([]);
        this.facade.loadTickets({ limit: 20 });
        setTimeout(() => {
            const tickets = this.facade.tickets();
            this.linkSearchResults.set(
                tickets
                    .filter((t) => t.id !== this.ticketId)
                    .map((t) => ({ label: `#${t.ticketNumber} ${t.title}`, value: t.id }))
            );
        }, 500);
        this.linkDialogVisible.set(true);
    }

    onLinkSearch(event: { filter: string }): void {
        const query = event.filter?.trim();
        if (!query || query.length < 1) return;

        // Support searching by ticket number (e.g. "#5" or "5")
        const numberMatch = query.match(/^#?(\d+)$/);
        const searchParams: { search?: string; limit?: number } = { limit: 15 };
        if (numberMatch) {
            searchParams.search = numberMatch[1];
        } else {
            searchParams.search = query;
        }

        this.facade.loadTickets(searchParams);
        setTimeout(() => {
            const tickets = this.facade.tickets();
            this.linkSearchResults.set(
                tickets
                    .filter((t) => t.id !== this.ticketId)
                    .map((t) => ({ label: `#${t.ticketNumber} ${t.title}`, value: t.id }))
            );
            this.cd.markForCheck();
        }, 500);
    }

    submitLink(): void {
        if (!this.linkTargetId()) return;
        this.facade
            .createLink(this.ticketId, {
                targetTicketId: this.linkTargetId(),
                linkType: this.linkType()
            })
            .subscribe({
                next: () => {
                    this.linkDialogVisible.set(false);
                    this.facade.loadActivity(this.ticketId);
                }
            });
    }

    removeLink(linkId: string): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.confirmDelete"),
            accept: () => {
                this.facade.deleteLink(this.ticketId, linkId).subscribe({
                    next: () => this.facade.loadActivity(this.ticketId)
                });
            }
        });
    }

    // ── Assignee ─────────────────────────────────────────────────────────────

    updateAssignee(assigneeId: string | null): void {
        this.facade.updateTicket(this.ticketId, { assigneeId }).subscribe({
            next: () => this.facade.loadActivity(this.ticketId)
        });
    }

    // ── Watchers ─────────────────────────────────────────────────────────────

    toggleWatch(): void {
        const isWatching = this.facade.watchers().some((w) => w.userId === this.authFacade.currentUser()?.id);
        if (isWatching) {
            this.facade.unwatch(this.ticketId).subscribe();
        } else {
            this.facade.watch(this.ticketId).subscribe();
        }
    }

    get isWatching(): boolean {
        return this.facade.watchers().some((w) => w.userId === this.authFacade.currentUser()?.id);
    }

    // ── Work Logs ────────────────────────────────────────────────────────────

    openWorkLogDialog(): void {
        this.workLogMinutes.set(60);
        this.workLogDescription.set("");
        this.workLogDialogVisible.set(true);
    }

    submitWorkLog(): void {
        this.facade
            .addWorkLog(this.ticketId, {
                timeSpentMinutes: this.workLogMinutes(),
                description: this.workLogDescription() || undefined
            })
            .subscribe({
                next: () => {
                    this.workLogDialogVisible.set(false);
                    this.facade.loadTicket(this.ticketId);
                }
            });
    }

    formatMinutes(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    openChildTicket(id: string): void {
        this.router.navigate(["/tickets", id]);
    }

    goBack(): void {
        this.facade.clearCurrentTicket();
        this.router.navigate(["/tickets"]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

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

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
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

    prioritySeverity(p: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            low: "secondary",
            normal: "info",
            high: "warn",
            critical: "danger"
        };
        return map[p] ?? "info";
    }

    get isStaff(): boolean {
        const role = this.authFacade.currentUser()?.role;
        return role === "admin" || role === "moderator";
    }
}
