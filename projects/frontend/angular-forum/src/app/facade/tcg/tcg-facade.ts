import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";

import { TCG_ROUTES } from "../../core/api/tcg.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type {
    AdminBoosterDetail,
    BoosterPack,
    Card,
    CardListing,
    CollectionProgress,
    CreateBoosterPackDto,
    CreateCardDto,
    OpenBoosterResult,
    UserBooster,
    UserCard
} from "../../core/models/tcg/tcg";

@Injectable({ providedIn: "root" })
export class TcgFacade {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    // ─── Public state ────────────────────────────────────────────────────────
    readonly boosters = signal<BoosterPack[]>([]);
    readonly boostersLoading = signal(false);
    readonly cards = signal<Card[]>([]);
    readonly cardsLoading = signal(false);

    // ─── Authenticated state ─────────────────────────────────────────────────
    readonly collection = signal<UserCard[]>([]);
    readonly collectionLoading = signal(false);
    readonly progress = signal<CollectionProgress | null>(null);
    readonly progressLoading = signal(false);
    readonly unopenedBoosters = signal<UserBooster[]>([]);
    readonly unopenedBoostersLoading = signal(false);
    readonly openResult = signal<OpenBoosterResult | null>(null);
    readonly listings = signal<CardListing[]>([]);
    readonly listingsLoading = signal(false);
    readonly buying = signal(false);
    readonly opening = signal(false);

    // ─── Admin state ─────────────────────────────────────────────────────────
    readonly adminCards = signal<Card[]>([]);
    readonly adminBoosters = signal<AdminBoosterDetail[]>([]);
    readonly adminLoading = signal(false);
    readonly adminSaving = signal(false);

    private get base(): string {
        return this.apiConfig.baseUrl;
    }

    // ─── Public methods ──────────────────────────────────────────────────────

    loadBoosters(): void {
        this.boostersLoading.set(true);
        this.http.get<BoosterPack[]>(`${this.base}${TCG_ROUTES.boosters()}`).subscribe({
            next: (data) => {
                this.boosters.set(data);
                this.boostersLoading.set(false);
            },
            error: () => this.boostersLoading.set(false)
        });
    }

    loadCards(): void {
        this.cardsLoading.set(true);
        this.http.get<Card[]>(`${this.base}${TCG_ROUTES.cards()}`).subscribe({
            next: (data) => {
                this.cards.set(data);
                this.cardsLoading.set(false);
            },
            error: () => this.cardsLoading.set(false)
        });
    }

    loadListings(): void {
        this.listingsLoading.set(true);
        this.http.get<CardListing[]>(`${this.base}${TCG_ROUTES.listings()}`).subscribe({
            next: (data) => {
                this.listings.set(data);
                this.listingsLoading.set(false);
            },
            error: () => this.listingsLoading.set(false)
        });
    }

    // ─── Authenticated methods ───────────────────────────────────────────────

    loadCollection(): void {
        this.collectionLoading.set(true);
        this.http.get<UserCard[]>(`${this.base}${TCG_ROUTES.collection()}`).subscribe({
            next: (data) => {
                this.collection.set(data);
                this.collectionLoading.set(false);
            },
            error: () => this.collectionLoading.set(false)
        });
    }

    loadProgress(): void {
        this.progressLoading.set(true);
        this.http.get<CollectionProgress>(`${this.base}${TCG_ROUTES.collectionProgress()}`).subscribe({
            next: (data) => {
                this.progress.set(data);
                this.progressLoading.set(false);
            },
            error: () => this.progressLoading.set(false)
        });
    }

    loadInventory(): void {
        this.unopenedBoostersLoading.set(true);
        this.http.get<UserBooster[]>(`${this.base}${TCG_ROUTES.inventory()}`).subscribe({
            next: (data) => {
                this.unopenedBoosters.set(data.filter((b) => !b.isOpened));
                this.unopenedBoostersLoading.set(false);
            },
            error: () => this.unopenedBoostersLoading.set(false)
        });
    }

    buyBooster(id: string): void {
        this.buying.set(true);
        this.http.post<UserBooster>(`${this.base}${TCG_ROUTES.buyBooster(id)}`, {}).subscribe({
            next: () => {
                this.buying.set(false);
                this.loadBoosters();
                this.loadInventory();
            },
            error: () => this.buying.set(false)
        });
    }

    openBooster(id: string): void {
        this.opening.set(true);
        this.openResult.set(null);
        this.http.post<OpenBoosterResult>(`${this.base}${TCG_ROUTES.openBooster(id)}`, {}).subscribe({
            next: (result) => {
                this.openResult.set(result);
                this.opening.set(false);
                this.loadInventory();
                this.loadCollection();
                this.loadProgress();
            },
            error: () => this.opening.set(false)
        });
    }

    toggleFavorite(cardId: string): void {
        this.http.patch<UserCard>(`${this.base}${TCG_ROUTES.toggleFavorite(cardId)}`, {}).subscribe({
            next: (updated) => {
                this.collection.update((col) => col.map((uc) => (uc.cardId === updated.cardId ? updated : uc)));
            },
            error: () => undefined
        });
    }

