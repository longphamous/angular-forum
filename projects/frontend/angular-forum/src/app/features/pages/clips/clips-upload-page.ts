import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    signal,
    ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import { MediaAsset, UploadProgress } from "../../../core/models/media/media";
import { ClipsFacade } from "../../../facade/clips/clips-facade";
import { MediaFacade } from "../../../facade/media/media-facade";

@Component({
    selector: "app-clips-upload-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        ButtonModule,
        ChipModule,
        InputNumberModule,
        InputTextModule,
        ProgressBarModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TranslocoModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="mx-auto max-w-2xl p-4">
            <h2 class="mb-4 text-2xl font-bold">{{ "clips.upload_form.title" | transloco }}</h2>

            <div class="surface-card border-surface flex flex-col gap-5 rounded-lg border p-6">
                <!-- ── Video Upload Zone ──────────────────────────────────── -->
                @if (!videoAsset()) {
                    <div
                        class="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors"
                        [class.bg-primary/5]="dragging()"
                        [class.border-primary]="dragging()"
                        [class.border-surface-300]="!dragging()"
                        [class.dark:border-surface-600]="!dragging()"
                        (click)="videoInput.click()"
                        (dragleave)="dragging.set(false)"
                        (dragover)="onDragOver($event)"
                        (drop)="onDrop($event)"
                    >
                        @if (!uploadProgress()) {
                            <i class="pi pi-video text-color-secondary mb-3 text-5xl"></i>
                            <p class="text-color m-0 mb-1 text-lg font-semibold">
                                {{ "clips.upload_form.dropVideo" | transloco }}
                            </p>
                            <p class="text-color-secondary m-0 text-sm">
                                {{ "clips.upload_form.videoHint" | transloco }}
                            </p>
                        }

                        @if (uploadProgress(); as prog) {
                            <div class="flex flex-col items-center gap-3">
                                <i class="pi pi-spin pi-spinner text-primary text-3xl"></i>
                                <span class="text-sm font-medium">{{ prog.filename }}</span>
                                <p-progressBar
                                    [showValue]="false"
                                    [value]="prog.percent"
                                    styleClass="w-full max-w-xs h-2"
                                />
                                <span class="text-color-secondary text-xs">{{ prog.percent }}%</span>
                            </div>
                        }

                        <input
                            class="hidden"
                            #videoInput
                            (change)="onVideoSelected($event)"
                            accept="video/mp4,video/webm,video/quicktime"
                            type="file"
                        />
                    </div>
                }

                <!-- ── Video Preview ──────────────────────────────────────── -->
                @if (videoAsset(); as asset) {
                    <div class="relative overflow-hidden rounded-xl bg-black">
                        <video
                            class="max-h-80 w-full object-contain"
                            #videoPreview
                            [src]="asset.url"
                            (loadedmetadata)="onVideoMetadata($event)"
                            loop
                            muted
                            playsinline
                        ></video>
                        <div class="absolute top-2 right-2 flex gap-1">
                            <button
                                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 text-white hover:bg-black/80"
                                (click)="togglePreviewPlay()"
                            >
                                <i
                                    class="pi"
                                    [class.pi-pause]="previewPlaying()"
                                    [class.pi-play]="!previewPlaying()"
                                ></i>
                            </button>
                            <button
                                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-red-500/80 text-white hover:bg-red-600"
                                (click)="removeVideo()"
                            >
                                <i class="pi pi-times"></i>
                            </button>
                        </div>
                        <div class="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                            {{ formatDuration(duration) }}
                        </div>
                    </div>
                }

                <!-- ── Thumbnail Upload ───────────────────────────────────── -->
                @if (videoAsset()) {
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ "clips.upload_form.thumbnailUrl" | transloco }}</label>
                        @if (!thumbnailAsset()) {
                            <div
                                class="border-surface-300 dark:border-surface-600 hover:border-primary cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors"
                                (click)="thumbInput.click()"
                            >
                                <i class="pi pi-image text-color-secondary mb-1 text-2xl"></i>
                                <p class="text-color-secondary m-0 text-xs">
                                    {{ "clips.upload_form.selectThumbnail" | transloco }}
                                </p>
                            </div>
                            <input
                                class="hidden"
                                #thumbInput
                                (change)="onThumbnailSelected($event)"
                                accept="image/jpeg,image/png,image/webp"
                                type="file"
                            />
                        } @else {
                            <div class="relative inline-block">
                                <img class="h-32 rounded-lg object-cover" [src]="thumbnailAsset()!.url" />
                                <button
                                    class="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-red-500/80 text-white"
                                    (click)="thumbnailAsset.set(null)"
                                >
                                    <i class="pi pi-times text-xs"></i>
                                </button>
                            </div>
                        }
                    </div>
                }

                <!-- ── Details Form ───────────────────────────────────────── -->
                @if (videoAsset()) {
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ "clips.upload_form.clipTitle" | transloco }}</label>
                        <input
                            [(ngModel)]="title"
                            [placeholder]="'clips.upload_form.titlePlaceholder' | transloco"
                            pInputText
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ "clips.upload_form.description" | transloco }}</label>
                        <textarea
                            [(ngModel)]="description"
                            [placeholder]="'clips.upload_form.descriptionPlaceholder' | transloco"
                            [rows]="3"
                            pTextarea
                        ></textarea>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ "clips.upload_form.tags" | transloco }}</label>
                        <div class="mb-2 flex flex-wrap gap-1">
                            @for (tag of tags; track tag) {
                                <p-chip [label]="tag" [removable]="true" (onRemove)="removeTag(tag)" />
                            }
                        </div>
                        <input [(ngModel)]="tagInput" (keyup.enter)="addTag()" pInputText placeholder="Enter tag..." />
                    </div>
                    <div class="flex items-center gap-2">
                        <p-toggleSwitch [(ngModel)]="isPublished" />
                        <label class="text-sm">{{ "clips.upload_form.publish" | transloco }}</label>
                    </div>

                    <p-button
                        [disabled]="!title.trim()"
                        [label]="'clips.upload_form.submit' | transloco"
                        [loading]="submitting()"
                        (onClick)="submit()"
                        icon="pi pi-check"
                        styleClass="w-full"
                    />
                }
            </div>
        </div>
    `
})
export class ClipsUploadPage {
    @ViewChild("videoPreview") videoPreviewRef?: ElementRef<HTMLVideoElement>;

    private readonly clipsFacade = inject(ClipsFacade);
    private readonly mediaFacade = inject(MediaFacade);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);
    private readonly cd = inject(ChangeDetectorRef);

    readonly videoAsset = signal<MediaAsset | null>(null);
    readonly thumbnailAsset = signal<MediaAsset | null>(null);
    readonly uploadProgress = signal<UploadProgress | null>(null);
    readonly dragging = signal(false);
    readonly previewPlaying = signal(false);
    readonly submitting = signal(false);

    title = "";
    description = "";
    tags: string[] = [];
    tagInput = "";
    duration = 0;
    isPublished = true;

    // ── Drag & drop ──────────────────────────────────────────────

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(true);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(false);
        const file = event.dataTransfer?.files[0];
        if (file?.type.startsWith("video/")) {
            this.uploadVideo(file);
        }
    }

    onVideoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.uploadVideo(file);
            input.value = "";
        }
    }

    onThumbnailSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.mediaFacade.upload(file, { sourceModule: "clips", category: "thumbnail" }).subscribe({
                next: (progress) => {
                    if (progress.status === "complete" && progress.asset) {
                        this.thumbnailAsset.set(progress.asset);
                        this.cd.markForCheck();
                    }
                }
            });
            input.value = "";
        }
    }

    // ── Video upload ─────────────────────────────────────────────

    private uploadVideo(file: File): void {
        this.uploadProgress.set({
            fileId: `${Date.now()}`,
            filename: file.name,
            loaded: 0,
            total: file.size,
            percent: 0,
            status: "uploading"
        });

        this.mediaFacade.upload(file, { sourceModule: "clips", category: "content" }).subscribe({
            next: (progress) => {
                this.uploadProgress.set(progress);
                if (progress.status === "complete" && progress.asset) {
                    this.videoAsset.set(progress.asset);
                    this.uploadProgress.set(null);
                    // Use filename as default title if empty
                    if (!this.title) {
                        this.title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
                    }
                    this.cd.markForCheck();
                }
                if (progress.status === "error") {
                    this.uploadProgress.set(null);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: progress.error ?? this.translocoService.translate("clips.errors.uploadFailed")
                    });
                    this.cd.markForCheck();
                }
            }
        });
    }

    // ── Video preview ────────────────────────────────────────────

    onVideoMetadata(event: Event): void {
        const video = event.target as HTMLVideoElement;
        this.duration = Math.round(video.duration);
        this.cd.markForCheck();
    }

    togglePreviewPlay(): void {
        const video = this.videoPreviewRef?.nativeElement;
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => {});
            this.previewPlaying.set(true);
        } else {
            video.pause();
            this.previewPlaying.set(false);
        }
    }

    removeVideo(): void {
        this.videoAsset.set(null);
        this.thumbnailAsset.set(null);
        this.duration = 0;
        this.previewPlaying.set(false);
    }

    // ── Tags ─────────────────────────────────────────────────────

    addTag(): void {
        const tag = this.tagInput.trim();
        if (tag && !this.tags.includes(tag)) {
            this.tags = [...this.tags, tag];
        }
        this.tagInput = "";
    }

    removeTag(tag: string): void {
        this.tags = this.tags.filter((t) => t !== tag);
    }

    // ── Submit ───────────────────────────────────────────────────

    submit(): void {
        const video = this.videoAsset();
        if (!video || !this.title.trim()) return;

        this.submitting.set(true);
        this.clipsFacade
            .createClip({
                title: this.title.trim(),
                description: this.description.trim() || undefined,
                videoUrl: video.url,
                thumbnailUrl: this.thumbnailAsset()?.url || undefined,
                tags: this.tags.length > 0 ? this.tags : undefined,
                duration: this.duration || 30,
                isPublished: this.isPublished
            })
            .subscribe({
                next: () => {
                    this.submitting.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "OK",
                        detail: this.translocoService.translate("clips.upload_form.success")
                    });
                    void this.router.navigate(["/clips"]);
                },
                error: () => {
                    this.submitting.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: this.translocoService.translate("clips.errors.uploadFailed")
                    });
                }
            });
    }

    // ── Helpers ──────────────────────────────────────────────────

    formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    }
}
