import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { RatingModule } from "primeng/rating";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { LinkEntry, LinkSortBy } from "../../../core/models/link-database/link-database";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { LinkDatabaseFacade } from "../../../facade/link-database/link-database-facade";

@Component({
    selector: "app-link-database-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        ChipModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        PaginatorModule,
        RatingModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./link-database-page.html"
})
export class LinkDatabasePage implements OnInit {
    readonly facade = inject(LinkDatabaseFacade);
    protected readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);

    protected readonly selectedCategoryId = signal<string | null>(null);
    protected readonly selectedTag = signal<string | null>(null);
    protected readonly searchQuery = signal("");
    protected readonly viewMode = signal<"grid" | "list">("grid");
    protected readonly sortBy = signal<LinkSortBy>("createdAt");
    protected readonly page = signal(0);
    protected readonly pageSize = 20;

    protected readonly hasFilters = computed(
        () => !!this.selectedCategoryId() || !!this.selectedTag() || !!this.searchQuery()
    );

    protected readonly searchLabel = computed(() => `"${this.searchQuery()}"`);

    protected readonly selectedCategoryName = computed(
        () =>
            this.facade.categories().find((c) => c.id === this.selectedCategoryId())?.name ??
            this.selectedCategoryId() ??
            ""
    );

    protected readonly sortOptions = [
        { label: "links.sort.newest", value: "createdAt" },
        { label: "links.sort.popular", value: "viewCount" },
        { label: "links.sort.rating", value: "rating" },
        { label: "links.sort.alphabetical", value: "title" }
    ];

    ngOnInit(): void {
        this.facade.loadCategories();
        this.loadLinks();
    }

    private loadLinks(): void {
        this.facade.loadLinks({
            categoryId: this.selectedCategoryId() ?? undefined,
            tag: this.selectedTag() ?? undefined,
            search: this.searchQuery() || undefined,
            sortBy: this.sortBy(),
            limit: this.pageSize,
            offset: this.page() * this.pageSize
        });
    }

    protected onCategorySelect(id: string | null): void {
        this.selectedCategoryId.set(id);
        this.page.set(0);
        this.loadLinks();
    }

    protected onTagSelect(tag: string | null): void {
        this.selectedTag.set(tag);
        this.page.set(0);
        this.loadLinks();
    }

    protected onSearch(q: string): void {
        this.searchQuery.set(q);
        this.page.set(0);
        this.loadLinks();
    }

    protected onSortChange(sort: LinkSortBy): void {
        this.sortBy.set(sort);
        this.page.set(0);
        this.loadLinks();
    }

    protected onPageChange(event: PaginatorState): void {
        this.page.set(event.page ?? 0);
        this.loadLinks();
    }

    protected clearFilters(): void {
        this.selectedCategoryId.set(null);
        this.selectedTag.set(null);
        this.searchQuery.set("");
        this.page.set(0);
        this.loadLinks();
    }

    protected openLink(link: LinkEntry): void {
        void this.router.navigate(["/links", link.id]);
    }

    protected submitLink(): void {
        void this.router.navigate(["/links/submit"]);
    }

    protected formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    protected getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    protected openExternal(url: string, event: Event): void {
        event.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
    }
}
