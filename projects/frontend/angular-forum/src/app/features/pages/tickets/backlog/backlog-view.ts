import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import type { Sprint } from "../../../../core/models/ticket/sprint";
import type { Ticket } from "../../../../core/models/ticket/ticket";
import { SprintFacade } from "../../../../facade/ticket/sprint-facade";

@Component({
    selector: "backlog-view",
    standalone: true,
    imports: [
        DatePipe,
        DragDropModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        ProgressBarModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./backlog-view.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BacklogView implements OnInit {
    readonly facade = inject(SprintFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly projectId = signal("");

    // Create sprint dialog
    readonly sprintDialogVisible = signal(false);
    readonly sprintName = signal("");
    readonly sprintGoal = signal("");

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) {
            this.facade.loadSprints(id);
            this.facade.loadBacklog(id);
        }
    }

    // ── Sprint CRUD ──────────────────────────────────────────────────────────

    openSprintDialog(): void {
        this.sprintName.set("");
        this.sprintGoal.set("");
        this.sprintDialogVisible.set(true);
    }

    createSprint(): void {
        if (!this.sprintName()) return;
        this.facade.createSprint({
            projectId: this.projectId(),
            name: this.sprintName(),
            goal: this.sprintGoal() || undefined
        }).subscribe({
            next: () => {
                this.sprintDialogVisible.set(false);
                this.facade.loadSprints(this.projectId());
            }
        });
    }

    startSprint(sprint: Sprint): void {
        this.facade.startSprint(sprint.id).subscribe({
            next: () => {
                this.messageService.add({ severity: "success", summary: this.t.translate("tickets.sprint.started") });
                this.facade.loadSprints(this.projectId());
            }
        });
    }

    completeSprint(sprint: Sprint): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.sprint.confirmComplete"),
            accept: () => {
                this.facade.completeSprint(sprint.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: "success", summary: this.t.translate("tickets.sprint.completed") });
                        this.facade.loadSprints(this.projectId());
                        this.facade.loadBacklog(this.projectId());
                    }
                });
            }
        });
    }

    deleteSprint(sprint: Sprint): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.confirmDelete"),
            accept: () => {
                this.facade.deleteSprint(sprint.id).subscribe({
                    next: () => {
                        this.facade.loadSprints(this.projectId());
                        this.facade.loadBacklog(this.projectId());
                    }
                });
            }
        });
    }

    // ── Drag & Drop ──────────────────────────────────────────────────────────

    onBacklogDrop(event: CdkDragDrop<Ticket[]>): void {
        const backlog = [...this.facade.backlog()];
        moveItemInArray(backlog, event.previousIndex, event.currentIndex);
        this.facade.reorderBacklog(this.projectId(), backlog.map((t) => t.id)).subscribe();
    }

    moveToSprint(ticket: Ticket, sprintId: string): void {
        this.facade.moveToSprint(ticket.id, sprintId).subscribe({
            next: () => {
                this.facade.loadSprints(this.projectId());
                this.facade.loadBacklog(this.projectId());
            }
        });
    }

    moveToBacklog(ticket: Ticket): void {
        this.facade.moveToBacklog(ticket.id).subscribe({
            next: () => {
                this.facade.loadSprints(this.projectId());
                this.facade.loadBacklog(this.projectId());
            }
        });
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    openTicket(id: string): void {
        this.router.navigate(["/tickets", id]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    sprintProgress(sprint: Sprint): number {
        if (sprint.ticketCount === 0) return 0;
        return Math.round((sprint.completedTicketCount / sprint.ticketCount) * 100);
    }

    sprintStatusSeverity(status: string): "success" | "info" | "warn" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "secondary"> = {
            planning: "secondary", active: "success", completed: "info"
        };
        return map[status] ?? "info";
    }

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            epic: "pi pi-bolt", story: "pi pi-bookmark", bug: "pi pi-bug",
            task: "pi pi-check-square", sub_task: "pi pi-minus", support: "pi pi-question-circle", feature: "pi pi-star"
        };
        return map[type] ?? "pi pi-ticket";
    }
}
