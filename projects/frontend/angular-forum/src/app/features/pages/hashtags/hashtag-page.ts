import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ChipModule } from "primeng/chip";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { HashtagFacade } from "../../../facade/hashtag/hashtag-facade";

@Component({
    selector: "hashtag-page",
    standalone: true,
    imports: [DecimalPipe, RouterLink, TranslocoModule, ChipModule, SkeletonModule, TagModule],
    templateUrl: "./hashtag-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        .hashtag-hero {
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .trending-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            border-radius: 999px;
            background: var(--glass-bg-subtle);
            border: 1px solid var(--glass-border);
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--text-color);
            text-decoration: none;
            transition:
                background 0.2s,
                transform 0.15s;
            cursor: pointer;
        }
        .trending-chip:hover {
            background: var(--glass-bg);
            transform: translateY(-1px);
        }
        .trending-chip .chip-count {
            font-size: 0.6875rem;
            color: var(--text-color-secondary);
            font-weight: 400;
        }

        .result-row {
            transition:
                background 0.2s,
                transform 0.15s;
        }
        .result-row:hover {
            background: var(--glass-accent-soft);
            transform: translateX(4px);
        }

        .content-type-badge {
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
        }
    `
})
export class HashtagPage implements OnInit {
    readonly facade = inject(HashtagFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly currentTag = computed(() => {
        const params = this.route.snapshot.paramMap;
        return params.get("tag") ?? "";
    });

    readonly hasTag = computed(() => this.currentTag().length > 0);

    ngOnInit(): void {
        this.facade.loadTrending();

        const tag = this.currentTag();
        if (tag) {
            this.facade.searchByTag(tag);
        }

        this.route.paramMap.subscribe((params) => {
            const t = params.get("tag");
            if (t) {
                this.facade.searchByTag(t);
            }
        });
    }

    navigateToTag(tag: string): void {
        this.router.navigate(["/hashtags", tag.toLowerCase()]);
    }

    contentTypeIcon(type: string): string {
        switch (type) {
            case "post":
                return "pi pi-comment";
            case "thread":
                return "pi pi-comments";
            case "blog":
                return "pi pi-pencil";
            case "chronik":
                return "pi pi-history";
            case "lexicon":
                return "pi pi-book";
            default:
                return "pi pi-file";
        }
    }

    contentTypeColor(type: string): string {
        switch (type) {
            case "post":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "thread":
                return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
            case "blog":
                return "bg-pink-500/10 text-pink-600 dark:text-pink-400";
            case "chronik":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "lexicon":
                return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
            default:
                return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
        }
    }

    contentTypeRoute(type: string, id: string): string[] {
        switch (type) {
            case "post":
            case "thread":
                return ["/forum/threads", id];
            case "blog":
                return ["/blog", id];
            case "lexicon":
                return ["/lexicon", id];
            default:
                return ["/"];
        }
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }
}
