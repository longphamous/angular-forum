import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { EditorModule } from "primeng/editor";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import {
    CreateCategoryPayload,
    LexiconArticle,
    LexiconArticleStatus,
    LexiconCategory,
    LexiconCustomField,
    LexiconReport
} from "../../../core/models/lexicon/lexicon";
import { LexiconFacade } from "../../../facade/lexicon/lexicon-facade";

@Component({
    selector: "app-admin-lexicon",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        EditorModule,
        FormsModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TranslocoModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./admin-lexicon.html"
})
export class AdminLexicon implements OnInit {
    readonly facade = inject(LexiconFacade);
    private readonly router = inject(Router);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);

    protected readonly activeTab = signal("categories");

    // Category management
    protected readonly categoryDialogVisible = signal(false);
    protected readonly editingCategory = signal<LexiconCategory | null>(null);
    protected readonly categoryForm = signal<CreateCategoryPayload>({
        name: "",
        description: "",
        parentId: undefined,
        position: 0,
        customFields: []
    });

    // Custom field editor
    protected readonly fieldDialogVisible = signal(false);
    protected readonly editingField = signal<LexiconCustomField | null>(null);
    protected readonly fieldForm = signal<LexiconCustomField>({
        key: "",
        label: "",
        type: "text",
        required: false,
        options: []
    });
    protected readonly fieldOptionsInput = signal("");

    // Terms of use
    protected readonly termsLanguage = signal("de");
    protected readonly termsContent = signal("");

    // Rejection
    protected readonly rejectDialogVisible = signal(false);
    protected readonly rejectArticleId = signal("");
    protected readonly rejectReason = signal("");

    protected get languageOptions(): { label: string; value: string }[] {
        return [
            { label: this.translocoService.translate("lexicon.languages.de"), value: "de" },
            { label: this.translocoService.translate("lexicon.languages.en"), value: "en" }
        ];
    }

    protected get fieldTypeOptions(): { label: string; value: string }[] {
        return [
            { label: this.translocoService.translate("lexicon.fieldTypes.text"), value: "text" },
            { label: this.translocoService.translate("lexicon.fieldTypes.number"), value: "number" },
            { label: this.translocoService.translate("lexicon.fieldTypes.date"), value: "date" },
            { label: this.translocoService.translate("lexicon.fieldTypes.select"), value: "select" },
            { label: this.translocoService.translate("lexicon.fieldTypes.boolean"), value: "boolean" },
            { label: this.translocoService.translate("lexicon.fieldTypes.url"), value: "url" }
        ];
    }

    ngOnInit(): void {
        this.facade.loadCategories();
        this.facade.loadPending();
        this.facade.loadReports();
        this.loadTerms();
    }

    // ── Categories ──────────────────────────────────────────────

    protected openCreateCategory(): void {
        this.editingCategory.set(null);
        this.categoryForm.set({ name: "", description: "", parentId: undefined, position: 0, customFields: [] });
        this.categoryDialogVisible.set(true);
    }

    protected openEditCategory(cat: LexiconCategory): void {
        this.editingCategory.set(cat);
        this.categoryForm.set({
            name: cat.name,
            description: cat.description ?? "",
            parentId: cat.parentId ?? undefined,
            position: cat.position,
            customFields: [...cat.customFields]
        });
        this.categoryDialogVisible.set(true);
    }

    protected saveCategory(): void {
        const form = this.categoryForm();
        if (!form.name.trim()) return;

        const payload: CreateCategoryPayload = {
            ...form,
            description: form.description?.trim() || undefined,
            parentId: form.parentId || undefined
        };

        const editing = this.editingCategory();
        const request$ = editing
            ? this.facade.updateCategory(editing.id, payload)
            : this.facade.createCategory(payload);

        request$.subscribe({
            next: () => {
                this.categoryDialogVisible.set(false);
                this.facade.loadCategories();
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate("lexicon.messages.categorySaved")
                });
            },
            error: () =>
                this.messageService.add({
                    severity: "error",
                    summary: this.translocoService.translate("common.error"),
                    detail: this.translocoService.translate("lexicon.messages.categorySaveError")
                })
        });
    }

    protected deleteCategory(cat: LexiconCategory): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("lexicon.confirmDeleteCategory"),
            accept: () => {
                this.facade.deleteCategory(cat.id).subscribe({
                    next: () => {
                        this.facade.loadCategories();
                        this.messageService.add({
                            severity: "success",
                            summary: "OK",
                            detail: this.translocoService.translate("lexicon.messages.categoryDeleted")
                        });
                    },
                    error: () =>
                        this.messageService.add({
                            severity: "error",
                            summary: this.translocoService.translate("common.error"),
                            detail: this.translocoService.translate("lexicon.messages.categoryDeleteError")
                        })
                });
            }
        });
    }

    // ── Custom Fields ───────────────────────────────────────────

    protected openAddField(): void {
        this.editingField.set(null);
        this.fieldForm.set({ key: "", label: "", type: "text", required: false, options: [] });
        this.fieldOptionsInput.set("");
        this.fieldDialogVisible.set(true);
    }

    protected openEditField(field: LexiconCustomField): void {
        this.editingField.set(field);
        this.fieldForm.set({ ...field, options: [...(field.options ?? [])] });
        this.fieldOptionsInput.set((field.options ?? []).join(", "));
        this.fieldDialogVisible.set(true);
    }

    protected saveField(): void {
        const form = this.fieldForm();
        if (!form.key.trim() || !form.label.trim()) return;

        const options =
            form.type === "select"
                ? this.fieldOptionsInput()
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean)
                : undefined;

        const field: LexiconCustomField = { ...form, key: form.key.trim(), label: form.label.trim(), options };

        const currentFields = [...(this.categoryForm().customFields ?? [])];
        const editing = this.editingField();
        if (editing) {
            const idx = currentFields.findIndex((f) => f.key === editing.key);
            if (idx >= 0) currentFields[idx] = field;
        } else {
            currentFields.push(field);
        }

        this.categoryForm.update((f) => ({ ...f, customFields: currentFields }));
        this.fieldDialogVisible.set(false);
    }

    protected removeField(key: string): void {
        this.categoryForm.update((f) => ({
            ...f,
            customFields: (f.customFields ?? []).filter((cf) => cf.key !== key)
        }));
    }

    // ── Moderation ──────────────────────────────────────────────

    protected approveArticle(article: LexiconArticle): void {
        this.facade.approveArticle(article.id).subscribe({
            next: () => {
                this.facade.loadPending();
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate("lexicon.messages.articleApproved")
                });
            }
        });
    }

    protected openRejectDialog(article: LexiconArticle): void {
        this.rejectArticleId.set(article.id);
        this.rejectReason.set("");
        this.rejectDialogVisible.set(true);
    }

    protected submitReject(): void {
        this.facade.rejectArticle(this.rejectArticleId(), this.rejectReason().trim() || undefined).subscribe({
            next: () => {
                this.rejectDialogVisible.set(false);
                this.facade.loadPending();
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate("lexicon.messages.articleRejected")
                });
            }
        });
    }

    protected viewArticle(article: LexiconArticle): void {
        void this.router.navigate(["/lexicon", article.slug]);
    }

    // ── Reports ─────────────────────────────────────────────────

    protected resolveReport(report: LexiconReport, status: "resolved" | "dismissed"): void {
        this.facade.resolveReport(report.id, status).subscribe({
            next: () => {
                this.facade.loadReports();
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate("lexicon.messages.reportResolved")
                });
            }
        });
    }

    protected viewReportedArticle(report: LexiconReport): void {
        if (report.articleSlug) void this.router.navigate(["/lexicon", report.articleSlug]);
    }

    // ── Terms of Use ────────────────────────────────────────────

    protected loadTerms(): void {
        this.facade.loadTerms(this.termsLanguage());
        const interval = setInterval(() => {
            const t = this.facade.terms();
            if (t) {
                this.termsContent.set(t.content);
                clearInterval(interval);
            }
        }, 200);
        setTimeout(() => clearInterval(interval), 3000);
    }

    protected onTermsLanguageChange(lang: string): void {
        this.termsLanguage.set(lang);
        this.termsContent.set("");
        this.loadTerms();
    }

    protected saveTerms(): void {
        this.facade.updateTerms(this.termsLanguage(), this.termsContent()).subscribe({
            next: () =>
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate("lexicon.messages.termsSaved")
                })
        });
    }

    protected statusSeverity(status: LexiconArticleStatus): "success" | "info" | "warn" | "danger" | "secondary" {
        switch (status) {
            case "published":
                return "success";
            case "pending":
                return "warn";
            case "draft":
                return "info";
            case "rejected":
                return "danger";
            case "archived":
                return "secondary";
        }
    }

    protected setActiveTab(tab: string): void {
        this.activeTab.set(tab);
    }

    protected setCategoryName(value: string): void {
        this.categoryForm.update((f) => ({ ...f, name: value }));
    }

    protected setCategoryDescription(value: string): void {
        this.categoryForm.update((f) => ({ ...f, description: value }));
    }

    protected setCategoryPosition(value: number): void {
        this.categoryForm.update((f) => ({ ...f, position: value }));
    }

    protected setFieldKey(value: string): void {
        this.fieldForm.update((f) => ({ ...f, key: value }));
    }

    protected setFieldLabel(value: string): void {
        this.fieldForm.update((f) => ({ ...f, label: value }));
    }

    protected setFieldType(value: LexiconCustomField["type"]): void {
        this.fieldForm.update((f) => ({ ...f, type: value }));
    }

    protected setFieldRequired(value: boolean): void {
        this.fieldForm.update((f) => ({ ...f, required: value }));
    }

    protected formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }
}
