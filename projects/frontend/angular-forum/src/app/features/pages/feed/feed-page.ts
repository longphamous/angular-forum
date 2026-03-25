import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SelectButtonModule } from "primeng/selectbutton";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { FeedSort } from "../../../core/models/feed/feed";
import { FeedFacade } from "../../../facade/feed/feed-facade";

interface SortOption {
    label: string;
    value: FeedSort;
    icon: string;
}

@Component({
    selector: "feed-page",
    imports: [FormsModule, TranslocoModule, ButtonModule, SelectButtonModule, SkeletonModule, TagModule, TooltipModule],
    templateUrl: "./feed-page.html",
    styleUrl: "./feed-page.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPage implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("sentinel") sentinelRef!: ElementRef<HTMLDivElement>;

    readonly facade = inject(FeedFacade);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly translocoService = inject(TranslocoService);

    selectedSort: FeedSort = "hot";
    private observer?: IntersectionObserver;

    get sortOptions(): SortOption[] {
        return [
            { label: "🔥 " + this.translocoService.translate("feed.sort.hot"), value: "hot", icon: "pi pi-fire" },
            { label: "✨ " + this.translocoService.translate("feed.sort.new"), value: "new", icon: "pi pi-sparkles" },
            { label: "🏆 " + this.translocoService.translate("feed.sort.top"), value: "top", icon: "pi pi-trophy" }
        ];
    }

    ngOnInit(): void {
        this.facade.loadFeatured();
        this.facade.loadFeed("hot");
    }

    ngAfterViewInit(): void {
        this.setupInfiniteScroll();
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    onSortChange(sort: FeedSort): void {
        this.selectedSort = sort;
        this.facade.loadFeed(sort);
    }

    navigateToThread(threadId: string): void {
        void this.router.navigate(["/forum/threads", threadId]);
    }

    getTagSeverity(_tag: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        return "secondary";
    }

    formatRelative(dateStr?: string): string {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return this.translocoService.translate("common.justNow");
        if (minutes < 60) return this.translocoService.translate("common.minutesAgo", { count: minutes });
        if (hours < 24) return this.translocoService.translate("common.hoursAgo", { count: hours });
        if (days < 30)
            return this.translocoService.translate(days === 1 ? "common.daysAgo" : "common.daysAgoPlural", {
                count: days
            });
        return new Date(dateStr).toLocaleDateString(this.translocoService.getActiveLang() === "en" ? "en-US" : "de-DE");
    }

    featuredTrackBy(_idx: number, item: { id: string }): string {
        return item.id;
    }

    feedTrackBy(_idx: number, item: { id: string }): string {
        return item.id;
    }

    private setupInfiniteScroll(): void {
        if (!this.sentinelRef) return;

        this.observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !this.facade.feedLoading() && this.facade.hasMore()) {
                    this.facade.loadMore();
                    this.cdr.markForCheck();
                }
            },
            { threshold: 0.1 }
        );
        this.observer.observe(this.sentinelRef.nativeElement);
    }
}
