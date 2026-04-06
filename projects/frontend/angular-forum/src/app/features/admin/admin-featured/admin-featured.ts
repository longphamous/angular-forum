import { SlicePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ColorPickerModule } from "primeng/colorpicker";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import {
    CreateFeaturedItemPayload,
    FeaturedItem,
    FeaturedSection,
    FeaturedSourceType
} from "../../../core/models/storefront/featured-item";
import { type SourceItem, StorefrontFacade } from "../../../facade/storefront/storefront-facade";

export interface FeaturedFormData {
    section: FeaturedSection;
    sourceType: FeaturedSourceType;
    sourceId: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    badgeText: string;
    badgeColor: string;
    originalPrice: number | null;
    discountPrice: number | null;
    sortOrder: number;
    isActive: boolean;
    validFrom: string;
    validUntil: string;
}

const EMPTY_FORM: FeaturedFormData = {
    section: "featured",
    sourceType: "custom",
    sourceId: "",
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    badgeText: "",
    badgeColor: "#3B82F6",
    originalPrice: null,
    discountPrice: null,
    sortOrder: 0,
    isActive: true,
    validFrom: "",
    validUntil: ""
};

@Component({
    selector: "admin-featured",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SlicePipe,
        ButtonModule,
        ColorPickerModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService],
    template: `
        <div class="flex flex-col gap-6" *transloco="let t">
            <p-confirmdialog />

            <!-- Header -->
            <div class="card">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="m-0 text-2xl font-bold">{{ t("storefront.adminTitle") }}</h2>
                    </div>
                    <p-button [label]="t('storefront.addItem')" (onClick)="openCreate()" icon="pi pi-plus" />
                </div>
            </div>

            @if (error()) {
                <p-message [text]="error()!" severity="error" styleClass="w-full" />
            }
            @if (successMsg()) {
                <p-message [text]="successMsg()!" severity="success" styleClass="w-full" />
            }

            <!-- Table -->
            <div class="card">
                @if (facade.loading()) {
                    <div class="flex flex-col gap-3">
                        @for (_ of [1, 2, 3]; track $index) {
                            <p-skeleton height="4rem" />
                        }
                    </div>
                } @else {
                    <p-table [value]="facade.allItems()" styleClass="p-datatable-sm">
                        <ng-template #header>
                            <tr>
                                <th>{{ t("common.title") }}</th>
                                <th class="w-28">{{ t("storefront.section") }}</th>
                                <th class="w-28">{{ t("storefront.sourceType") }}</th>
                                <th class="w-24">{{ t("storefront.badge") }}</th>
                                <th class="hidden w-32 md:table-cell">{{ t("storefront.originalPrice") }}</th>
                                <th class="hidden w-32 md:table-cell">{{ t("storefront.discountPrice") }}</th>
                                <th class="w-24 text-center">{{ t("common.status") }}</th>
                                <th class="w-28 text-right">{{ t("common.actions") }}</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-item>
                            <tr>
                                <td>
                                    <div class="flex items-center gap-2">
                                        @if (item.imageUrl) {
                                            <img
                                                class="h-10 w-16 rounded object-cover"
                                                [alt]="item.title"
                                                [src]="item.imageUrl"
                                                loading="lazy"
                                            />
                                        }
                                        <span class="font-medium">{{ item.title }}</span>
                                    </div>
                                </td>
                                <td>
                                    <p-tag
                                        [severity]="
                                            item.section === 'featured'
                                                ? 'info'
                                                : item.section === 'discount'
                                                  ? 'warn'
                                                  : 'secondary'
                                        "
                                        [value]="t('storefront.sections.' + item.section)"
                                    />
                                </td>
                                <td>{{ t("storefront.sources." + item.sourceType) }}</td>
                                <td>
                                    @if (item.badgeText) {
                                        <span
                                            class="rounded px-1.5 py-0.5 text-xs font-bold text-white"
                                            [style.background]="item.badgeColor ?? '#3B82F6'"
                                            >{{ item.badgeText }}</span
                                        >
                                    } @else {
                                        <span class="text-surface-300">—</span>
                                    }
                                </td>
                                <td class="hidden md:table-cell">
                                    {{ item.originalPrice != null ? item.originalPrice : "—" }}
                                </td>
                                <td class="hidden md:table-cell">
                                    @if (item.discountPrice != null) {
                                        <span class="font-bold text-green-600">{{
                                            item.discountPrice === 0 ? t("storefront.free") : item.discountPrice
                                        }}</span>
                                    } @else {
                                        <span class="text-surface-300">—</span>
                                    }
                                </td>
                                <td class="text-center">
                                    @if (item.isActive) {
                                        <p-tag [value]="t('common.active')" severity="success" />
                                    } @else {
                                        <p-tag [value]="t('common.inactive')" severity="secondary" />
                                    }
                                </td>
                                <td class="text-right">
                                    <div class="flex justify-end gap-1">
                                        <p-button
                                            [pTooltip]="t('common.edit')"
                                            (onClick)="openEdit(item)"
                                            icon="pi pi-pencil"
                                            severity="secondary"
                                            size="small"
                                            tooltipPosition="top"
                                        />
                                        <p-button
                                            [pTooltip]="t('common.delete')"
                                            (onClick)="confirmDelete(item)"
                                            icon="pi pi-trash"
                                            severity="danger"
                                            size="small"
                                            tooltipPosition="top"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr>
                                <td class="text-surface-500 py-8 text-center" colspan="8">
                                    {{ t("storefront.noItems") }}
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                }
            </div>

            <!-- Create / Edit Dialog -->
            <p-dialog
                [closable]="true"
                [header]="editingId() ? t('storefront.editItem') : t('storefront.addItem')"
                [modal]="true"
                [style]="{ width: '640px', maxWidth: '95vw' }"
                [visible]="dialogVisible()"
                (visibleChange)="dialogVisible.set($event)"
            >
                <div class="flex flex-col gap-4 pt-3">
                    <div class="grid grid-cols-2 gap-4">
                        <!-- Section -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-section">{{ t("storefront.section") }}</label>
                            <p-select
                                [ngModel]="form().section"
                                [options]="sectionOptions"
                                (ngModelChange)="updateForm({ section: $event })"
                                inputId="fi-section"
                                optionLabel="label"
                                optionValue="value"
                                styleClass="w-full"
                            />
                        </div>

                        <!-- Source Type -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-sourceType">{{
                                t("storefront.sourceType")
                            }}</label>
                            <p-select
                                [ngModel]="form().sourceType"
                                [options]="sourceOptions"
                                (ngModelChange)="onSourceTypeChange($event)"
                                inputId="fi-sourceType"
                                optionLabel="label"
                                optionValue="value"
                                styleClass="w-full"
                            />
                        </div>
                    </div>

                    <!-- Source Item Picker (shows for non-custom types) -->
                    @if (form().sourceType !== "custom" && facade.sourceItems().length > 0) {
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium">{{ t("storefront.selectSourceItem") }}</label>
                            <p-select
                                [filter]="true"
                                [ngModel]="form().sourceId"
                                [options]="facade.sourceItems()"
                                [placeholder]="t('storefront.selectSourceItemHint')"
                                [showClear]="true"
                                (ngModelChange)="onSourceItemSelect($event)"
                                filterBy="name"
                                optionLabel="name"
                                optionValue="id"
                                styleClass="w-full"
                            />
                        </div>
                    }
                    @if (form().sourceType !== "custom" && facade.sourceItems().length === 0) {
                        <div class="text-surface-400 flex items-center gap-2 text-sm">
                            <i class="pi pi-info-circle"></i> {{ t("storefront.loadingSourceItems") }}
                        </div>
                    }

                    <!-- Title -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium" for="fi-title">{{ t("common.title") }} *</label>
                        <input
                            class="w-full"
                            id="fi-title"
                            [ngModel]="form().title"
                            (ngModelChange)="updateForm({ title: $event })"
                            pInputText
                        />
                    </div>

                    <!-- Description -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium" for="fi-description">{{ t("common.description") }}</label>
                        <textarea
                            class="w-full"
                            id="fi-description"
                            [ngModel]="form().description"
                            (ngModelChange)="updateForm({ description: $event })"
                            pTextarea
                            rows="2"
                        ></textarea>
                    </div>

                    <!-- Image URL -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium" for="fi-imageUrl">{{ t("storefront.imageUrl") }}</label>
                        <input
                            class="w-full"
                            id="fi-imageUrl"
                            [ngModel]="form().imageUrl"
                            (ngModelChange)="updateForm({ imageUrl: $event })"
                            pInputText
                        />
                        @if (form().imageUrl) {
                            <img
                                class="mt-2 h-24 w-full rounded-xl object-cover shadow"
                                [src]="form().imageUrl"
                                alt="Preview"
                            />
                        }
                    </div>

                    <!-- Link URL -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium" for="fi-linkUrl">{{ t("storefront.linkUrl") }}</label>
                        <input
                            class="w-full"
                            id="fi-linkUrl"
                            [ngModel]="form().linkUrl"
                            (ngModelChange)="updateForm({ linkUrl: $event })"
                            pInputText
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <!-- Badge Text -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-badgeText">{{ t("storefront.badge") }}</label>
                            <input
                                class="w-full"
                                id="fi-badgeText"
                                [ngModel]="form().badgeText"
                                (ngModelChange)="updateForm({ badgeText: $event })"
                                pInputText
                            />
                        </div>

                        <!-- Badge Color -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium">{{ t("storefront.badgeColor") }}</label>
                            <div class="flex items-center gap-2">
                                <p-colorpicker
                                    [ngModel]="form().badgeColor.replace('#', '')"
                                    (ngModelChange)="updateForm({ badgeColor: '#' + $event })"
                                />
                                <input
                                    class="flex-1"
                                    [ngModel]="form().badgeColor"
                                    (ngModelChange)="updateForm({ badgeColor: $event })"
                                    pInputText
                                />
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <!-- Original Price -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-originalPrice">{{
                                t("storefront.originalPrice")
                            }}</label>
                            <p-inputnumber
                                [maxFractionDigits]="2"
                                [minFractionDigits]="0"
                                [ngModel]="form().originalPrice"
                                (ngModelChange)="updateForm({ originalPrice: $event })"
                                inputId="fi-originalPrice"
                                mode="decimal"
                                styleClass="w-full"
                            />
                        </div>

                        <!-- Discount Price -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-discountPrice">{{
                                t("storefront.discountPrice")
                            }}</label>
                            <p-inputnumber
                                [maxFractionDigits]="2"
                                [minFractionDigits]="0"
                                [ngModel]="form().discountPrice"
                                (ngModelChange)="updateForm({ discountPrice: $event })"
                                inputId="fi-discountPrice"
                                mode="decimal"
                                styleClass="w-full"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <!-- Sort Order -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-sortOrder">{{
                                t("adminSlideshow.dialog.sortOrder")
                            }}</label>
                            <p-inputnumber
                                [max]="999"
                                [min]="0"
                                [ngModel]="form().sortOrder"
                                [showButtons]="true"
                                (ngModelChange)="updateForm({ sortOrder: $event ?? 0 })"
                                buttonLayout="horizontal"
                                decrementButtonIcon="pi pi-minus"
                                incrementButtonIcon="pi pi-plus"
                                inputId="fi-sortOrder"
                                inputStyleClass="w-16 text-center"
                                styleClass="w-full"
                            />
                        </div>

                        <!-- Active -->
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium">{{ t("common.status") }}</label>
                            <p-select
                                [ngModel]="form().isActive"
                                [options]="activeOptions"
                                (ngModelChange)="updateForm({ isActive: $event })"
                                optionLabel="label"
                                optionValue="value"
                                styleClass="w-full"
                            />
                        </div>
                    </div>

                    <!-- Validity period -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-validFrom">{{
                                t("adminSlideshow.dialog.validFrom")
                            }}</label>
                            <input
                                class="w-full"
                                id="fi-validFrom"
                                [ngModel]="form().validFrom"
                                (ngModelChange)="updateForm({ validFrom: $event })"
                                pInputText
                                type="date"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-sm font-medium" for="fi-validUntil">{{
                                t("adminSlideshow.dialog.validUntil")
                            }}</label>
                            <input
                                class="w-full"
                                id="fi-validUntil"
                                [ngModel]="form().validUntil"
                                (ngModelChange)="updateForm({ validUntil: $event })"
                                pInputText
                                type="date"
                            />
                        </div>
                    </div>
                </div>

                <ng-template #footer>
                    <div class="flex justify-end gap-2 pt-2">
                        <p-button
                            [label]="t('common.cancel')"
                            (onClick)="dialogVisible.set(false)"
                            severity="secondary"
                        />
                        <p-button
                            [disabled]="!form().title.trim()"
                            [label]="t('common.save')"
                            [loading]="saving()"
                            (onClick)="saveItem()"
                        />
                    </div>
                </ng-template>
            </p-dialog>
        </div>
    `
})
export class AdminFeatured implements OnInit {
    readonly facade = inject(StorefrontFacade);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translocoService = inject(TranslocoService);

