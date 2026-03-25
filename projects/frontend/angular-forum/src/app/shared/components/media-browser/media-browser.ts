import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";

import { MediaAsset, SourceModule } from "../../../core/models/media/media";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { MediaFacade } from "../../../facade/media/media-facade";

@Component({
    selector: "media-browser",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, SelectModule, SkeletonModule, TranslocoModule],
    template: `
        <p-dialog
            [(visible)]="visible"
            [header]="'media.browser.title' | transloco"
            [maximizable]="true"
            [modal]="true"
            [style]="{ width: '60rem', height: '80vh' }"
        >
            <!-- Filters -->
            <div class="mb-4 flex flex-wrap gap-2">
                <input
                    class="flex-1"
                    [(ngModel)]="searchQuery"
                    [placeholder]="'media.browser.search' | transloco"
                    (keyup.enter)="applyFilter()"
                    pInputText
                />
                <p-select
                    [(ngModel)]="filterModule"
                    [options]="moduleOptions"
                    [placeholder]="'media.browser.filter' | transloco"
                    [showClear]="true"
                    (onChange)="applyFilter()"
                    optionLabel="label"
                    optionValue="value"
                />
                <p-button (onClick)="applyFilter()" icon="pi pi-search" />
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-4 gap-3 overflow-y-auto" style="max-height: 55vh">
                @if (facade.loading()) {
                    @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                        <p-skeleton height="120px" styleClass="rounded-lg" />
                    }
                }
                @for (asset of facade.browseResults(); track asset.id) {
                    <div
                        class="relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all"
                        [class.border-primary]="selectedIds().has(asset.id)"
                        [class.border-transparent]="!selectedIds().has(asset.id)"
                        (click)="toggleSelect(asset)"
                    >
                        @if (asset.mimeType.startsWith("image/")) {
                            <img
                                class="h-28 w-full object-cover"
                                [alt]="asset.altText ?? asset.originalFilename"
                                [src]="facade.getVariantUrl(asset, 'thumb_md')"
                            />
                        } @else if (asset.mimeType.startsWith("video/")) {
                            <div
                                class="bg-surface-100 dark:bg-surface-800 flex h-28 w-full items-center justify-center"
                            >
                                <i class="pi pi-video text-color-secondary text-2xl"></i>
                            </div>
                        } @else {
                            <div
                                class="bg-surface-100 dark:bg-surface-800 flex h-28 w-full items-center justify-center"
                            >
                                <i class="pi pi-file text-color-secondary text-2xl"></i>
                            </div>
                        }
                        <div class="absolute right-0 bottom-0 left-0 bg-black/60 px-2 py-1">
                            <span class="block truncate text-xs text-white">{{ asset.originalFilename }}</span>
                        </div>
                        @if (selectedIds().has(asset.id)) {
                            <div
                                class="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                            >
                                <i class="pi pi-check text-xs"></i>
                            </div>
                        }
                    </div>
                }
                @if (!facade.loading() && facade.browseResults().length === 0) {
                    <div class="text-color-secondary col-span-4 py-8 text-center">
                        <i class="pi pi-images mb-2 text-4xl opacity-50"></i>
                        <p>{{ "media.browser.noResults" | transloco }}</p>
                    </div>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-button
                    [label]="'media.browser.cancel' | transloco"
                    [text]="true"
                    (onClick)="visible = false"
                    severity="secondary"
                />
                <p-button
                    [disabled]="selectedIds().size === 0"
                    [label]="'media.browser.select' | transloco"
                    (onClick)="confirmSelection()"
                    icon="pi pi-check"
                />
            </ng-template>
        </p-dialog>
    `
})
export class MediaBrowser implements OnInit {
    @Input() visible = false;
    @Input() selectionMode: "single" | "multiple" = "single";
    @Input() filterSourceModule?: SourceModule;
    @Input() filterMimeType?: string;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() selected = new EventEmitter<MediaAsset[]>();

    readonly facade = inject(MediaFacade);
    private readonly authFacade = inject(AuthFacade);

    searchQuery = "";
    filterModule: string | null = null;
    readonly selectedIds = signal(new Set<string>());
    private selectedAssets = new Map<string, MediaAsset>();

    readonly moduleOptions = [
        { label: "Blog", value: "blog" },
        { label: "Gallery", value: "gallery" },
        { label: "Clips", value: "clips" },
        { label: "User", value: "user" },
        { label: "General", value: "general" }
    ];

    ngOnInit(): void {
        this.applyFilter();
    }

    applyFilter(): void {
        this.facade.browse({
            sourceModule: this.filterModule ?? this.filterSourceModule,
            mimeType: this.filterMimeType,
            search: this.searchQuery || undefined,
            ownerId: this.authFacade.currentUser()?.id,
            page: 1,
            limit: 30
        });
    }

    toggleSelect(asset: MediaAsset): void {
        this.selectedIds.update((ids) => {
            const newIds = new Set(ids);
            if (this.selectionMode === "single") {
                newIds.clear();
                this.selectedAssets.clear();
            }
            if (newIds.has(asset.id)) {
                newIds.delete(asset.id);
                this.selectedAssets.delete(asset.id);
            } else {
                newIds.add(asset.id);
                this.selectedAssets.set(asset.id, asset);
            }
            return newIds;
        });
    }

    confirmSelection(): void {
        this.selected.emit(Array.from(this.selectedAssets.values()));
        this.visible = false;
        this.visibleChange.emit(false);
    }
}
