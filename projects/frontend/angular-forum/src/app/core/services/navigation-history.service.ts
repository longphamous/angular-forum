import { Location } from "@angular/common";
import { computed, inject, Injectable, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs/operators";

interface RouteLabel {
    pattern: RegExp | string;
    label: string;
}

const ROUTE_LABELS: RouteLabel[] = [
    { pattern: "/feed", label: "Feed" },
    { pattern: /^\/forum\/forums\/[^/]+/, label: "Forum" },
    { pattern: "/forum", label: "Foren Übersicht" },
    { pattern: "/anime-top-list", label: "Top Anime" },
    { pattern: "/anime-database", label: "Anime Datenbank" },
    { pattern: "/anime/my-list", label: "Meine Liste" },
    { pattern: /^\/anime\/[^/]+/, label: "Anime Detail" },
    { pattern: "/marketplace/my", label: "Meine Inserate" },
    { pattern: "/marketplace", label: "Marktplatz" },
    { pattern: "/blog/write", label: "Blog" },
    { pattern: /^\/blog\/[^/]+\/edit/, label: "Blog" },
    { pattern: /^\/blog\/[^/]+/, label: "Blog" },
    { pattern: "/blog", label: "Blog" },
    { pattern: /^\/gallery\/[^/]+/, label: "Galerie" },
    { pattern: "/gallery", label: "Galerie" },
    { pattern: "/calendar", label: "Kalender" },
    { pattern: "/lotto", label: "Lotto" },
    { pattern: "/shop", label: "Shop" },
    { pattern: "/messages", label: "Nachrichten" },
    { pattern: /^\/users\/[^/]+/, label: "Profil" },
    { pattern: "/profile", label: "Profil" },
    { pattern: "/dashboard", label: "Dashboard" }
];

@Injectable({ providedIn: "root" })
export class NavigationHistoryService {
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly _stack = signal<string[]>([]);
    private goingBack = false;

    readonly previousUrl = computed(() => {
        const stack = this._stack();
        return stack.length >= 2 ? stack[stack.length - 2] : null;
    });

    readonly canGoBack = computed(() => this._stack().length >= 2);

    readonly backLabel = computed(() => {
        const prev = this.previousUrl();
        return prev ? this.urlToLabel(prev) : "Zurück";
    });

    constructor() {
        this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
            if (this.goingBack) {
                this.goingBack = false;
                return;
            }
            this._stack.update((s) => {
                // Avoid duplicate consecutive entries
                const last = s[s.length - 1];
                return last === e.urlAfterRedirects ? s : [...s, e.urlAfterRedirects];
            });
        });
    }

    back(fallback = "/feed"): void {
        if (this._stack().length >= 2) {
            this.goingBack = true;
            this._stack.update((s) => s.slice(0, -1));
            this.location.back();
        } else {
            void this.router.navigateByUrl(fallback);
        }
    }

    urlToLabel(url: string): string {
        for (const { pattern, label } of ROUTE_LABELS) {
            const matches = typeof pattern === "string" ? url.startsWith(pattern) : pattern.test(url);
            if (matches) return label;
        }
        return "Zurück";
    }
}
