import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";

import { MediaAsset, SourceModule } from "../../../core/models/media/media";
import { MediaFacade } from "../../../facade/media/media-facade";
import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    selector: "media-browser",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, SelectModule, SkeletonModule, TranslocoModule],
    template: `
        <p-dialog
            [header]="'media.browser.title' | transloco"
            [(visible)]="visible"
            [modal]="true"
            [style]="{ width: '60rem', height: '80vh' }"
            [maximizable]="true"
        >
            <!-- Filters -->
            <div class="flex gap-2 mb-4 flex-wrap">
                <input
                    pInputText
                    [(ngModel)]="searchQuery"
                    [placeholder]="'media.browser.search' | transloco"
                    class="flex-1"
                    (keyup.enter)="applyFilter()"
                />
                <p-select
                    [(ngModel)]="filterModule"
                    [options]="moduleOptions"
                    optionLabel="label"
                    optionValue="value"
                    [placeholder]="'media.browser.filter' | transloco"
                    [showClear]="true"
                    (onChange)="applyFilter()"
                />
                <p-button icon="pi pi-search" (onClick)="applyFilter()" />
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-4 gap-3 overflow-y-auto" style="max-height: 55vh">
                @if (facade.loading()) {
                    @for (i of [1,2,3,4,5,6,7,8]; track i) {
                        <p-skeleton height="120px" styleClass="rounded-lg" />
                    }
                }
                @for (asset of facade.browseResults(); track asset.id) {
                    <div
                        class="relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all"
                        [class.border-primary]="selectedIds().has(asset.id)"
                        [class.border-transparent]="!selectedIds().has(asset.id)"
                        (click)="toggleSelect(asset)"
                    >
                        @if (asset.mimeType.startsWith('image/')) {
                            <img [src]="facade.getVariantUrl(asset, 'thumb_md')" [alt]="asset.altText ?? asset.originalFilename" class="w-full h-28 object-cover" />
                        } @else if (asset.mimeType.startsWith('video/')) {
                            <div class="w-full h-28 bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                <i class="pi pi-video text-2xl text-color-secondary"></i>
                            </div>
                        } @else {
                            <div class="w-full h-28 bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                <i class="pi pi-file text-2xl text-color-secondary"></i>
                            </div>
                        }
                        <div class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                            <span class="text-white text-xs truncate block">{{ asset.originalFilename }}</span>
                        </div>
                        @if (selectedIds().has(asset.id)) {
                            <div class="absolute top-1 right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                                <i class="pi pi-check text-xs"></i>
                            </div>
                        }
                    </div>
                }
                @if (!facade.loading() && facade.browseResults().length === 0) {
                    <div class="col-span-4 text-center text-color-secondary py-8">
                        <i class="pi pi-images text-4xl mb-2 opacity-50"></i>
                        <p>{{ 'media.browser.noResults' | transloco }}</p>
                    </div>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-button [label]="'media.browser.cancel' | transloco" severity="secondary" [text]="true" (onClick)="visible = false" />
                <p-button
                    [label]="'media.browser.select' | transloco"
                    icon="pi pi-check"
                    [disabled]="selectedIds().size === 0"
                    (onClick)="confirmSelection()"
                />
            </ng-template>
        </p-dialog>
    `
})
export class MediaBrowser {
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
