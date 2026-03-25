import { ChangeDetectionStrategy, Component, inject, input, OnInit, Signal, signal } from "@angular/core";

import { LinkEmbed } from "../../../core/models/embed/link-embed";
import { EmbedResolverService } from "../../../core/services/embed-resolver.service";

@Component({
    selector: "rich-embed",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (embed(); as data) {
            @if (data.title) {
                <a class="rich-embed-card" [href]="data.url" rel="noopener noreferrer" target="_blank">
                    @if (data.imageUrl) {
                        <div class="rich-embed-image-wrap">
                            <img class="rich-embed-image" [src]="data.imageUrl" (error)="onImageError($event)" alt="" />
                        </div>
                    }
                    <div class="rich-embed-body">
                        <div class="rich-embed-title">{{ data.title }}</div>
                        @if (data.description) {
                            <div class="rich-embed-desc">{{ data.description }}</div>
                        }
                        <div class="rich-embed-meta">
                            @if (data.faviconUrl) {
                                <img
                                    class="rich-embed-favicon"
                                    [src]="data.faviconUrl"
                                    (error)="onFaviconError($event)"
                                    alt=""
                                />
                            }
                            <span class="rich-embed-domain">{{ data.siteName ?? data.domain }}</span>
                        </div>
                    </div>
                </a>
            }
        }
    `,
    styles: [
        `
            :host {
                display: block;
                margin: 0.75rem 0;
            }

            .rich-embed-card {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border-radius: 0.75rem;
                border: 1px solid var(--surface-border, #e5e7eb);
                background: var(--surface-card, #fff);
                text-decoration: none;
                color: inherit;
                transition:
                    box-shadow 0.2s,
                    border-color 0.2s;
                max-width: 560px;
            }
            .rich-embed-card:hover {
                border-color: var(--primary-color, #10b981);
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            }

            .rich-embed-image-wrap {
                width: 100%;
                aspect-ratio: 1200 / 630;
                overflow: hidden;
                background: var(--surface-100, #f3f4f6);
            }
            .rich-embed-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .rich-embed-body {
                padding: 0.875rem 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.375rem;
            }

            .rich-embed-title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: var(--text-color, #111);
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .rich-embed-desc {
                font-size: 0.8125rem;
                color: var(--text-color-secondary, #6b7280);
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .rich-embed-meta {
                display: flex;
                align-items: center;
                gap: 0.375rem;
                margin-top: 0.25rem;
            }

            .rich-embed-favicon {
                width: 14px;
                height: 14px;
                border-radius: 2px;
            }

            .rich-embed-domain {
                font-size: 0.75rem;
                color: var(--text-color-secondary, #6b7280);
            }
        `
    ]
})
export class RichEmbed implements OnInit {
    readonly url = input.required<string>();

    embed: Signal<LinkEmbed | null> = signal<LinkEmbed | null>(null);

    private readonly embedResolver = inject(EmbedResolverService);

    ngOnInit(): void {
        this.embed = this.embedResolver.resolve(this.url());
    }

    onImageError(event: Event): void {
        (event.target as HTMLElement).style.display = "none";
    }

    onFaviconError(event: Event): void {
        (event.target as HTMLElement).style.display = "none";
    }
}
