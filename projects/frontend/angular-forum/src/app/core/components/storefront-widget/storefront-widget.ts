import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    OnInit,
    signal
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";

import { FeaturedItem } from "../../models/storefront/featured-item";
import { StorefrontFacade } from "../../../facade/storefront/storefront-facade";

@Component({
    selector: "app-storefront-widget",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, TranslocoModule],
    styles: `
        :host {
            display: block;
        }
        .storefront-scrollbar::-webkit-scrollbar {
            height: 6px;
        }
        .storefront-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }
        .storefront-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 3px;
        }
        .storefront-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.25);
        }
    `,
    template: `
        <div class="storefront-widget rounded-2xl bg-[#1B2838] p-6 shadow-xl" *transloco="let t">
            <!-- Featured & Recommended -->
            @if (featuredItems().length > 0) {
            <div
                class="mb-6"
                (mouseenter)="pauseRotation()"
                (mouseleave)="resumeRotation()"
            >
                <h3 class="mb-3 text-sm font-bold uppercase tracking-wider text-white/70">
                    {{ t('storefront.featured') }}
                </h3>
                <div class="grid grid-cols-12 gap-3" style="height: 320px">
                    <!-- Big Banner (8 cols) -->
                    <div class="relative col-span-8 overflow-hidden rounded-lg">
                        @if (activeItem(); as item) {
                        <img [src]="item.imageUrl" [alt]="item.title" class="h-full w-full object-cover" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        @if (item.badgeText) {
                        <span
                            class="absolute top-3 left-3 rounded px-2 py-1 text-xs font-bold text-white"
                            [style.background]="item.badgeColor ?? '#3B82F6'"
                        >{{ item.badgeText }}</span>
                        }
                        <div class="absolute bottom-0 left-0 right-0 p-5">
                            <h4 class="text-xl font-bold text-white">{{ item.title }}</h4>
                            @if (item.description) {
                            <p class="mt-1 text-sm text-white/70 line-clamp-2">{{ item.description }}</p>
                            }
                            @if (item.discountPrice != null) {
                            <div class="mt-2 flex items-center gap-2">
                                @if (item.originalPrice) {
                                <span class="text-sm text-gray-400 line-through">{{ item.originalPrice }}</span>
                                }
                                <span class="text-lg font-bold text-green-400">
                                    {{ item.discountPrice === 0 ? t('storefront.free') : item.discountPrice }}
                                </span>
                            </div>
                            }
                        </div>
                        }
                    </div>
                    <!-- Thumbnails (4 cols) -->
                    <div class="col-span-4 flex flex-col gap-1">
                        @for (item of featuredItems(); track item.id; let i = $index) {
                        <div
                            class="flex h-1/4 cursor-pointer items-center gap-3 rounded px-2 transition-colors"
                            [class]="activeIndex() === i ? 'bg-[#1a2940] border-l-2 border-blue-400' : 'bg-[#0a0f16] hover:bg-[#1a2940]'"
                            (mouseenter)="setActive(i)"
                        >
                            @if (item.imageUrl) {
                            <img [src]="item.imageUrl" [alt]="item.title" class="h-10 w-16 rounded object-cover" />
                            }
                            <span class="text-sm font-medium text-white/90 line-clamp-1">{{ item.title }}</span>
                        </div>
                        }
                    </div>
                </div>
            </div>
            }

            <!-- Discounts & Events -->
            @if (discountItems().length > 0) {
            <div>
                <h3 class="mb-3 text-sm font-bold uppercase tracking-wider text-white/70">
                    {{ t('storefront.discounts') }}
                </h3>
                <div class="storefront-scrollbar flex gap-3 overflow-x-auto pb-2">
                    @for (item of discountItems(); track item.id) {
                    <a [routerLink]="item.linkUrl ? [item.linkUrl] : null" class="group w-44 shrink-0">
                        <div class="relative overflow-hidden rounded-lg">
                            <img
                                [src]="item.imageUrl ?? '/assets/images/placeholder.png'"
                                [alt]="item.title"
                                class="h-24 w-full object-cover transition-transform group-hover:scale-105"
                            />
                            @if (item.badgeText) {
                            <span
                                class="absolute top-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                [style.background]="item.badgeColor ?? '#EF4444'"
                            >{{ item.badgeText }}</span>
                            }
                        </div>
                        <div class="mt-2">
                            <div class="text-sm font-medium text-white/90 line-clamp-1">{{ item.title }}</div>
                            @if (item.discountPrice != null || item.originalPrice != null) {
                            <div class="mt-1 flex items-center gap-1.5">
                                @if (item.originalPrice && item.discountPrice != null && item.originalPrice !== item.discountPrice) {
                                <span class="text-xs text-gray-500 line-through">{{ item.originalPrice }}</span>
                                }
                                @if (item.discountPrice != null) {
                                <span class="text-sm font-bold text-green-400">
                                    {{ item.discountPrice === 0 ? t('storefront.free') : item.discountPrice }}
                                </span>
                                }
                            </div>
                            }
                        </div>
                    </a>
                    }
                </div>
            </div>
            }
        </div>
    `
})
export class StorefrontWidget implements OnInit {
    private readonly facade = inject(StorefrontFacade);
    private readonly destroyRef = inject(DestroyRef);

    readonly featuredItems = computed<FeaturedItem[]>(() => this.facade.featuredItems());
    readonly discountItems = computed<FeaturedItem[]>(() => this.facade.discountItems());
    readonly activeIndex = signal(0);
    readonly activeItem = computed<FeaturedItem | undefined>(
        () => this.featuredItems()[this.activeIndex()] ?? this.featuredItems()[0]
    );

    private intervalId: ReturnType<typeof setInterval> | null = null;
    private paused = false;

    ngOnInit(): void {
        this.facade.loadFeatured();
        this.startRotation();
        this.destroyRef.onDestroy(() => this.stopRotation());
    }

    setActive(index: number): void {
        this.activeIndex.set(index);
    }

    pauseRotation(): void {
        this.paused = true;
    }

    resumeRotation(): void {
        this.paused = false;
    }

    private startRotation(): void {
        this.intervalId = setInterval(() => {
            if (!this.paused && this.featuredItems().length > 0) {
                const next = (this.activeIndex() + 1) % this.featuredItems().length;
                this.activeIndex.set(next);
            }
        }, 5000);
    }

    private stopRotation(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
