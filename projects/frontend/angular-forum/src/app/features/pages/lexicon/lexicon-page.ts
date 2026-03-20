import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { LexiconArticle, LexiconArticleStatus } from "../../../core/models/lexicon/lexicon";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { LexiconFacade } from "../../../facade/lexicon/lexicon-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

@Component({
    selector: "app-lexicon-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminQuicklink,
        ButtonModule,
        ChipModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        PaginatorModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./lexicon-page.html"
})
export class LexiconPage implements OnInit {
    readonly facade = inject(LexiconFacade);
    protected readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);

    protected readonly selectedCategoryId = signal<string | null>(null);
    protected readonly selectedLanguage = signal<string | null>(null);
    protected readonly selectedTag = signal<string | null>(null);
    protected readonly searchQuery = signal("");
    protected readonly page = signal(0);
    protected readonly pageSize = 20;

    protected readonly hasFilters = computed(
        () => !!this.selectedCategoryId() || !!this.selectedTag() || !!this.searchQuery() || !!this.selectedLanguage()
    );

    protected get languageOptions(): { label: string; value: string | null }[] {
        return [
            { label: this.translocoService.translate("lexicon.languages.all"), value: null },
            { label: this.translocoService.translate("lexicon.languages.de"), value: "de" },
            { label: this.translocoService.translate("lexicon.languages.en"), value: "en" }
        ];
    }

    ngOnInit(): void {
        this.facade.loadCategories();
        this.loadArticles();
    }

    private loadArticles(): void {
        this.facade.loadArticles({
            categoryId: this.selectedCategoryId() ?? undefined,
            language: this.selectedLanguage() ?? undefined,
            tag: this.selectedTag() ?? undefined,
            search: this.searchQuery() || undefined,
            limit: this.pageSize,
            page: this.page()
        });
    }

    protected onCategorySelect(id: string | null): void {
        this.selectedCategoryId.set(id);
        this.page.set(0);
        this.loadArticles();
    }

    protected onLanguageChange(lang: string | null): void {
        this.selectedLanguage.set(lang);
        this.page.set(0);
        this.loadArticles();
    }

    protected onTagSelect(tag: string | null): void {
        this.selectedTag.set(tag);
        this.page.set(0);
        this.loadArticles();
    }

    protected onSearch(q: string): void {
        this.searchQuery.set(q);
        this.page.set(0);
        this.loadArticles();
    }

    protected onPageChange(event: PaginatorState): void {
        this.page.set(event.page ?? 0);
        this.loadArticles();
    }

    protected clearFilters(): void {
        this.selectedCategoryId.set(null);
        this.selectedLanguage.set(null);
        this.selectedTag.set(null);
        this.searchQuery.set("");
        this.page.set(0);
        this.loadArticles();
    }

    protected openArticle(article: LexiconArticle): void {
        void this.router.navigate(["/lexicon", article.slug]);
    }

    protected createArticle(): void {
        void this.router.navigate(["/lexicon/create"]);
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

    protected formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }
}
