import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";

import { HashtagFacade } from "../../../facade/hashtag/hashtag-facade";

@Component({
    selector: "trending-hashtags",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoModule],
    styles: `
        .trending-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.375rem 0.75rem;
            border-radius: 999px;
            background: var(--glass-bg-subtle);
            border: 1px solid var(--glass-border);
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-color);
            cursor: pointer;
            transition:
                background 0.2s,
                transform 0.15s;
            text-decoration: none;
        }
        .trending-tag:hover {
            background: var(--glass-bg);
            transform: translateY(-1px);
        }
        .trending-tag .tag-hash {
            color: var(--primary-color);
            font-weight: 700;
        }
        .trending-tag .tag-count {
            font-size: 0.625rem;
            color: var(--text-color-secondary);
        }
    `,
    template: `
        <div *transloco="let t">
            @if (facade.trending().length > 0) {
                <h4
                    class="text-surface-500 dark:text-surface-400 m-0 mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
                >
                    <i class="pi pi-bolt text-amber-500" style="font-size: 0.7rem"></i>
                    {{ t("hashtag.trending") }}
                </h4>
                <div class="flex flex-wrap gap-1.5">
                    @for (tag of facade.trending().slice(0, limit); track tag.id) {
                        <a class="trending-tag" (click)="navigate(tag.name)">
                            <span class="tag-hash">#</span>{{ tag.name }}
                            <span class="tag-count">{{ tag.usageCount }}</span>
                        </a>
                    }
                </div>
            }
        </div>
    `
})
export class TrendingHashtags implements OnInit {
    readonly facade = inject(HashtagFacade);
    private readonly router = inject(Router);

    readonly limit = 12;

    ngOnInit(): void {
        if (this.facade.trending().length === 0) {
            this.facade.loadTrending();
        }
    }

    navigate(tag: string): void {
        this.router.navigate(["/hashtags", tag.toLowerCase()]);
    }
}