    readonly dialogVisible = signal(false);
    readonly editingId = signal<string | null>(null);
    readonly form = signal<FeaturedFormData>({ ...EMPTY_FORM });
    readonly saving = signal(false);
    readonly error = signal<string | null>(null);
    readonly successMsg = signal<string | null>(null);

    readonly sectionOptions: { label: string; value: FeaturedSection }[] = [
        { label: "Featured", value: "featured" },
        { label: "Discount", value: "discount" },
        { label: "Event", value: "event" }
    ];

    readonly sourceOptions: { label: string; value: FeaturedSourceType }[] = [
        { label: "Shop", value: "shop" },
        { label: "Booster Pack", value: "booster" },
        { label: "Marketplace", value: "marketplace" },
        { label: "Custom", value: "custom" }
    ];

    readonly activeOptions = [
        { label: "Active", value: true },
        { label: "Inactive", value: false }
    ];

    ngOnInit(): void {
        this.facade.loadAll();
    }

    openCreate(): void {
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.error.set(null);
        this.successMsg.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(item: FeaturedItem): void {
        this.editingId.set(item.id);
        this.form.set({
            section: item.section,
            sourceType: item.sourceType,
            sourceId: item.sourceId ?? "",
            title: item.title,
            description: item.description ?? "",
            imageUrl: item.imageUrl ?? "",
            linkUrl: item.linkUrl ?? "",
            badgeText: item.badgeText ?? "",
            badgeColor: item.badgeColor ?? "#3B82F6",
            originalPrice: item.originalPrice ?? null,
            discountPrice: item.discountPrice ?? null,
            sortOrder: item.sortOrder,
            isActive: item.isActive,
            validFrom: item.validFrom ? item.validFrom.substring(0, 10) : "",
            validUntil: item.validUntil ? item.validUntil.substring(0, 10) : ""
        });
        this.error.set(null);
        this.successMsg.set(null);
        this.dialogVisible.set(true);
    }

    saveItem(): void {
        const f = this.form();
        if (!f.title.trim()) return;
        this.saving.set(true);
        this.error.set(null);

        const payload: CreateFeaturedItemPayload & { isActive?: boolean } = {
            section: f.section,
            sourceType: f.sourceType,
            sourceId: f.sourceId || undefined,
            title: f.title,
            description: f.description || undefined,
            imageUrl: f.imageUrl || undefined,
            linkUrl: f.linkUrl || undefined,
            badgeText: f.badgeText || undefined,
            badgeColor: f.badgeColor || undefined,
            originalPrice: f.originalPrice ?? undefined,
            discountPrice: f.discountPrice ?? undefined,
            sortOrder: f.sortOrder,
            validFrom: f.validFrom ? `${f.validFrom}T00:00:00.000Z` : undefined,
            validUntil: f.validUntil ? `${f.validUntil}T23:59:59.000Z` : undefined
        };

        const id = this.editingId();
        if (id) {
            this.facade.update(id, { ...payload, isActive: f.isActive });
        } else {
            this.facade.create(payload);
        }

        this.saving.set(false);
        this.dialogVisible.set(false);
        this.successMsg.set(this.translocoService.translate(id ? "common.save" : "common.create"));
    }

    confirmDelete(item: FeaturedItem): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("adminSlideshow.deleteDialog.confirm", { title: item.title }),
            header: this.translocoService.translate("adminSlideshow.deleteDialog.header"),
            icon: "pi pi-trash",
            acceptLabel: this.translocoService.translate("common.delete"),
            rejectLabel: this.translocoService.translate("common.cancel"),
            acceptButtonProps: { severity: "danger" },
            accept: () => {
                this.facade.delete(item.id);
                this.successMsg.set(this.translocoService.translate("common.delete"));
            }
        });
    }

    onSourceTypeChange(sourceType: FeaturedSourceType): void {
        this.updateForm({ sourceType, sourceId: "" });
        this.facade.loadSourceItems(sourceType);
    }

    onSourceItemSelect(sourceId: string | null): void {
        if (!sourceId) {
            this.updateForm({ sourceId: "" });
            return;
        }
        const item = this.facade.sourceItems().find((s) => s.id === sourceId);
        if (!item) return;

        // Auto-fill form fields from the selected source item
        this.updateForm({
            sourceId: item.id,
            title: item.name,
            description: item.description ?? "",
            imageUrl: item.imageUrl ?? "",
            linkUrl: item.linkUrl ?? "",
            originalPrice: item.price ?? null
        });
    }

    updateForm(patch: Partial<FeaturedFormData>): void {
        this.form.update((f) => ({ ...f, ...patch }));
    }
}
