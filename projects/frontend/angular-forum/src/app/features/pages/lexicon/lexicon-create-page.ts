import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ChipModule } from "primeng/chip";
import { EditorModule } from "primeng/editor";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import {
    CreateArticlePayload,
    LexiconArticleStatus,
    LexiconCategory,
    LexiconCustomField
} from "../../../core/models/lexicon/lexicon";
import { LexiconFacade } from "../../../facade/lexicon/lexicon-facade";

@Component({
    selector: "app-lexicon-create-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CheckboxModule,
        ChipModule,
        EditorModule,
        FormsModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: "./lexicon-create-page.html"
})
export class LexiconCreatePage implements OnInit {
    private readonly facade = inject(LexiconFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);

    protected readonly loading = signal(false);
    protected readonly saving = signal(false);
    protected readonly isEditMode = signal(false);
    protected readonly editArticleId = signal<string | null>(null);
    protected readonly tagInput = signal("");
    protected readonly invalidFields = signal<Set<string>>(new Set());

    protected readonly categories = signal<LexiconCategory[]>([]);

    protected readonly form = signal<CreateArticlePayload>({
        title: "",
        content: "",
        categoryId: "",
        language: "de",
        excerpt: "",
        tags: [],
        customFieldValues: {},
        linkedArticleId: "",
        coverImageUrl: "",
        allowComments: true,
        status: "draft",
        changeSummary: ""
    });

    protected get languageOptions(): { label: string; value: string }[] {
        return [
            { label: this.translocoService.translate("lexicon.languages.de"), value: "de" },
            { label: this.translocoService.translate("lexicon.languages.en"), value: "en" }
        ];
    }

    protected get statusOptions(): { label: string; value: LexiconArticleStatus }[] {
        return [
            { label: this.translocoService.translate("lexicon.draft"), value: "draft" },
            { label: this.translocoService.translate("lexicon.pending"), value: "pending" },
            { label: this.translocoService.translate("lexicon.published"), value: "published" }
        ];
    }

    protected readonly selectedCategoryFields = computed<LexiconCustomField[]>(() => {
        const catId = this.form().categoryId;
        if (!catId) return [];
        const cat = this.categories().find((c) => c.id === catId);
        return cat?.customFields ?? [];
    });

    ngOnInit(): void {
        this.facade.loadCategories();
        this.facade.categories;

        // Load categories for the form
        this.loadCategories();

        const slug = this.route.snapshot.paramMap.get("slug");
        if (slug) {
            this.isEditMode.set(true);
            this.loadArticle(slug);
        }
    }

    private loadCategories(): void {
        // Reuse facade categories
        setTimeout(() => this.categories.set(this.facade.categories()), 500);
        this.facade.loadCategories();
        // Also subscribe to changes
        const interval = setInterval(() => {
            const cats = this.facade.categories();
            if (cats.length > 0) {
                this.categories.set(cats);
                clearInterval(interval);
            }
        }, 200);
        setTimeout(() => clearInterval(interval), 5000);
    }

    private loadArticle(slug: string): void {
        this.loading.set(true);
        this.facade.loadArticle(slug);
        const interval = setInterval(() => {
            const article = this.facade.currentArticle();
            if (article) {
                clearInterval(interval);
                this.editArticleId.set(article.id);
                this.form.set({
                    title: article.title,
                    content: article.content,
                    categoryId: article.categoryId,
                    language: article.language,
                    excerpt: article.excerpt ?? "",
                    tags: [...article.tags],
                    customFieldValues: { ...article.customFieldValues },
                    linkedArticleId: article.linkedArticleId ?? "",
                    coverImageUrl: article.coverImageUrl ?? "",
                    allowComments: article.allowComments,
                    status: article.status,
                    changeSummary: ""
                });
                this.loading.set(false);
            }
        }, 200);
        setTimeout(() => {
            clearInterval(interval);
            this.loading.set(false);
        }, 5000);
    }

    protected addTag(): void {
        const tag = this.tagInput().trim().toLowerCase().replace(/\s+/g, "-");
        if (!tag) return;
        const current = this.form();
        if (!(current.tags ?? []).includes(tag)) {
            this.form.update((f) => ({ ...f, tags: [...(f.tags ?? []), tag] }));
        }
        this.tagInput.set("");
    }

    protected removeTag(tag: string): void {
        this.form.update((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
    }

    protected setField(field: keyof CreateArticlePayload, value: unknown): void {
        this.form.update((f) => ({ ...f, [field]: value }));
    }

    protected setCustomFieldValue(key: string, value: unknown): void {
        this.form.update((f) => ({
            ...f,
            customFieldValues: { ...(f.customFieldValues ?? {}), [key]: value }
        }));
        this.invalidFields.update((set) => {
            const next = new Set(set);
            next.delete(key);
            return next;
        });
    }

    protected saveDraft(): void {
        this.form.update((f) => ({ ...f, status: "draft" }));
        this.save();
    }

    protected publish(): void {
        this.form.update((f) => ({ ...f, status: "published" }));
        this.save();
    }

    protected submitForReview(): void {
        this.form.update((f) => ({ ...f, status: "pending" }));
        this.save();
    }

    private save(): void {
        const f = this.form();
        if (!f.title.trim() || !f.content.trim() || !f.categoryId) {
            this.messageService.add({
                severity: "warn",
                summary: this.translocoService.translate("lexicon.requiredFields"),
                detail: this.translocoService.translate("lexicon.requiredFieldsDetail")
            });
            return;
        }

        const missingFields = this.getMissingRequiredCustomFields();
        if (missingFields.length > 0) {
            this.invalidFields.set(new Set(missingFields.map((f) => f.key)));
            this.messageService.add({
                severity: "warn",
                summary: this.translocoService.translate("lexicon.requiredFields"),
                detail: this.translocoService.translate("lexicon.requiredCustomFieldsDetail", {
                    fields: missingFields.map((f) => f.label).join(", ")
                })
            });
            return;
        }

        this.saving.set(true);
        const payload: CreateArticlePayload = {
            ...f,
            excerpt: f.excerpt?.trim() || undefined,
            coverImageUrl: f.coverImageUrl?.trim() || undefined,
            linkedArticleId: f.linkedArticleId?.trim() || undefined,
            changeSummary: f.changeSummary?.trim() || undefined
        };

        const request$ = this.isEditMode()
            ? this.facade.updateArticle(this.editArticleId()!, payload)
            : this.facade.createArticle(payload);

        request$.subscribe({
            next: (article) => {
                this.saving.set(false);
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate(
                        this.isEditMode() ? "lexicon.messages.articleUpdated" : "lexicon.messages.articleCreated"
                    )
                });
                void this.router.navigate(["/lexicon", article.slug]);
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({
                    severity: "error",
                    summary: this.translocoService.translate("common.error"),
                    detail: this.translocoService.translate("lexicon.messages.articleSaveError")
                });
            }
        });
    }

    private getMissingRequiredCustomFields(): LexiconCustomField[] {
        const fields = this.selectedCategoryFields();
        const values = this.form().customFieldValues ?? {};
        return fields.filter((field) => {
            if (!field.required) return false;
            const value = values[field.key];
            if (value === undefined || value === null || value === "") return true;
            if (typeof value === "string" && !value.trim()) return true;
            return false;
        });
    }

    protected goBack(): void {
        void this.router.navigate(["/lexicon"]);
    }
}
