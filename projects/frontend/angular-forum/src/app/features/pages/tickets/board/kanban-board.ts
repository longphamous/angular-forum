import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";

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

    readonly projectId = signal("");
    readonly filterSearch = signal("");

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) {
            this.boardFacade.loadBoard(id);
        }
    }

    onDrop(event: CdkDragDrop<Ticket[]>, targetStatusId: string): void {
        if (!event.item.data) return;
        const ticket = event.item.data as Ticket;

        // Don't move if same column
        if (ticket.workflowStatusId === targetStatusId) return;

        this.boardFacade.moveCard(
            { ticketId: ticket.id, toStatusId: targetStatusId },
            this.projectId()
        );
    }

    onSearch(): void {
        const filters: Record<string, string> = {};
        if (this.filterSearch()) filters["search"] = this.filterSearch();
        this.boardFacade.loadBoard(this.projectId(), filters);
    }

    openTicket(id: string): void {
        this.router.navigate(["/tickets", id]);
    }

    getColumnIds(): string[] {
        return this.boardFacade.boardData()?.columns.map((c) => "col-" + c.status.id) ?? [];
    }
}
