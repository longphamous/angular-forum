import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type { BoosterPack, Card, CardElement, CardRarity, UserCard } from "../../../core/models/tcg/tcg";
import { ELEMENT_CONFIG, RARITY_CONFIG } from "../../../core/models/tcg/tcg";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { TcgFacade } from "../../../facade/tcg/tcg-facade";
import { WalletFacade } from "../../../facade/wallet/wallet-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

type OwnershipFilter = "all" | "owned" | "notOwned";

interface SelectOption<T> {
    label: string;
    value: T;
}

@Component({
    selector: "app-tcg-page",
    standalone: true,
    imports: [
        AdminQuicklink,
        CommonModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        CardModule,
        DialogModule,
        InputNumberModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TabsModule,
        TagModule,
        TooltipModule
    ],
    templateUrl: "./tcg-page.html",
    styleUrl: "./tcg-page.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TcgPage implements OnInit {
    readonly tcgFacade = inject(TcgFacade);
    readonly walletFacade = inject(WalletFacade);
    readonly authFacade = inject(AuthFacade);

    readonly activeTab = signal<string>("boosters");
    readonly showOpenDialog = signal(false);

    // Collection filters
    readonly filterSeries = signal<string | null>(null);
    readonly filterRarity = signal<CardRarity | null>(null);
    readonly filterElement = signal<CardElement | null>(null);
    readonly filterOwned = signal<OwnershipFilter>("all");

    // Sell form
    readonly sellCardId = signal<string | null>(null);
    readonly sellPrice = signal<number>(100);
    readonly sellQuantity = signal<number>(1);

    // Transfer form
    readonly showTransferDialog = signal(false);
    readonly transferCardId = signal<string | null>(null);
    readonly transferTargetUser = signal<string>("");
    readonly transferQuantity = signal<number>(1);

    // Rarity / Element configs
    readonly rarityConfig = RARITY_CONFIG;
    readonly elementConfig = ELEMENT_CONFIG;

    readonly rarityOptions: SelectOption<CardRarity | null>[] = [
        { label: "Alle", value: null },
        { label: "Gewöhnlich", value: "common" },
        { label: "Ungewöhnlich", value: "uncommon" },
        { label: "Selten", value: "rare" },
        { label: "Episch", value: "epic" },
        { label: "Legendär", value: "legendary" },
        { label: "Mythisch", value: "mythic" }
    ];

    readonly elementOptions: SelectOption<CardElement | null>[] = [
        { label: "Alle", value: null },
        { label: "Feuer", value: "fire" },
        { label: "Wasser", value: "water" },
        { label: "Erde", value: "earth" },
        { label: "Wind", value: "wind" },
        { label: "Licht", value: "light" },
        { label: "Dunkel", value: "dark" },
        { label: "Neutral", value: "neutral" }
    ];

    readonly ownershipOptions: SelectOption<OwnershipFilter>[] = [
        { label: "Alle", value: "all" },
        { label: "Im Besitz", value: "owned" },
        { label: "Nicht im Besitz", value: "notOwned" }
    ];

    // Series options computed from cards
    readonly seriesOptions = computed<SelectOption<string | null>[]>(() => {
        const cards = this.tcgFacade.cards();
        const seriesSet = new Set(cards.map((c) => c.series));
        const options: SelectOption<string | null>[] = [{ label: "Alle", value: null }];
        seriesSet.forEach((s) => options.push({ label: s, value: s }));
        return options;
    });

    // Collection map for quick lookup
    private readonly collectionMap = computed<Map<string, UserCard>>(() => {
        const map = new Map<string, UserCard>();
        for (const uc of this.tcgFacade.collection()) {
            map.set(uc.cardId, uc);
        }
        return map;
    });

    // Owned cards for sell select
    readonly ownedCards = computed<SelectOption<string>[]>(() => {
        return this.tcgFacade
            .collection()
            .filter((uc) => uc.quantity > 0)
            .map((uc) => ({
                label: `${uc.card.name} (x${uc.quantity})`,
                value: uc.cardId
            }));
    });

    // Filtered cards for collection view
    readonly filteredCards = computed<(Card & { userCard: UserCard | null })[]>(() => {
        const allCards = this.tcgFacade.cards();
        const colMap = this.collectionMap();
        const series = this.filterSeries();
        const rarity = this.filterRarity();
        const element = this.filterElement();
        const owned = this.filterOwned();

        return allCards
            .filter((card) => {
                if (series && card.series !== series) return false;
                if (rarity && card.rarity !== rarity) return false;
                if (element && card.element !== element) return false;
                const uc = colMap.get(card.id);
                if (owned === "owned" && (!uc || uc.quantity === 0)) return false;
                if (owned === "notOwned" && uc && uc.quantity > 0) return false;
                return true;
            })
            .map((card) => ({
                ...card,
                userCard: colMap.get(card.id) ?? null
            }));
    });

    // Current user's listings
    readonly myListings = computed(() => {
        const userId = this.authFacade.currentUser()?.id;
        if (!userId) return [];
        return this.tcgFacade.listings().filter((l) => l.userId === userId && l.status === "active");
    });

    // Other users' listings
    readonly otherListings = computed(() => {
        const userId = this.authFacade.currentUser()?.id;
        return this.tcgFacade.listings().filter((l) => l.userId !== userId && l.status === "active");
    });

    ngOnInit(): void {
        this.walletFacade.loadWallet();
        this.tcgFacade.loadBoosters();
        this.tcgFacade.loadCards();
        this.tcgFacade.loadCollection();
        this.tcgFacade.loadProgress();
        this.tcgFacade.loadInventory();
        this.tcgFacade.loadListings();
    }

    onBuyBooster(booster: BoosterPack): void {
        this.tcgFacade.buyBooster(booster.id);
        this.walletFacade.loadWallet();
    }

    onOpenBooster(boosterId: string): void {
        this.tcgFacade.openBooster(boosterId);
        this.showOpenDialog.set(true);
    }

    onCloseOpenDialog(): void {
        this.showOpenDialog.set(false);
        this.tcgFacade.openResult.set(null);
    }

    onToggleFavorite(cardId: string): void {
        this.tcgFacade.toggleFavorite(cardId);
    }

    onCreateListing(): void {
        const cardId = this.sellCardId();
        if (!cardId) return;
        this.tcgFacade.createListing(cardId, this.sellPrice(), this.sellQuantity());
        this.sellCardId.set(null);
        this.sellPrice.set(100);
        this.sellQuantity.set(1);
    }

    onCancelListing(id: string): void {
        this.tcgFacade.cancelListing(id);
    }

    onBuyListing(id: string): void {
        this.tcgFacade.buyListing(id);
        this.walletFacade.loadWallet();
    }

    onTransfer(): void {
        const cardId = this.transferCardId();
        const target = this.transferTargetUser();
        if (!cardId || !target) return;
        this.tcgFacade.transferCard(cardId, target, this.transferQuantity());
        this.showTransferDialog.set(false);
        this.transferCardId.set(null);
        this.transferTargetUser.set("");
        this.transferQuantity.set(1);
    }

    openTransferDialog(cardId: string): void {
        this.transferCardId.set(cardId);
        this.showTransferDialog.set(true);
    }

    getRaritySeverity(rarity: CardRarity): "success" | "info" | "warn" | "secondary" | "contrast" | "danger" {
        return (RARITY_CONFIG[rarity]?.severity ?? "secondary") as
            | "success"
            | "info"
            | "warn"
            | "secondary"
            | "contrast"
            | "danger";
    }

    getRarityColor(rarity: CardRarity): string {
        return RARITY_CONFIG[rarity]?.color ?? "#9ca3af";
    }

    getElementIcon(element: CardElement | null): string {
        if (!element) return "";
        return ELEMENT_CONFIG[element]?.icon ?? "";
    }

    getElementColor(element: CardElement | null): string {
        if (!element) return "#94a3b8";
        return ELEMENT_CONFIG[element]?.color ?? "#94a3b8";
    }

    isNewCard(cardId: string): boolean {
        const result = this.tcgFacade.openResult();
        if (!result) return false;
        return result.newCards.includes(cardId);
    }

    isBoosterAvailable(booster: BoosterPack): boolean {
        const now = new Date().toISOString();
        if (booster.availableFrom && now < booster.availableFrom) return false;
        if (booster.availableUntil && now > booster.availableUntil) return false;
        if (
            booster.maxPurchasesPerUser !== null &&
            booster.userPurchases !== undefined &&
            booster.userPurchases >= booster.maxPurchasesPerUser
        ) {
            return false;
        }
        return true;
    }

    getBoosterStatusKey(booster: BoosterPack): string | null {
        if (
            booster.maxPurchasesPerUser !== null &&
            booster.userPurchases !== undefined &&
            booster.userPurchases >= booster.maxPurchasesPerUser
        ) {
            return "tcg.booster.maxReached";
        }
        const now = new Date().toISOString();
        if (booster.availableUntil && now > booster.availableUntil) {
            return "tcg.booster.soldOut";
        }
        return null;
    }

    protected relativeTime(iso: string): string {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60_000);
        const hours = Math.floor(diff / 3_600_000);
        if (diff < 60_000) return "gerade eben";
        if (mins < 60) return `vor ${mins} Min.`;
        if (hours < 24) return `vor ${hours} Std.`;
        return `vor ${Math.floor(hours / 24)} Tag(en)`;
    }
}
