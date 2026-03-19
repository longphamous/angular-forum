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
import { MultiSelectModule } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import type {
    AdminBoosterDetail,
    BoosterCategory,
    Card,
    CardRarity,
    CreateBoosterCategoryDto,
    CreateBoosterPackDto,
    CreateCardDto
} from "../../../core/models/tcg/tcg";
import { RARITY_CONFIG } from "../../../core/models/tcg/tcg";
import { TabPersistenceService } from "../../../core/services/tab-persistence.service";
import { TcgFacade } from "../../../facade/tcg/tcg-facade";

interface SelectOption<T> {
    label: string;
    value: T;
}

interface BoosterCardEntry {
    cardId: string;
    cardName: string;
    cardRarity: CardRarity;
    dropWeight: number;
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
        MultiSelectModule,
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
    boosterCardEntries: BoosterCardEntry[] = [];
    readonly boosterAddCardId = signal<string | null>(null);
    readonly boosterAddCardWeight = signal<number>(100);

    // Category dialog
    readonly showCategoryDialog = signal(false);
    readonly editingCategoryId = signal<string | null>(null);
    categoryForm: CreateBoosterCategoryDto = this.emptyCategoryForm();

    // Booster card management (existing boosters)
    readonly showBoosterCardDialog = signal(false);
    readonly managingBoosterId = signal<string | null>(null);
    readonly addCardId = signal<string | null>(null);
    readonly addCardWeight = signal<number>(100);

    // Editing booster card weight
    readonly editingBoosterCardId = signal<string | null>(null);
    readonly editingBoosterCardWeight = signal<number>(100);

    readonly rarityConfig = RARITY_CONFIG;

    readonly rarityOptions: SelectOption<CardRarity>[] = [
        { label: "Common", value: "common" },
        { label: "Uncommon", value: "uncommon" },
        { label: "Rare", value: "rare" },
        { label: "Epic", value: "epic" },
        { label: "Legendary", value: "legendary" },
        { label: "Mythic", value: "mythic" }
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
        this.tcgFacade.loadAdminCategories();
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
        this.boosterCardEntries = [];
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
            categoryId: booster.categoryId ?? undefined,
            availableFrom: booster.availableFrom ?? undefined,
            availableUntil: booster.availableUntil ?? undefined,
            maxPurchasesPerUser: booster.maxPurchasesPerUser ?? undefined,
            sortOrder: booster.sortOrder
        };
        this.boosterCardEntries = booster.cards.map((c) => ({
            cardId: c.cardId,
            cardName: c.cardName,
            cardRarity: c.cardRarity,
            dropWeight: c.dropWeight
        }));
        this.showBoosterDialog.set(true);
    }

    onSaveBooster(): void {
        const id = this.editingBoosterId();
        const dto = { ...this.boosterForm };

        if (!id) {
            dto.cards = this.boosterCardEntries.map((e) => ({
                cardId: e.cardId,
                dropWeight: e.dropWeight
            }));
            this.tcgFacade.createBooster(dto);
        } else {
            this.tcgFacade.updateBooster(id, dto);
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

    // ─── Booster Dialog Card Management ─────────────────────────────────────

    getAvailableCardsForBoosterDialog(): SelectOption<string>[] {
        const existingIds = new Set(this.boosterCardEntries.map((e) => e.cardId));
        return this.tcgFacade
            .adminCards()
            .filter((c) => !existingIds.has(c.id))
            .map((c) => ({ label: `${c.name} (${c.rarity})`, value: c.id }));
    }

    onAddCardToBoosterDialog(): void {
        const cardId = this.boosterAddCardId();
        if (!cardId) return;
        const card = this.tcgFacade.adminCards().find((c) => c.id === cardId);
        if (!card) return;
        this.boosterCardEntries = [
            ...this.boosterCardEntries,
            {
                cardId: card.id,
                cardName: card.name,
                cardRarity: card.rarity,
                dropWeight: this.boosterAddCardWeight()
            }
        ];
        this.boosterAddCardId.set(null);
        this.boosterAddCardWeight.set(100);
    }

    onRemoveCardFromBoosterDialog(cardId: string): void {
        this.boosterCardEntries = this.boosterCardEntries.filter((e) => e.cardId !== cardId);
    }

    // ─── Booster Card Management (existing boosters) ────────────────────────

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

    // ─── Category CRUD ───────────────────────────────────────────────────────

    onNewCategory(): void {
        this.editingCategoryId.set(null);
        this.categoryForm = this.emptyCategoryForm();
        this.showCategoryDialog.set(true);
    }

    onEditCategory(category: BoosterCategory): void {
        this.editingCategoryId.set(category.id);
        this.categoryForm = {
            name: category.name,
            description: category.description ?? undefined,
            icon: category.icon ?? undefined,
            sortOrder: category.sortOrder
        };
        this.showCategoryDialog.set(true);
    }

    onSaveCategory(): void {
        const id = this.editingCategoryId();
        if (id) {
            this.tcgFacade.updateCategory(id, this.categoryForm);
        } else {
            this.tcgFacade.createCategory(this.categoryForm);
        }
        this.showCategoryDialog.set(false);
    }

    onDeleteCategory(category: BoosterCategory, event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: `${category.name} wirklich löschen?`,
            accept: () => this.tcgFacade.deleteCategory(category.id)
        });
    }

    getCategoryOptions(): SelectOption<string | undefined>[] {
        return [
            { label: "-- None --", value: undefined },
            ...this.tcgFacade
                .adminCategories()
                .filter((c) => c.isActive)
                .map((c) => ({ label: c.name, value: c.id }))
        ];
    }

    getCategoryName(categoryId: string | null): string | null {
        if (!categoryId) return null;
        return this.tcgFacade.adminCategories().find((c) => c.id === categoryId)?.name ?? null;
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

    private emptyCategoryForm(): CreateBoosterCategoryDto {
        return {
            name: "",
            sortOrder: 0
        };
    }
}
