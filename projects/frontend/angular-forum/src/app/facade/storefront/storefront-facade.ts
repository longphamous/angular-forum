import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { FEATURED_ROUTES } from "../../core/api/featured.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    CreateFeaturedItemPayload,
    FeaturedItem,
    FeaturedSourceType
} from "../../core/models/storefront/featured-item";

export interface SourceItem {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    linkUrl?: string;
}

@Injectable({ providedIn: "root" })
export class StorefrontFacade {
    readonly featuredItems: Signal<FeaturedItem[]>;
    readonly discountItems: Signal<FeaturedItem[]>;
    readonly allItems: Signal<FeaturedItem[]>;
    readonly sourceItems: Signal<SourceItem[]>;
    readonly loading: Signal<boolean>;

    private readonly _featuredItems = signal<FeaturedItem[]>([]);
    private readonly _discountItems = signal<FeaturedItem[]>([]);
    private readonly _allItems = signal<FeaturedItem[]>([]);
    private readonly _sourceItems = signal<SourceItem[]>([]);
    private readonly _loading = signal(false);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly http = inject(HttpClient);

    constructor() {
        this.featuredItems = this._featuredItems.asReadonly();
        this.discountItems = this._discountItems.asReadonly();
        this.allItems = this._allItems.asReadonly();
        this.sourceItems = this._sourceItems.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadFeatured(): void {
        this._loading.set(true);
        this.http.get<FeaturedItem[]>(`${this.apiConfig.baseUrl}${FEATURED_ROUTES.active()}`).subscribe({
            next: (items) => {
                this._featuredItems.set(items.filter((i) => i.section === "featured"));
                this._discountItems.set(items.filter((i) => i.section === "discount" || i.section === "event"));
                this._loading.set(false);
            },
            error: () => {
                this._loading.set(false);
            }
        });
    }

    loadAll(): void {
        this._loading.set(true);
        this.http.get<FeaturedItem[]>(`${this.apiConfig.baseUrl}${FEATURED_ROUTES.admin.list()}`).subscribe({
            next: (items) => {
                this._allItems.set(items);
                this._loading.set(false);
            },
            error: () => {
                this._loading.set(false);
            }
        });
    }

    loadSourceItems(sourceType: FeaturedSourceType): void {
        this._sourceItems.set([]);
        if (sourceType === "custom") return;

        const endpointMap: Record<string, string> = {
            shop: "/shop",
            booster: "/gamification/tcg/boosters",
            marketplace: "/marketplace/listings"
        };
        const endpoint = endpointMap[sourceType];
        if (!endpoint) return;

        this.http.get<Record<string, unknown>>(`${this.apiConfig.baseUrl}${endpoint}`).subscribe({
            next: (response) => {
                // Handle both array responses (shop, boosters) and paginated responses (marketplace)
                const items: Record<string, unknown>[] = Array.isArray(response)
                    ? response
                    : ((response["data"] as Record<string, unknown>[]) ?? []);

                this._sourceItems.set(
                    items.map((item) => ({
                        id: (item["id"] as string) ?? "",
                        name: (item["name"] as string) ?? (item["title"] as string) ?? "",
                        description: (item["description"] as string) ?? undefined,
                        imageUrl: (item["imageUrl"] as string) ?? (item["images"] as string[])?.[0] ?? undefined,
                        price: (item["price"] as number) ?? undefined,
                        linkUrl:
                            sourceType === "shop"
                                ? "/shop"
                                : sourceType === "booster"
                                  ? "/tcg"
                                  : `/marketplace/${item["id"]}`
                    }))
                );
            },
            error: () => this._sourceItems.set([])
        });
    }

    create(payload: CreateFeaturedItemPayload): void {
        this.http.post<FeaturedItem>(`${this.apiConfig.baseUrl}${FEATURED_ROUTES.admin.list()}`, payload).subscribe({
            next: (created) => {
                this._allItems.update((list) => [...list, created]);
            }
        });
    }

    update(id: string, payload: Partial<CreateFeaturedItemPayload & { isActive: boolean }>): void {
        this.http
            .patch<FeaturedItem>(`${this.apiConfig.baseUrl}${FEATURED_ROUTES.admin.detail(id)}`, payload)
            .subscribe({
                next: (updated) => {
                    this._allItems.update((list) => list.map((item) => (item.id === id ? updated : item)));
                }
            });
    }

    delete(id: string): void {
        this.http.delete(`${this.apiConfig.baseUrl}${FEATURED_ROUTES.admin.detail(id)}`).subscribe({
            next: () => {
                this._allItems.update((list) => list.filter((item) => item.id !== id));
            }
        });
    }
}
