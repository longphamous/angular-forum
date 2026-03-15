import { NgTemplateOutlet } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterModule } from "@angular/router";
import { TranslocoService } from "@jsverse/transloco";

import { SLIDESHOW_ROUTES } from "../../api/slideshow.routes";
import { API_CONFIG, ApiConfig } from "../../config/api.config";
import { TeaserSlide } from "../../models/slideshow/teaser-slide";

@Component({
    selector: "app-teaser-slideshow",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, RouterModule],
    styles: [
        `
            .slide-bg {
                transition: opacity 0.7s ease-in-out;
            }
        `
    ],
    template: `
        @if (slides().length > 0) {
            <div
                class="teaser-slideshow relative w-full overflow-hidden rounded-2xl shadow-lg"
                [attr.role]="
                    slides()[currentIndex()]?.linkFullSlide && slides()[currentIndex()]?.linkUrl ? 'button' : null
                "
                [attr.tabindex]="
                    slides()[currentIndex()]?.linkFullSlide && slides()[currentIndex()]?.linkUrl ? 0 : null
                "
                [class.cursor-pointer]="slides()[currentIndex()]?.linkFullSlide && !!slides()[currentIndex()]?.linkUrl"
                (click)="onSlideClick(slides()[currentIndex()], $event)"
                (keydown.enter)="onSlideClick(slides()[currentIndex()])"
                (mouseenter)="pause()"
                (mouseleave)="resume()"
                style="height: clamp(190px, 22vw, 310px);"
            >
                <!-- Background images (all stacked, fade between them) -->
                @for (slide of slides(); track slide.id; let i = $index) {
                    <div
                        class="slide-bg absolute inset-0 bg-cover bg-center"
                        [style.background-image]="'url(' + slide.imageUrl + ')'"
                        [style.opacity]="i === currentIndex() ? '1' : '0'"
                        [style.z-index]="i === currentIndex() ? '1' : '0'"
                        aria-hidden="true"
                    ></div>
                }

                <!-- Full-slide link overlay (behind content, above background) -->
                @for (slide of slides(); track slide.id; let i = $index) {
                    @if (slide.linkFullSlide && slide.linkUrl && i === currentIndex()) {
                        @if (isExternal(normalizeUrl(slide.linkUrl))) {
                            <a
                                class="absolute inset-0"
                                [attr.aria-label]="getLang(slide, 'title')"
                                [href]="normalizeUrl(slide.linkUrl)"
                                (click)="$event.stopPropagation()"
                                rel="noopener noreferrer"
                                style="z-index: 2;"
                                target="_blank"
                            ></a>
                        } @else {
                            <a
                                class="absolute inset-0"
                                [attr.aria-label]="getLang(slide, 'title')"
                                [routerLink]="normalizeUrl(slide.linkUrl)"
                                (click)="$event.stopPropagation()"
                                style="z-index: 2;"
                            ></a>
                        }
                    }
                }

                <!-- Dark gradient overlay (only for 'overlay' style) -->
                @if (slides()[currentIndex()]?.textStyle !== "glass") {
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
                        style="z-index: 3;"
                    ></div>
                }

                <!-- Content overlay per slide -->
                @for (slide of slides(); track slide.id; let i = $index) {
                    <div
                        class="slide-bg absolute inset-0 flex flex-col p-4 sm:p-6"
                        [class.items-center]="slide.textAlign === 'center'"
                        [class.items-start]="slide.textAlign !== 'center'"
                        [class.justify-center]="slide.textAlign === 'center'"
                        [class.justify-end]="slide.textAlign !== 'center'"
                        [style.opacity]="i === currentIndex() ? '1' : '0'"
                        [style.z-index]="i === currentIndex() ? '4' : '3'"
                    >
                        @if (slide.textStyle === "glass") {
                            <!-- Glassmorphism box -->
                            <div
                                class="rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-md sm:p-5"
                                [class.max-w-lg]="slide.textAlign === 'center'"
                                [class.max-w-md]="slide.textAlign !== 'center'"
                                [class.text-center]="slide.textAlign === 'center'"
                            >
                                <h2 class="m-0 mb-1 text-lg leading-tight font-bold text-white drop-shadow sm:text-xl">
                                    {{ getLang(slide, "title") }}
                                </h2>
                                @if (getLang(slide, "description")) {
                                    <p class="m-0 mb-3 text-xs leading-relaxed text-white/85 drop-shadow sm:text-sm">
                                        {{ getLang(slide, "description") }}
                                    </p>
                                }
                                @if (slide.linkUrl && !slide.linkFullSlide) {
                                    <ng-container *ngTemplateOutlet="ctaBtn; context: { $implicit: slide }" />
                                }
                            </div>
                        } @else {
                            <!-- Default overlay style -->
                            <h2
                                class="m-0 mb-1 text-lg leading-tight font-bold text-white drop-shadow-lg sm:text-2xl"
                                [class.text-center]="slide.textAlign === 'center'"
                            >
                                {{ getLang(slide, "title") }}
                            </h2>
                            @if (getLang(slide, "description")) {
                                <p
                                    class="m-0 mb-2 max-w-lg text-xs leading-relaxed text-white/85 drop-shadow sm:text-sm"
                                    [class.text-center]="slide.textAlign === 'center'"
                                >
                                    {{ getLang(slide, "description") }}
                                </p>
                            }
                            @if (slide.linkUrl && !slide.linkFullSlide) {
                                <ng-container *ngTemplateOutlet="ctaBtn; context: { $implicit: slide }" />
                            }
                        }
                    </div>
                }

                <!-- CTA button template -->
                <ng-template #ctaBtn let-slide>
                    @if (isExternal(normalizeUrl(slide.linkUrl!))) {
                        <a
                            class="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-white/35 sm:px-4 sm:py-2 sm:text-sm"
                            [href]="normalizeUrl(slide.linkUrl!)"
                            (click)="$event.stopPropagation()"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {{ slide.linkLabel || "Mehr erfahren" }}
                            <i class="pi pi-arrow-right text-xs"></i>
                        </a>
                    } @else {
                        <a
                            class="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-white/35 sm:px-4 sm:py-2 sm:text-sm"
                            [routerLink]="normalizeUrl(slide.linkUrl!)"
                            (click)="$event.stopPropagation()"
                        >
                            {{ slide.linkLabel || "Mehr erfahren" }}
                            <i class="pi pi-arrow-right text-xs"></i>
                        </a>
                    }
                </ng-template>

                <!-- Arrow navigation -->
                @if (slides().length > 1) {
                    <button
                        class="absolute top-1/2 left-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none"
                        (click)="prev(); $event.stopPropagation()"
                        aria-label="Previous slide"
                    >
                        <i class="pi pi-chevron-left text-xs sm:text-sm"></i>
                    </button>
                    <button
                        class="absolute top-1/2 right-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none"
                        (click)="next(); $event.stopPropagation()"
                        aria-label="Next slide"
                    >
                        <i class="pi pi-chevron-right text-xs sm:text-sm"></i>
                    </button>

                    <!-- Dot navigation -->
                    <div class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-3">
                        @for (slide of slides(); track slide.id; let i = $index) {
                            <button
                                [attr.aria-label]="'Slide ' + (i + 1)"
                                [class]="
                                    'h-1.5 rounded-full transition-all duration-300 focus:outline-none ' +
                                    (i === currentIndex() ? 'w-5 bg-white' : 'w-1.5 bg-white/45')
                                "
                                (click)="goTo(i); $event.stopPropagation()"
                                type="button"
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
    private readonly transloco = inject(TranslocoService);
    private readonly router = inject(Router);

    protected readonly slides = signal<TeaserSlide[]>([]);
    protected readonly currentIndex = signal(0);
    protected readonly currentLang = signal(this.transloco.getActiveLang());

    private timer: ReturnType<typeof setInterval> | null = null;
    private paused = false;

    constructor() {
        this.transloco.langChanges$.pipe(takeUntilDestroyed()).subscribe((lang) => {
            this.currentLang.set(lang);
        });
    }

    ngOnInit(): void {
        this.http.get<TeaserSlide[]>(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.active()}`).subscribe({
            next: (data) => {
                this.slides.set(data);
                if (data.length > 1) this.startTimer();
            },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
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

    protected normalizeUrl(url: string): string {
        if (!url) return "#";
        if (
            url.startsWith("/") ||
            url.startsWith("#") ||
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("mailto:") ||
            url.startsWith("tel:")
        ) {
            return url;
        }
        return `https://${url}`;
    }

    protected isExternal(url: string): boolean {
        return url.startsWith("http://") || url.startsWith("https://");
    }

    protected getLang(slide: TeaserSlide, field: "title" | "description"): string | null {
        const lang = this.currentLang();
        const translation = slide.translations?.[lang];
        const value = translation?.[field];
        if (value) return value;
        return (slide[field] as string | null) ?? null;
    }

    protected onSlideClick(slide: TeaserSlide | undefined, _event?: MouseEvent): void {
        if (!slide?.linkFullSlide || !slide.linkUrl) return;
        const url = this.normalizeUrl(slide.linkUrl);
        if (this.isExternal(url)) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            void this.router.navigateByUrl(url);
        }
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
