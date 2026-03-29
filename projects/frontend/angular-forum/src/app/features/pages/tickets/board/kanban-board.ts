import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";

import type { Ticket } from "../../../../core/models/ticket/ticket";
import { BoardFacade } from "../../../../facade/ticket/board-facade";
import { TicketFacade } from "../../../../facade/ticket/ticket-facade";
import { BoardCard } from "./board-card";

@Component({
    selector: "kanban-board",
    standalone: true,
    imports: [
        DragDropModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TooltipModule,
        BoardCard
    ],
    templateUrl: "./kanban-board.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanBoard implements OnInit {
    readonly boardFacade = inject(BoardFacade);
    readonly ticketFacade = inject(TicketFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);

    readonly projectId = signal("");
    readonly filterSearch = signal("");
    readonly filterAssignee = signal("");
    readonly filterPriority = signal("");
    readonly filterType = signal("");

    // Quick create
    readonly quickCreateColumnId = signal<string | null>(null);
    readonly quickCreateTitle = signal("");

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) {
            this.boardFacade.loadBoard(id);
            this.ticketFacade.loadAssignableUsers();
        }
    }

    onDrop(event: CdkDragDrop<Ticket[]>, targetStatusId: string): void {
        if (!event.item.data) return;
        const ticket = event.item.data as Ticket;
        if (ticket.workflowStatusId === targetStatusId) return;

        this.boardFacade.moveCard({ ticketId: ticket.id, toStatusId: targetStatusId }, this.projectId());
    }

    applyFilters(): void {
        const filters: Record<string, string> = {};
        if (this.filterSearch()) filters["search"] = this.filterSearch();
        if (this.filterAssignee()) filters["assigneeId"] = this.filterAssignee();
        if (this.filterPriority()) filters["priority"] = this.filterPriority();
        if (this.filterType()) filters["type"] = this.filterType();
        this.boardFacade.loadBoard(this.projectId(), filters);
    }

    clearFilters(): void {
        this.filterSearch.set("");
        this.filterAssignee.set("");
        this.filterPriority.set("");
        this.filterType.set("");
        this.boardFacade.loadBoard(this.projectId());
    }

    // Quick Create
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

    openTicket(id: string): void {
        this.router.navigate(["/tickets", id]);
    }

    getColumnIds(): string[] {
        return this.boardFacade.boardData()?.columns.map((c) => "col-" + c.status.id) ?? [];
    }
}
