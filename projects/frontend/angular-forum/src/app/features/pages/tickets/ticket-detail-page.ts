import { DatePipe, DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import type { TicketLinkType, TicketPriority, TicketStatus } from "../../../core/models/ticket/ticket";
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
        DialogModule,
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

    // ── Links ────────────────────────────────────────────────────────────────

    openLinkDialog(): void {
        this.linkTargetId.set("");
        this.linkType.set("relates_to");
        this.linkSearchResults.set([]);
        // Pre-load recent tickets for the dropdown
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
        if (!query || query.length < 2) return;
        this.facade.loadTickets({ search: query, limit: 10 });
        setTimeout(() => {
            const tickets = this.facade.tickets();
            this.linkSearchResults.set(
                tickets
                    .filter((t) => t.id !== this.ticketId)
                    .map((t) => ({ label: `#${t.ticketNumber} ${t.title}`, value: t.id }))
            );
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
