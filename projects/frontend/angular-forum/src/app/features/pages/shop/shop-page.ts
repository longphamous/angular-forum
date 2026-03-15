import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { SelectButtonModule } from "primeng/selectbutton";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { SHOP_ROUTES } from "../../../core/api/shop.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { ShopItem, UserInventoryItem } from "../../../core/models/shop/shop";
import { WalletFacade } from "../../../facade/wallet/wallet-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        BadgeModule,
        ButtonModule,
        CardModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        MessageModule,
        SelectButtonModule,
        SkeletonModule,
        TagModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService, MessageService],
    selector: "app-shop-page",
    template: `
        <p-toast />
        <p-confirmDialog />

        <div class="mx-auto max-w-5xl" *transloco="let t">
            <!-- Header -->
            <div class="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="text-surface-900 dark:text-surface-0 flex items-center gap-2 text-2xl font-bold">
                        <i class="pi pi-shopping-bag text-primary"></i>
                        {{ t("shop.title") }}
                    </h1>
                    <p class="text-surface-500 mt-1 text-sm">{{ t("shop.subtitle") }}</p>
                </div>
                @if (walletFacade.wallet()) {
                    <div
                        class="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 dark:border-yellow-800 dark:bg-yellow-900/20"
                    >
                        <i class="pi pi-wallet text-yellow-500"></i>
                        <span class="text-lg font-bold text-yellow-700 dark:text-yellow-300">{{
                            walletFacade.wallet()!.balance
                        }}</span>
                        <span class="text-sm text-yellow-600 dark:text-yellow-400">{{ t("wallet.currency") }}</span>
                    </div>
                }
            </div>

            <!-- Category filter -->
            @if (categories().length > 1) {
                <div class="mb-5 flex flex-wrap gap-2">
                    <button
                        class="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
                        [class.bg-primary]="selectedCategory() === null"
                        [class.border-primary]="selectedCategory() === null"
                        [class.border-surface-200]="selectedCategory() !== null"
                        [class.dark:border-surface-700]="selectedCategory() !== null"
                        [class.dark:text-surface-400]="selectedCategory() !== null"
                        [class.text-surface-600]="selectedCategory() !== null"
                        [class.text-white]="selectedCategory() === null"
                        (click)="selectedCategory.set(null)"
                    >
                        {{ t("shop.allCategories") }}
                    </button>
                    @for (cat of categories(); track cat) {
                        <button
                            class="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
                            [class.bg-primary]="selectedCategory() === cat"
                            [class.border-primary]="selectedCategory() === cat"
                            [class.border-surface-200]="selectedCategory() !== cat"
                            [class.dark:border-surface-700]="selectedCategory() !== cat"
                            [class.dark:text-surface-400]="selectedCategory() !== cat"
                            [class.text-surface-600]="selectedCategory() !== cat"
                            [class.text-white]="selectedCategory() === cat"
                            (click)="selectedCategory.set(cat)"
                        >
                            {{ cat }}
                        </button>
                    }
                </div>
            }

            <!-- Items grid -->
            @if (loading()) {
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @for (_ of skeletons; track $index) {
                        <p-skeleton height="14rem" styleClass="rounded-xl" />
                    }
                </div>
            } @else if (filteredItems().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 text-center">
                    <i class="pi pi-shopping-bag text-surface-300 mb-4 text-5xl"></i>
                    <p class="text-surface-500 text-sm">{{ t("shop.empty") }}</p>
                </div>
            } @else {
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @for (item of filteredItems(); track item.id) {
                        <div
                            class="bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-lg"
                        >
                            <!-- Image -->
                            @if (item.imageUrl) {
                                <div class="h-36 overflow-hidden">
                                    <img class="h-full w-full object-cover" [alt]="item.name" [src]="item.imageUrl" />
                                </div>
                            } @else {
                                <div class="bg-primary/10 flex h-36 items-center justify-center">
                                    <i [class]="'text-primary text-4xl ' + (item.icon || 'pi pi-star')"></i>
                                </div>
                            }

                            <!-- Content -->
                            <div class="flex flex-1 flex-col gap-3 p-4">
                                <div class="flex items-start justify-between gap-2">
                                    <div>
                                        <h3
                                            class="text-surface-900 dark:text-surface-0 text-sm leading-snug font-semibold"
                                        >
                                            {{ item.name }}
                                        </h3>
                                        @if (item.category) {
                                            <span class="text-surface-400 text-xs">{{ item.category }}</span>
                                        }
                                    </div>
                                    @if (item.stock !== null) {
                                        <p-tag
                                            [severity]="item.stock > 5 ? 'success' : item.stock > 0 ? 'warn' : 'danger'"
                                            [value]="
                                                item.stock === 0
                                                    ? t('shop.outOfStock')
                                                    : t('shop.inStock', { count: item.stock })
                                            "
                                            styleClass="text-xs whitespace-nowrap"
                                        />
                                    }
                                </div>

                                @if (item.description) {
                                    <p class="text-surface-500 dark:text-surface-400 flex-1 text-xs leading-relaxed">
                                        {{ item.description }}
                                    </p>
                                }

                                <div
                                    class="border-surface-100 dark:border-surface-800 mt-auto flex items-center justify-between border-t pt-2"
                                >
                                    <div class="flex items-center gap-1.5">
                                        <i class="pi pi-wallet text-sm text-yellow-500"></i>
                                        <span class="font-bold text-yellow-600 dark:text-yellow-400">{{
                                            item.price
                                        }}</span>
                                        <span class="text-surface-400 text-xs">{{ t("wallet.currency") }}</span>
                                    </div>
                                    <p-button
                                        [disabled]="item.stock === 0 || buying() === item.id"
                                        [label]="t('shop.buyBtn')"
                                        [loading]="buying() === item.id"
                                        (click)="confirmPurchase(item)"
                                        icon="pi pi-shopping-cart"
                                        size="small"
                                    />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- Purchase confirm dialog -->
            <p-dialog
                [(visible)]="confirmVisible"
                [closable]="true"
                [header]="t('shop.confirmTitle')"
                [modal]="true"
                [style]="{ width: '24rem' }"
            >
                @if (selectedItem()) {
                    <div class="flex flex-col gap-4">
                        <p class="text-surface-700 dark:text-surface-300 text-sm">
                            {{ t("shop.confirmMsg", { name: selectedItem()!.name, price: selectedItem()!.price }) }}
                        </p>
                        @if (purchaseError()) {
                            <p-message [text]="purchaseError()!" severity="error" styleClass="w-full" />
                        }
                        <div class="flex justify-end gap-2">
                            <p-button
                                [label]="t('common.cancel')"
                                (click)="confirmVisible = false; purchaseError.set(null)"
                                severity="secondary"
                            />
                            <p-button
                                [label]="t('shop.buyBtn')"
                                [loading]="buying() === selectedItem()?.id"
                                (click)="executePurchase()"
                                icon="pi pi-shopping-cart"
                            />
                        </div>
                    </div>
                }
            </p-dialog>
        </div>
    `
})
export class ShopPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    protected readonly walletFacade = inject(WalletFacade);

    protected readonly loading = signal(true);
    protected readonly items = signal<ShopItem[]>([]);
    protected readonly selectedCategory = signal<string | null>(null);
    protected readonly buying = signal<string | null>(null);
    protected readonly purchaseError = signal<string | null>(null);
    protected confirmVisible = false;
    protected readonly selectedItem = signal<ShopItem | null>(null);

    protected readonly skeletons = [1, 2, 3, 4, 5, 6];

    protected readonly categories = computed(() => {
        const cats = [
            ...new Set(
                this.items()
                    .map((i) => i.category)
                    .filter((c): c is string => c !== null)
            )
        ];
        return cats.sort();
    });

    protected readonly filteredItems = computed(() => {
        const cat = this.selectedCategory();
        if (cat === null) return this.items();
        return this.items().filter((i) => i.category === cat);
    });

    private readonly messageService = inject(MessageService);

    ngOnInit(): void {
        this.load();
        this.walletFacade.loadWallet();
    }

    protected confirmPurchase(item: ShopItem): void {
        this.selectedItem.set(item);
        this.purchaseError.set(null);
        this.confirmVisible = true;
    }

    protected executePurchase(): void {
        const item = this.selectedItem();
        if (!item) return;
        this.buying.set(item.id);
        this.purchaseError.set(null);
        const url = `${this.apiConfig.baseUrl}${SHOP_ROUTES.purchase(item.id)}`;
        this.http.post(url, {}).subscribe({
            next: () => {
                this.buying.set(null);
                this.confirmVisible = false;
                this.walletFacade.loadWallet();
                this.load();
                this.messageService.add({
                    severity: "success",
                    summary: "Erfolg",
                    detail: `${item.name} gekauft!`,
                    life: 3000
                });
            },
            error: (err: { error?: { message?: string } }) => {
                this.buying.set(null);
                this.purchaseError.set(err?.error?.message ?? "Kauf fehlgeschlagen");
            }
        });
    }

    private load(): void {
        this.loading.set(true);
        this.http.get<ShopItem[]>(`${this.apiConfig.baseUrl}${SHOP_ROUTES.active()}`).subscribe({
            next: (data) => {
                this.items.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
