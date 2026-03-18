import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { FeaturedThread, ThreadSearchResult } from "../../../core/models/feed/feed";
import { FeedFacade } from "../../../facade/feed/feed-facade";

@Component({
    selector: "admin-feed",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService],
    templateUrl: "./admin-feed.html"
})
export class AdminFeed implements OnInit {
    private readonly facade = inject(FeedFacade);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translocoService = inject(TranslocoService);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly error = signal<string | null>(null);
    readonly successMsg = signal<string | null>(null);
    readonly featured = signal<FeaturedThread[]>([]);

    // Search dialog
    readonly dialogVisible = signal(false);
    readonly searchQuery = signal("");
    readonly searching = signal(false);
    readonly searchResults = signal<ThreadSearchResult[]>([]);
    readonly selectedPosition = signal<number>(0);

    ngOnInit(): void {
        this.loadFeatured();
    }

    private loadFeatured(): void {
        this.loading.set(true);
        this.facade.getAdminFeatured().subscribe({
            next: (items) => {
                this.featured.set(items);
                this.loading.set(false);
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminFeed.loadError"));
                this.loading.set(false);
            }
        });
    }

    openAddDialog(): void {
        this.searchQuery.set("");
        this.searchResults.set([]);
        this.selectedPosition.set(this.featured().length);
        this.error.set(null);
        this.dialogVisible.set(true);
    }

    onSearch(): void {
        const q = this.searchQuery().trim();
        if (q.length < 2) return;
        this.searching.set(true);
        this.facade.searchThreads(q).subscribe({
            next: (results) => {
                this.searchResults.set(results);
                this.searching.set(false);
            },
            error: () => {
                this.searching.set(false);
            }
        });
    }

    addThread(result: ThreadSearchResult): void {
        this.saving.set(true);
        this.facade.addFeatured(result.id, this.selectedPosition()).subscribe({
            next: (item) => {
                this.featured.update((list) => [...list, item].sort((a, b) => a.position - b.position));
                this.successMsg.set(this.translocoService.translate("adminFeed.addSuccess"));
                this.saving.set(false);
                this.dialogVisible.set(false);
                this.loadFeatured();
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminFeed.saveError"));
                this.saving.set(false);
            }
        });
    }

    toggleActive(item: FeaturedThread): void {
        this.facade.updateFeatured(item.id, { isActive: !item.isActive }).subscribe({
            next: (updated) => {
                this.featured.update((list) => list.map((f) => (f.id === updated.id ? updated : f)));
                this.loadFeatured();
            },
            error: () => this.error.set(this.translocoService.translate("adminFeed.saveError"))
        });
    }

    updatePosition(item: FeaturedThread, position: number): void {
        this.facade.updateFeatured(item.id, { position }).subscribe({
            next: (updated) => {
                this.featured.update((list) =>
                    list.map((f) => (f.id === updated.id ? updated : f)).sort((a, b) => a.position - b.position)
                );
                this.loadFeatured();
            },
            error: () => this.error.set(this.translocoService.translate("adminFeed.saveError"))
        });
    }

    confirmRemove(item: FeaturedThread): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("adminFeed.deleteDialog.confirm", { title: item.title }),
            header: this.translocoService.translate("adminFeed.deleteDialog.header"),
            icon: "pi pi-trash",
            acceptLabel: this.translocoService.translate("common.delete"),
            rejectLabel: this.translocoService.translate("common.cancel"),
            acceptButtonProps: { severity: "danger" },
            accept: () => this.removeFeatured(item)
        });
    }

    private removeFeatured(item: FeaturedThread): void {
        this.facade.removeFeatured(item.id).subscribe({
            next: () => {
                this.featured.update((list) => list.filter((f) => f.id !== item.id));
                this.successMsg.set(this.translocoService.translate("adminFeed.deleteSuccess"));
                this.loadFeatured();
            },
            error: () => this.error.set(this.translocoService.translate("adminFeed.deleteError"))
        });
    }
}
