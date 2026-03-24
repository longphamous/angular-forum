import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";

import { MediaAsset, SourceModule, UploadProgress } from "../../../core/models/media/media";
import { MediaFacade } from "../../../facade/media/media-facade";

@Component({
    selector: "media-upload",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, ProgressBarModule, TranslocoModule],
    template: `
        <div
            class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-6 text-center transition-colors"
            [class.border-primary]="dragging()"
            [class.bg-primary/5]="dragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="dragging.set(false)"
            (drop)="onDrop($event)"
        >
            @if (uploads().length === 0) {
                <i class="pi pi-cloud-upload text-4xl text-color-secondary mb-3"></i>
                <p class="text-color-secondary m-0 mb-2">{{ 'media.upload.dragDrop' | transloco }}</p>
                <p-button
                    [label]="'media.upload.selectFiles' | transloco"
                    icon="pi pi-plus"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="fileInput.click()"
                />
                <input
                    #fileInput
                    type="file"
                    [accept]="accept"
                    [multiple]="multiple"
                    class="hidden"
                    (change)="onFilesSelected($event)"
                />
            }

            @for (upload of uploads(); track upload.fileId) {
                <div class="flex items-center gap-3 p-2 rounded-lg bg-surface-50 dark:bg-surface-800 mb-2">
                    <i class="pi" [class]="upload.status === 'complete' ? 'pi-check-circle text-green-500' : upload.status === 'error' ? 'pi-times-circle text-red-500' : 'pi-spin pi-spinner'"></i>
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium truncate block">{{ upload.filename }}</span>
                        @if (upload.status === 'uploading') {
                            <p-progressBar [value]="upload.percent" [showValue]="false" styleClass="h-1 mt-1" />
                        }
                        @if (upload.status === 'error') {
                            <span class="text-xs text-red-500">{{ upload.error }}</span>
                        }
                    </div>
                    <span class="text-xs text-color-secondary">{{ upload.percent }}%</span>
                </div>
            }
        </div>
    `
})
export class MediaUpload {
    @Input() sourceModule: SourceModule = "general";
    @Input() category?: string;
    @Input() accept = "image/*,video/*";
    @Input() multiple = false;
    @Output() uploaded = new EventEmitter<MediaAsset>();

    private readonly facade = inject(MediaFacade);
    readonly dragging = signal(false);
    readonly uploads = signal<UploadProgress[]>([]);

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(true);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(false);
        if (event.dataTransfer?.files) {
            this.uploadFiles(Array.from(event.dataTransfer.files));
        }
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.uploadFiles(Array.from(input.files));
            input.value = "";
        }
    }

    private uploadFiles(files: File[]): void {
        for (const file of files) {
            this.facade.upload(file, { sourceModule: this.sourceModule, category: this.category }).subscribe({
                next: (progress) => {
                    this.uploads.update((list) => {
                        const existing = list.find((u) => u.fileId === progress.fileId);
                        if (existing) return list.map((u) => (u.fileId === progress.fileId ? progress : u));
                        return [...list, progress];
                    });
                    if (progress.status === "complete" && progress.asset) {
                        this.uploaded.emit(progress.asset);
                    }
                }
            });
        }
    }
}
