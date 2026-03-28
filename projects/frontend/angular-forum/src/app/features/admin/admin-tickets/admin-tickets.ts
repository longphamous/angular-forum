import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ColorPickerModule } from "primeng/colorpicker";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import type { Workflow } from "../../../core/models/ticket/board";
import type { TicketCategory, TicketLabel, TicketProject } from "../../../core/models/ticket/ticket";
import { TicketFacade } from "../../../facade/ticket/ticket-facade";

@Component({
    selector: "admin-tickets",
    standalone: true,
    imports: [
        DecimalPipe,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        ColorPickerModule,
        ConfirmDialogModule,
        DatePickerModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./admin-tickets.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTickets implements OnInit {
    readonly facade = inject(TicketFacade);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly activeTab = signal("0");

    // Category dialog
    readonly catDialogVisible = signal(false);
    readonly catEditId = signal<string | null>(null);
    readonly catName = signal("");
    readonly catDescription = signal("");
    readonly catIcon = signal("");
    readonly catColor = signal("#3B82F6");

    // Label dialog
    readonly lblDialogVisible = signal(false);
    readonly lblEditId = signal<string | null>(null);
    readonly lblName = signal("");
    readonly lblColor = signal("#10B981");

    // Project dialog
    readonly projDialogVisible = signal(false);
    readonly projEditId = signal<string | null>(null);
    readonly projName = signal("");
    readonly projDescription = signal("");
    readonly projStartDate = signal<Date | null>(null);
    readonly projEndDate = signal<Date | null>(null);

    ngOnInit(): void {
        this.facade.loadCategories();
        this.facade.loadLabels();
        this.facade.loadProjects();
        this.facade.loadWorkflows();
        this.facade.loadStats();
    }

    // ── Categories ─────────────────────────────────────────────────────────────

    openCategoryDialog(cat?: TicketCategory): void {
        this.catEditId.set(cat?.id ?? null);
        this.catName.set(cat?.name ?? "");
        this.catDescription.set(cat?.description ?? "");
        this.catIcon.set(cat?.icon ?? "");
        this.catColor.set(cat?.color ?? "#3B82F6");
        this.catDialogVisible.set(true);
    }

    saveCategory(): void {
        const payload = {
            name: this.catName(),
            description: this.catDescription(),
            icon: this.catIcon(),
            color: this.catColor()
        };
        const id = this.catEditId();
        const op = id ? this.facade.updateCategory(id, payload) : this.facade.createCategory(payload);
        op.subscribe({
            next: () => {
                this.catDialogVisible.set(false);
                this.facade.loadCategories();
                this.messageService.add({ severity: "success", summary: this.t.translate("tickets.saved") });
            }
        });
    }

    deleteCategory(cat: TicketCategory): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.confirmDelete"),
            accept: () => {
                this.facade.deleteCategory(cat.id).subscribe({
                    next: () => this.facade.loadCategories()
                });
            }
        });
    }

    // ── Labels ─────────────────────────────────────────────────────────────────

    openLabelDialog(lbl?: TicketLabel): void {
        this.lblEditId.set(lbl?.id ?? null);
        this.lblName.set(lbl?.name ?? "");
        this.lblColor.set(lbl?.color ?? "#10B981");
        this.lblDialogVisible.set(true);
    }

    saveLabel(): void {
        const payload = { name: this.lblName(), color: this.lblColor() };
        const id = this.lblEditId();
        const op = id ? this.facade.updateLabel(id, payload) : this.facade.createLabel(payload);
        op.subscribe({
            next: () => {
                this.lblDialogVisible.set(false);
                this.facade.loadLabels();
                this.messageService.add({ severity: "success", summary: this.t.translate("tickets.saved") });
            }
        });
    }

    deleteLabel(lbl: TicketLabel): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.confirmDelete"),
            accept: () => {
                this.facade.deleteLabel(lbl.id).subscribe({
                    next: () => this.facade.loadLabels()
                });
            }
        });
    }

    // ── Projects ───────────────────────────────────────────────────────────────

    openProjectDialog(proj?: TicketProject): void {
        this.projEditId.set(proj?.id ?? null);
        this.projName.set(proj?.name ?? "");
        this.projDescription.set(proj?.description ?? "");
        this.projStartDate.set(proj?.startDate ? new Date(proj.startDate) : null);
        this.projEndDate.set(proj?.endDate ? new Date(proj.endDate) : null);
        this.projDialogVisible.set(true);
    }

    saveProject(): void {
        const payload = {
            name: this.projName(),
            description: this.projDescription(),
            startDate: this.projStartDate()?.toISOString().split("T")[0],
            endDate: this.projEndDate()?.toISOString().split("T")[0]
        };
        const id = this.projEditId();
        const op = id ? this.facade.updateProject(id, payload) : this.facade.createProject(payload);
        op.subscribe({
            next: () => {
                this.projDialogVisible.set(false);
                this.facade.loadProjects();
                this.messageService.add({ severity: "success", summary: this.t.translate("tickets.saved") });
            }
        });
    }

    deleteProject(proj: TicketProject): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.confirmDelete"),
            accept: () => {
                this.facade.deleteProject(proj.id).subscribe({
                    next: () => this.facade.loadProjects()
                });
            }
        });
    }

    projectStatusSeverity(status: string): "success" | "info" | "warn" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "secondary"> = {
            active: "success",
            completed: "info",
            archived: "secondary"
        };
        return map[status] ?? "info";
    }

    // ── Workflows ────────────────────────────────────────────────────────────

    seedDefaultWorkflow(): void {
        this.facade.seedDefaultWorkflow().subscribe({
            next: () => {
                this.facade.loadWorkflows();
                this.messageService.add({ severity: "success", summary: this.t.translate("tickets.saved") });
            }
        });
    }

    deleteWorkflow(wf: Workflow): void {
        this.confirmationService.confirm({
            message: this.t.translate("tickets.confirmDelete"),
            accept: () => {
                this.facade.deleteWorkflow(wf.id).subscribe({
                    next: () => this.facade.loadWorkflows()
                });
            }
        });
    }
}
