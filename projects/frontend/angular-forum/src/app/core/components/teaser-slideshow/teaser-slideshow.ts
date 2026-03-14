import { HttpClient } from "@angular/common/http";
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal
} from "@angular/core";
import { RouterModule } from "@angular/router";

import { API_CONFIG, ApiConfig } from "../../config/api.config";
import { SLIDESHOW_ROUTES } from "../../api/slideshow.routes";
import { TeaserSlide } from "../../models/slideshow/teaser-slide";

@Component({
    selector: "app-teaser-slideshow",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule],
    template: `
        @if (slides().length > 0) {
            <div
                class="teaser-slideshow relative overflow-hidden rounded-2xl shadow-lg"
                style="aspect-ratio: 21/7; min-height: 180px;"
                (mouseenter)="pause()"
                (mouseleave)="resume()"
            >
                <!-- Slides -->
                @for (slide of slides(); track slide.id; let i = $index) {
                    <div
                        class="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                        [style.opacity]="i === currentIndex() ? '1' : '0'"
                        [style.z-index]="i === currentIndex() ? '1' : '0'"
                        [style.background-image]="'url(' + slide.imageUrl + ')'"
                        aria-hidden="true"
                    ></div>
                }

                <!-- Dark gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" style="z-index: 2;"></div>

                <!-- Content overlay -->
                @for (slide of slides(); track slide.id; let i = $index) {
                    <div
                        class="absolute inset-0 flex flex-col justify-end p-6 transition-opacity duration-700"
                        [style.opacity]="i === currentIndex() ? '1' : '0'"
                        [style.z-index]="i === currentIndex() ? '3' : '2'"
                    >
                        <h2 class="text-white text-2xl font-bold drop-shadow-lg m-0 mb-1 leading-tight">
                            {{ slide.title }}
                        </h2>
                        @if (slide.description) {
                            <p class="text-white/80 text-sm m-0 mb-3 max-w-lg leading-relaxed drop-shadow">
                                {{ slide.description }}
                            </p>
                        }
                        @if (slide.linkUrl) {
                            @if (isExternal(slide.linkUrl)) {
                                <a
                                    [href]="slide.linkUrl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center gap-2 self-start rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-white/30 transition-colors"
                                >
                                    {{ slide.linkLabel || 'Mehr erfahren' }}
                                    <i class="pi pi-arrow-right text-xs"></i>
                                </a>
                            } @else {
                                <a
                                    [routerLink]="slide.linkUrl"
                                    class="inline-flex items-center gap-2 self-start rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-white/30 transition-colors"
                                >
                                    {{ slide.linkLabel || 'Mehr erfahren' }}
                                    <i class="pi pi-arrow-right text-xs"></i>
                                </a>
                            }
                        }
                    </div>
                }

                <!-- Arrow buttons -->
                @if (slides().length > 1) {
                    <button
                        class="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none"
                        style="z-index: 4;"
                        (click)="prev(); $event.stopPropagation()"
                        aria-label="Previous slide"
                    >
                        <i class="pi pi-chevron-left text-sm"></i>
                    </button>
                    <button
                        class="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none"
                        style="z-index: 4;"
                        (click)="next(); $event.stopPropagation()"
                        aria-label="Next slide"
                    >
                        <i class="pi pi-chevron-right text-sm"></i>
                    </button>

                    <!-- Dots navigation -->
                    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style="z-index: 4;">
                        @for (slide of slides(); track slide.id; let i = $index) {
                            <button
                                class="h-2 rounded-full transition-all duration-300 focus:outline-none"
                                [class.w-6]="i === currentIndex()"
                                [class.w-2]="i !== currentIndex()"
                                [class.bg-white]="i === currentIndex()"
                                [class.bg-white/50]="i !== currentIndex()"
                                (click)="goTo(i); $event.stopPropagation()"
                                [attr.aria-label]="'Go to slide ' + (i + 1)"
                            ></button>
                        }
                    </div>
                }
            </div>
        }
    `
})
export class TeaserSlideshowComponent implements OnInit, OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    protected readonly slides = signal<TeaserSlide[]>([]);
    protected readonly currentIndex = signal(0);

    private timer: ReturnType<typeof setInterval> | null = null;
    private paused = false;

    ngOnInit(): void {
        this.http
            .get<TeaserSlide[]>(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.active()}`)
            .subscribe({
                next: (data) => {
                    this.slides.set(data);
                    if (data.length > 1) this.startTimer();
                },
                error: () => {}
            });
    }

    ngOnDestroy(): void {
        this.clearTimer();
    }

    protected next(): void {
        this.currentIndex.update((i) => (i + 1) % this.slides().length);
    }

    protected prev(): void {
        this.currentIndex.update((i) => (i - 1 + this.slides().length) % this.slides().length);
    }

    protected goTo(index: number): void {
        this.currentIndex.set(index);
    }

    protected pause(): void {
        this.paused = true;
    }

    protected resume(): void {
        this.paused = false;
    }

    protected isExternal(url: string): boolean {
        return url.startsWith("http://") || url.startsWith("https://");
    }

    private startTimer(): void {
        this.timer = setInterval(() => {
            if (!this.paused) this.next();
        }, 5000);
    }

    private clearTimer(): void {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
