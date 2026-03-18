import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

import { CreateCategoryPayload, LinkCategory, LinkEntry } from "../../../core/models/link-database/link-database";
import { TabPersistenceService } from "../../../core/services/tab-persistence.service";
import { LinkDatabaseFacade } from "../../../facade/link-database/link-database-facade";

@Component({
    selector: "admin-link-database",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MessageService],
    imports: [
        ButtonModule,
        DialogModule,
        FormsModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./admin-link-database.html"
})
export class AdminLinkDatabase implements OnInit {
    readonly facade = inject(LinkDatabaseFacade);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly messageService = inject(MessageService);
    private readonly tabService = inject(TabPersistenceService);

    readonly activeTab = signal(this.tabService.get("0"));

    readonly categoryDialogVisible = signal(false);
    readonly rejectDialogVisible = signal(false);
    readonly saving = signal(false);

    editingCategory: LinkCategory | null = null;
    pendingRejectId: string | null = null;
    rejectReason = "";

    // Category form fields
    formName = "";
    formDescription = "";
    formIconClass = "";
    formColor = "";
    formSortOrder = 0;
    formRequiresApproval = false;
    formDefaultSortBy: "createdAt" | "viewCount" | "title" | "rating" = "createdAt";

    readonly sortOptions = [
        { label: "Datum", value: "createdAt" },
        { label: "Beliebtheit", value: "viewCount" },
        { label: "Bewertung", value: "rating" },
        { label: "Alphabetisch", value: "title" }
    ];

    onTabChange(tab: string): void {
        this.activeTab.set(tab);
        this.tabService.set(tab);
    }

    ngOnInit(): void {
        this.facade.loadCategories();
        this.facade.loadPending();
    }

    openCreateCategory(): void {
        this.editingCategory = null;
        this.formName = "";
        this.formDescription = "";
        this.formIconClass = "pi pi-link";
        this.formColor = "#3b82f6";
        this.formSortOrder = 0;
        this.formRequiresApproval = false;
        this.formDefaultSortBy = "createdAt";
        this.categoryDialogVisible.set(true);
    }

    openEditCategory(cat: LinkCategory): void {
        this.editingCategory = cat;
        this.formName = cat.name;
        this.formDescription = cat.description ?? "";
        this.formIconClass = cat.iconClass ?? "";
        this.formColor = cat.color ?? "";
        this.formSortOrder = cat.sortOrder;
        this.formRequiresApproval = cat.requiresApproval;
        this.formDefaultSortBy = cat.defaultSortBy;
        this.categoryDialogVisible.set(true);
    }

    saveCategory(): void {
        if (!this.formName.trim()) return;
        this.saving.set(true);
        const payload: CreateCategoryPayload = {
            name: this.formName.trim(),
            description: this.formDescription.trim() || undefined,
            iconClass: this.formIconClass.trim() || undefined,
            color: this.formColor.trim() || undefined,
            sortOrder: this.formSortOrder,
            requiresApproval: this.formRequiresApproval,
            defaultSortBy: this.formDefaultSortBy
        };
        const obs = this.editingCategory
            ? this.facade.updateCategory(this.editingCategory.id, payload)
            : this.facade.createCategory(payload);
        obs.subscribe({
            next: () => {
                this.saving.set(false);
                this.categoryDialogVisible.set(false);
                this.facade.loadCategories();
                this.messageService.add({
                    severity: "success",
                    summary: "Gespeichert",
                    detail: "Kategorie gespeichert."
                });
                this.cd.markForCheck();
            },
            error: () => {
                this.saving.set(false);
                this.cd.markForCheck();
            }
        });
    }

    deleteCategory(cat: LinkCategory): void {
        if (!confirm(`Kategorie "${cat.name}" wirklich löschen?`)) return;
        this.facade.deleteCategory(cat.id).subscribe({
            next: () => {
                this.facade.loadCategories();
                this.cd.markForCheck();
            }
        });
    }

    approveLink(link: LinkEntry): void {
        this.facade.approveLink(link.id).subscribe({
            next: () => {
                this.facade.pendingLinks.update((list) => list.filter((l) => l.id !== link.id));
                this.messageService.add({
                    severity: "success",
                    summary: "Freigegeben",
                    detail: `"${link.title}" wurde freigegeben.`
                });
                this.facade.loadPending();
                this.cd.markForCheck();
            }
        });
    }

    openReject(link: LinkEntry): void {
        this.pendingRejectId = link.id;
        this.rejectReason = "";
        this.rejectDialogVisible.set(true);
    }

    confirmReject(): void {
        if (!this.pendingRejectId) return;
        const id = this.pendingRejectId;
        this.facade.rejectLink(id, this.rejectReason || undefined).subscribe({
            next: () => {
                this.facade.pendingLinks.update((list) => list.filter((l) => l.id !== id));
                this.rejectDialogVisible.set(false);
                this.messageService.add({
                    severity: "info",
                    summary: "Abgelehnt",
                    detail: "Link wurde abgelehnt."
                });
                this.facade.loadPending();
                this.cd.markForCheck();
            }
        });
    }

    formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    statusSeverity(status: string): "success" | "warn" | "danger" | "secondary" {
        return status === "active" ? "success" : status === "pending" ? "warn" : "danger";
    }
}
