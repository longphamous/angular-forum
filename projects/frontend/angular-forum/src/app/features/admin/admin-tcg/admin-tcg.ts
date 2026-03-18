
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { TabPersistenceService } from "../../../core/services/tab-persistence.service";
import type {
    AdminBoosterDetail,
    Card,
    CardElement,
    CardRarity,
    CreateBoosterPackDto,
    CreateCardDto
} from "../../../core/models/tcg/tcg";
import { ELEMENT_CONFIG, RARITY_CONFIG } from "../../../core/models/tcg/tcg";
import { TcgFacade } from "../../../facade/tcg/tcg-facade";

interface SelectOption<T> {
    label: string;
    value: T;
}

@Component({
    selector: "app-admin-tcg",
    standalone: true,
    imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TabsModule,
    TagModule,
    TooltipModule
],
    providers: [ConfirmationService],
    templateUrl: "./admin-tcg.html",
    styleUrl: "./admin-tcg.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTcg implements OnInit {
    readonly tcgFacade = inject(TcgFacade);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly tabService = inject(TabPersistenceService);

    readonly activeTab = signal<string>(this.tabService.get("cards"));

    // Card dialog
    readonly showCardDialog = signal(false);
    readonly editingCardId = signal<string | null>(null);
    cardForm: CreateCardDto = this.emptyCardForm();

    // Booster dialog
    readonly showBoosterDialog = signal(false);
    readonly editingBoosterId = signal<string | null>(null);
    boosterForm: CreateBoosterPackDto = this.emptyBoosterForm();

    // Booster card management
    readonly showBoosterCardDialog = signal(false);
    readonly managingBoosterId = signal<string | null>(null);
    readonly addCardId = signal<string | null>(null);
    readonly addCardWeight = signal<number>(100);

    // Editing booster card weight
    readonly editingBoosterCardId = signal<string | null>(null);
    readonly editingBoosterCardWeight = signal<number>(100);

    readonly rarityConfig = RARITY_CONFIG;
    readonly elementConfig = ELEMENT_CONFIG;

    readonly rarityOptions: SelectOption<CardRarity>[] = [
        { label: "Common", value: "common" },
        { label: "Uncommon", value: "uncommon" },
        { label: "Rare", value: "rare" },
        { label: "Epic", value: "epic" },
        { label: "Legendary", value: "legendary" },
        { label: "Mythic", value: "mythic" }
    ];

    readonly elementOptions: SelectOption<CardElement | undefined>[] = [
        { label: "-- None --", value: undefined },
        { label: "Fire", value: "fire" },
        { label: "Water", value: "water" },
        { label: "Earth", value: "earth" },
        { label: "Wind", value: "wind" },
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "Neutral", value: "neutral" }
    ];

    readonly guaranteedRarityOptions: SelectOption<CardRarity | undefined>[] = [
        { label: "-- None --", value: undefined },
        ...this.rarityOptions
    ];

    onTabChange(tab: string): void {
        this.activeTab.set(tab);
        this.tabService.set(tab);
    }

    ngOnInit(): void {
        this.tcgFacade.loadAdminCards();
        this.tcgFacade.loadAdminBoosters();
    }

    // ─── Card CRUD ───────────────────────────────────────────────────────────

    onNewCard(): void {
        this.editingCardId.set(null);
        this.cardForm = this.emptyCardForm();
        this.showCardDialog.set(true);
    }

    onEditCard(card: Card): void {
        this.editingCardId.set(card.id);
        this.cardForm = {
            name: card.name,
            description: card.description ?? undefined,
            imageUrl: card.imageUrl ?? undefined,
            rarity: card.rarity,
            series: card.series,
            element: card.element ?? undefined,
            attack: card.attack,
            defense: card.defense,
            hp: card.hp,
            artistCredit: card.artistCredit ?? undefined,
            flavorText: card.flavorText ?? undefined,
            sortOrder: card.sortOrder
        };
        this.showCardDialog.set(true);
    }

    onSaveCard(): void {
        const id = this.editingCardId();
        if (id) {
            this.tcgFacade.updateCard(id, this.cardForm);
        } else {
            this.tcgFacade.createCard(this.cardForm);
        }
        this.showCardDialog.set(false);
    }

    onDeleteCard(card: Card, event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: `${card.name} wirklich löschen?`,
            accept: () => this.tcgFacade.deleteCard(card.id)
        });
    }

    // ─── Booster CRUD ────────────────────────────────────────────────────────

    onNewBooster(): void {
        this.editingBoosterId.set(null);
        this.boosterForm = this.emptyBoosterForm();
        this.showBoosterDialog.set(true);
    }

    onEditBooster(booster: AdminBoosterDetail): void {
        this.editingBoosterId.set(booster.id);
        this.boosterForm = {
            name: booster.name,
            description: booster.description ?? undefined,
            imageUrl: booster.imageUrl ?? undefined,
            price: booster.price,
            cardsPerPack: booster.cardsPerPack,
            guaranteedRarity: booster.guaranteedRarity ?? undefined,
            series: booster.series,
            availableFrom: booster.availableFrom ?? undefined,
            availableUntil: booster.availableUntil ?? undefined,
            maxPurchasesPerUser: booster.maxPurchasesPerUser ?? undefined,
            sortOrder: booster.sortOrder
        };
        this.showBoosterDialog.set(true);
    }

    onSaveBooster(): void {
        const id = this.editingBoosterId();
        if (id) {
            this.tcgFacade.updateBooster(id, this.boosterForm);
        } else {
            this.tcgFacade.createBooster(this.boosterForm);
        }
        this.showBoosterDialog.set(false);
    }

    onDeleteBooster(booster: AdminBoosterDetail, event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: `${booster.name} wirklich löschen?`,
            accept: () => this.tcgFacade.deleteBooster(booster.id)
        });
    }

    // ─── Booster Card Management ─────────────────────────────────────────────

    onManageBoosterCards(booster: AdminBoosterDetail): void {
        this.managingBoosterId.set(booster.id);
        this.addCardId.set(null);
        this.addCardWeight.set(100);
        this.editingBoosterCardId.set(null);
    }

    onCloseManageCards(): void {
        this.managingBoosterId.set(null);
    }

    getManagedBooster(): AdminBoosterDetail | null {
        const id = this.managingBoosterId();
        if (!id) return null;
        return this.tcgFacade.adminBoosters().find((b) => b.id === id) ?? null;
    }

    getAvailableCardsForBooster(): SelectOption<string>[] {
        const booster = this.getManagedBooster();
        if (!booster) return [];
        const existingIds = new Set(booster.cards.map((c) => c.cardId));
        return this.tcgFacade
            .adminCards()
            .filter((c) => !existingIds.has(c.id))
            .map((c) => ({ label: `${c.name} (${c.rarity})`, value: c.id }));
    }

    onAddCardToBooster(): void {
        const boosterId = this.managingBoosterId();
        const cardId = this.addCardId();
        if (!boosterId || !cardId) return;
        this.tcgFacade.addCardToBooster(boosterId, cardId, this.addCardWeight());
        this.addCardId.set(null);
        this.addCardWeight.set(100);
    }

    onRemoveCardFromBooster(cardId: string): void {
        const boosterId = this.managingBoosterId();
        if (!boosterId) return;
        this.tcgFacade.removeCardFromBooster(boosterId, cardId);
    }

    onEditBoosterCardWeight(cardId: string, currentWeight: number): void {
        this.editingBoosterCardId.set(cardId);
        this.editingBoosterCardWeight.set(currentWeight);
    }

    onSaveBoosterCardWeight(): void {
        const boosterId = this.managingBoosterId();
        const cardId = this.editingBoosterCardId();
        if (!boosterId || !cardId) return;
        this.tcgFacade.updateBoosterCardWeight(boosterId, cardId, this.editingBoosterCardWeight());
        this.editingBoosterCardId.set(null);
    }

    onCancelEditWeight(): void {
        this.editingBoosterCardId.set(null);
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

    getElementInfo(element: string | null): { icon: string; color: string; label: string } | null {
        if (!element) return null;
        return ELEMENT_CONFIG[element as CardElement] ?? null;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private emptyCardForm(): CreateCardDto {
        return {
            name: "",
            rarity: "common",
            series: "",
            attack: 0,
            defense: 0,
            hp: 0,
            sortOrder: 0
        };
    }

    private emptyBoosterForm(): CreateBoosterPackDto {
        return {
            name: "",
            price: 100,
            series: "",
            cardsPerPack: 5,
            sortOrder: 0
        };
    }
}
