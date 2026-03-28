import { DatePipe } from "@angular/common";
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

    // Link dialog
    readonly linkDialogVisible = signal(false);
    readonly linkTargetId = signal("");
    readonly linkType = signal<TicketLinkType>("relates_to");

    // Active detail tab
    readonly activeTab = signal("0");

    private ticketId = "";

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

    // ── Links ────────────────────────────────────────────────────────────────

    openLinkDialog(): void {
        this.linkTargetId.set("");
        this.linkType.set("relates_to");
        this.linkDialogVisible.set(true);
    }

    submitLink(): void {
        if (!this.linkTargetId()) return;
        this.facade.createLink(this.ticketId, {
            targetTicketId: this.linkTargetId(),
            linkType: this.linkType()
        }).subscribe({
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
            epic: "warn", story: "success", bug: "danger", task: "info", sub_task: "secondary", support: "info", feature: "success"
        };
        return map[type] ?? "info";
    }

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            epic: "pi pi-bolt", story: "pi pi-bookmark", bug: "pi pi-bug",
            task: "pi pi-check-square", sub_task: "pi pi-minus", support: "pi pi-question-circle", feature: "pi pi-star"
        };
        return map[type] ?? "pi pi-ticket";
    }

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
            open: "info", in_progress: "warn", waiting: "secondary",
            follow_up: "contrast", resolved: "success", closed: "secondary"
        };
        return map[status] ?? "info";
    }

    prioritySeverity(p: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            low: "secondary", normal: "info", high: "warn", critical: "danger"
        };
        return map[p] ?? "info";
    }

    get isStaff(): boolean {
        const role = this.authFacade.currentUser()?.role;
        return role === "admin" || role === "moderator";
    }
}
