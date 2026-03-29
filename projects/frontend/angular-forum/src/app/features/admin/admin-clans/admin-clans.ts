import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import type { ClanCategory } from "../../../core/models/clan/clan";
import { ClanFacade } from "../../../facade/clan/clan-facade";

@Component({
    selector: "admin-clans",
    standalone: true,
    imports: [
        FormsModule,
        TranslocoModule,
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        SkeletonModule,
        TableModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./admin-clans.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminClans implements OnInit {
    readonly facade = inject(ClanFacade);
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

    ngOnInit(): void {
        this.facade.loadCategories();
        this.facade.loadClans({ limit: 50 });
    }

    // ── Categories ──────────────────────────────────────────────────────────

    openCategoryDialog(cat?: ClanCategory): void {
        this.catEditId.set(cat?.id ?? null);
        this.catName.set(cat?.name ?? "");
        this.catDescription.set(cat?.description ?? "");
        this.catIcon.set(cat?.icon ?? "");
        this.catDialogVisible.set(true);
    }

    saveCategory(): void {
        const payload = {
            name: this.catName(),
            description: this.catDescription(),
            icon: this.catIcon()
        };
        const id = this.catEditId();
        const op = id ? this.facade.updateCategory(id, payload) : this.facade.createCategory(payload);
        op.subscribe({
            next: () => {
                this.catDialogVisible.set(false);
                this.facade.loadCategories();
                this.messageService.add({ severity: "success", summary: this.t.translate("clans.saved") });
            }
        });
    }

    deleteCategory(cat: ClanCategory): void {
        this.confirmationService.confirm({
            message: this.t.translate("common.irreversible"),
            accept: () => {
                this.facade.deleteCategory(cat.id).subscribe({
                    next: () => this.facade.loadCategories()
                });
            }
        });
    }

    // ── Clan Moderation ─────────────────────────────────────────────────────

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            active: "success",
            inactive: "warn",
            disbanded: "danger"
        };
        return map[status] ?? "info";
    }

    joinTypeSeverity(type: string): "success" | "info" | "warn" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "secondary"> = {
            open: "success",
            invite: "info",
            application: "warn",
            moderated: "secondary"
        };
        return map[type] ?? "info";
    }
}