    transferCard(cardId: string, targetUserId: string, quantity: number): void {
        this.http
            .post<{ success: true }>(`${this.base}${TCG_ROUTES.transferCard(cardId)}`, { targetUserId, quantity })
            .subscribe({
                next: () => {
                    this.loadCollection();
                    this.loadProgress();
                },
                error: () => undefined
            });
    }

    createListing(cardId: string, price: number, quantity: number): void {
        this.http
            .post<CardListing>(`${this.base}${TCG_ROUTES.createListing()}`, { cardId, price, quantity })
            .subscribe({
                next: () => {
                    this.loadListings();
                    this.loadCollection();
                },
                error: () => undefined
            });
    }

    cancelListing(id: string): void {
        this.http.delete<void>(`${this.base}${TCG_ROUTES.cancelListing(id)}`).subscribe({
            next: () => {
                this.loadListings();
                this.loadCollection();
            },
            error: () => undefined
        });
    }

    buyListing(id: string): void {
        this.buying.set(true);
        this.http.post<CardListing>(`${this.base}${TCG_ROUTES.buyListing(id)}`, {}).subscribe({
            next: () => {
                this.buying.set(false);
                this.loadListings();
                this.loadCollection();
                this.loadProgress();
            },
            error: () => this.buying.set(false)
        });
    }

    // ─── Admin methods ───────────────────────────────────────────────────────

    loadAdminCards(): void {
        this.adminLoading.set(true);
        this.http.get<Card[]>(`${this.base}${TCG_ROUTES.adminCards()}`).subscribe({
            next: (data) => {
                this.adminCards.set(data);
                this.adminLoading.set(false);
            },
            error: () => this.adminLoading.set(false)
        });
    }

    createCard(dto: CreateCardDto): void {
        this.adminSaving.set(true);
        this.http.post<Card>(`${this.base}${TCG_ROUTES.adminCards()}`, dto).subscribe({
            next: () => {
                this.adminSaving.set(false);
                this.loadAdminCards();
            },
            error: () => this.adminSaving.set(false)
        });
    }

    updateCard(id: string, dto: Partial<CreateCardDto>): void {
        this.adminSaving.set(true);
        this.http.put<Card>(`${this.base}${TCG_ROUTES.adminCardById(id)}`, dto).subscribe({
            next: () => {
                this.adminSaving.set(false);
                this.loadAdminCards();
            },
            error: () => this.adminSaving.set(false)
        });
    }

    deleteCard(id: string): void {
        this.http.delete<void>(`${this.base}${TCG_ROUTES.adminCardById(id)}`).subscribe({
            next: () => this.loadAdminCards(),
            error: () => undefined
        });
    }

    loadAdminBoosters(): void {
        this.adminLoading.set(true);
        this.http.get<AdminBoosterDetail[]>(`${this.base}${TCG_ROUTES.adminBoosters()}`).subscribe({
            next: (data) => {
                this.adminBoosters.set(data);
                this.adminLoading.set(false);
            },
            error: () => this.adminLoading.set(false)
        });
    }

    createBooster(dto: CreateBoosterPackDto): void {
        this.adminSaving.set(true);
        this.http.post<BoosterPack>(`${this.base}${TCG_ROUTES.adminBoosters()}`, dto).subscribe({
            next: () => {
                this.adminSaving.set(false);
                this.loadAdminBoosters();
            },
            error: () => this.adminSaving.set(false)
        });
    }

    updateBooster(id: string, dto: Partial<CreateBoosterPackDto>): void {
        this.adminSaving.set(true);
        this.http.put<BoosterPack>(`${this.base}${TCG_ROUTES.adminBoosterById(id)}`, dto).subscribe({
            next: () => {
                this.adminSaving.set(false);
                this.loadAdminBoosters();
            },
            error: () => this.adminSaving.set(false)
        });
    }

    deleteBooster(id: string): void {
        this.http.delete<void>(`${this.base}${TCG_ROUTES.adminBoosterById(id)}`).subscribe({
            next: () => this.loadAdminBoosters(),
            error: () => undefined
        });
    }

    addCardToBooster(boosterId: string, cardId: string, dropWeight: number): void {
        this.adminSaving.set(true);
        this.http
            .post<void>(`${this.base}${TCG_ROUTES.adminBoosterCards(boosterId)}`, { cardId, dropWeight })
            .subscribe({
                next: () => {
                    this.adminSaving.set(false);
                    this.loadAdminBoosters();
                },
                error: () => this.adminSaving.set(false)
            });
    }

    removeCardFromBooster(boosterId: string, cardId: string): void {
        this.http.delete<void>(`${this.base}${TCG_ROUTES.adminBoosterCard(boosterId, cardId)}`).subscribe({
            next: () => this.loadAdminBoosters(),
            error: () => undefined
        });
    }

    updateBoosterCardWeight(boosterId: string, cardId: string, dropWeight: number): void {
        this.adminSaving.set(true);
        this.http
            .patch<void>(`${this.base}${TCG_ROUTES.adminBoosterCard(boosterId, cardId)}`, { dropWeight })
            .subscribe({
                next: () => {
                    this.adminSaving.set(false);
                    this.loadAdminBoosters();
                },
                error: () => this.adminSaving.set(false)
            });
    }
}
