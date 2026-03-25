import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    QueryList,
    signal,
    ViewChild,
    ViewChildren
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { DrawerModule } from "primeng/drawer";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

import { Clip } from "../../../core/models/clips/clips";
import { MediaAsset, UploadProgress } from "../../../core/models/media/media";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { ClipsFacade } from "../../../facade/clips/clips-facade";
import { MediaFacade } from "../../../facade/media/media-facade";

@Component({
    selector: "app-clips-feed-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        RouterModule,
        TranslocoModule,
        AvatarModule,
        ButtonModule,
        ChipModule,
        DialogModule,
        DrawerModule,
        InputTextModule,
        ProgressBarModule,
        TagModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: "./clips-feed-page.html",
    styleUrl: "./clips-feed-page.scss"
})
export class ClipsFeedPage implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("feedContainer", { static: true }) feedContainer!: ElementRef<HTMLElement>;
    @ViewChildren("videoRef") videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

    readonly facade = inject(ClipsFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly mediaFacade = inject(MediaFacade);
    private readonly router = inject(Router);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);

    readonly muted = signal(true);
    readonly showComments = signal(false);
    readonly activeClipId = signal<string | null>(null);
    readonly commentText = signal("");
    readonly submittingComment = signal(false);
    readonly videoProgress = signal<Map<string, number>>(new Map());
    readonly playPauseIcon = signal<"play" | "pause" | null>(null);

    // ── Upload dialog state ──────────────────────────────────────
    readonly showUploadDialog = signal(false);
    readonly uploadVideoAsset = signal<MediaAsset | null>(null);
    readonly uploadThumbnailAsset = signal<MediaAsset | null>(null);
    readonly uploadProgress = signal<UploadProgress | null>(null);
    readonly uploadDragging = signal(false);
    readonly uploadSubmitting = signal(false);
    uploadTitle = "";
    uploadDescription = "";
    uploadTags: string[] = [];
    uploadTagInput = "";
    uploadDuration = 0;
    uploadIsPublished = true;

    private observer!: IntersectionObserver;
    private viewTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private viewStartTimes = new Map<string, number>();
    private videoProgressIntervals = new Map<string, ReturnType<typeof setInterval>>();
    private currentPage = 1;
    private loadingMore = false;
    private playPauseIconTimer: ReturnType<typeof setTimeout> | null = null;
    private isSeeking = false;
    private seekingClipIndex = -1;
    private boundSeekMove = this.onSeekMove.bind(this);
    private boundSeekEnd = this.onSeekEnd.bind(this);

    ngOnInit(): void {
        this.facade.loadFeed(1, 10);
    }

    ngAfterViewInit(): void {
        this.videoElements.changes.subscribe(() => {
            // Use setTimeout to ensure the DOM is fully settled after change detection
            setTimeout(() => {
                this.setupObserver();
                this.playFirstVisibleVideo();
            });
        });
        // Handle case where videos are already present on first render
        if (this.videoElements.length > 0) {
            setTimeout(() => {
                this.setupObserver();
                this.playFirstVisibleVideo();
            });
        }
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.viewTimers.forEach((t) => clearTimeout(t));
        this.videoProgressIntervals.forEach((t) => clearInterval(t));
        if (this.playPauseIconTimer) clearTimeout(this.playPauseIconTimer);
        document.removeEventListener("mousemove", this.boundSeekMove);
        document.removeEventListener("mouseup", this.boundSeekEnd);
        document.removeEventListener("touchmove", this.boundSeekTouchMove);
        document.removeEventListener("touchend", this.boundSeekTouchEnd);
    }

    onScroll(event: Event): void {
        const el = event.target as HTMLElement;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200 && !this.loadingMore) {
            this.loadingMore = true;
            this.currentPage++;
            this.facade.loadMore(this.currentPage, 10);
            setTimeout(() => (this.loadingMore = false), 1000);
        }
    }

    togglePlayPause(event: MouseEvent): void {
        const video = event.target as HTMLVideoElement;
        if (video.paused) {
            video.play().catch(() => {});
            this.showPlayPauseIcon("pause");
        } else {
            video.pause();
            this.showPlayPauseIcon("play");
        }
    }

    toggleMute(): void {
        this.muted.update((m) => !m);
        const isMuted = this.muted();
        this.videoElements?.forEach((el) => {
            el.nativeElement.muted = isMuted;
        });
    }

    onSeekStart(event: MouseEvent, clipIndex: number): void {
        event.preventDefault();
        this.isSeeking = true;
        this.seekingClipIndex = clipIndex;
        this.seekToPosition(event.clientX, event.currentTarget as HTMLElement, clipIndex);
        document.addEventListener("mousemove", this.boundSeekMove);
        document.addEventListener("mouseup", this.boundSeekEnd);
    }

    onSeekTouchStart(event: TouchEvent, clipIndex: number): void {
        this.isSeeking = true;
        this.seekingClipIndex = clipIndex;
        const touch = event.touches[0];
        if (touch) {
            this.seekToPosition(touch.clientX, event.currentTarget as HTMLElement, clipIndex);
        }
        document.addEventListener("touchmove", this.boundSeekTouchMove);
        document.addEventListener("touchend", this.boundSeekTouchEnd);
    }

    toggleLike(clip: Clip): void {
        this.facade.toggleLike(clip.id).subscribe();
    }

    openComments(clip: Clip): void {
        this.activeClipId.set(clip.id);
        this.facade.loadComments(clip.id);
        this.showComments.set(true);
    }

    submitComment(): void {
        const clipId = this.activeClipId();
        if (!clipId || !this.commentText().trim()) return;
        this.submittingComment.set(true);
        this.facade.addComment(clipId, this.commentText().trim()).subscribe({
            next: () => {
                this.commentText.set("");
                this.submittingComment.set(false);
                this.facade.loadComments(clipId);
                this.cd.markForCheck();
            },
            error: () => this.submittingComment.set(false)
        });
    }

    toggleFollow(clip: Clip): void {
        this.facade.toggleFollow(clip.id).subscribe();
    }

    shareClip(clip: Clip): void {
        this.facade.incrementShare(clip.id).subscribe();
        const url = `${window.location.origin}/clips/${clip.id}`;
        if (navigator.share) {
            navigator.share({ title: clip.title, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).catch(() => {});
        }
    }

    formatCount(n: number): string {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
        if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
        return String(n);
    }

    formatRelative(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 60) return `${min}m`;
        const hours = Math.floor(min / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }

    getProgress(index: number): number {
        const clip = this.facade.clips()[index];
        return clip ? (this.videoProgress().get(clip.id) ?? 0) : 0;
    }

    // ── Upload dialog methods ──────────────────────────────────

    openUploadDialog(): void {
        this.resetUploadForm();
        this.showUploadDialog.set(true);
    }

    onUploadDragOver(event: DragEvent): void {
        event.preventDefault();
        this.uploadDragging.set(true);
    }

    onUploadDrop(event: DragEvent): void {
        event.preventDefault();
        this.uploadDragging.set(false);
        const file = event.dataTransfer?.files[0];
        if (file?.type.startsWith("video/")) this.startVideoUpload(file);
    }

    onUploadVideoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.startVideoUpload(file);
            input.value = "";
        }
    }

    onUploadThumbnailSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.mediaFacade.upload(file, { sourceModule: "clips", category: "thumbnail" }).subscribe({
                next: (p) => {
                    if (p.status === "complete" && p.asset) {
                        this.uploadThumbnailAsset.set(p.asset);
                        this.cd.markForCheck();
                    }
                }
            });
            input.value = "";
        }
    }

    onUploadVideoMetadata(event: Event): void {
        this.uploadDuration = Math.round((event.target as HTMLVideoElement).duration);
        this.cd.markForCheck();
    }

    addUploadTag(): void {
        const tag = this.uploadTagInput.trim().toLowerCase().replace(/\s+/g, "-");
        if (tag && !this.uploadTags.includes(tag)) this.uploadTags = [...this.uploadTags, tag];
        this.uploadTagInput = "";
    }

    onUploadTagKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            this.addUploadTag();
        }
    }

    removeUploadTag(tag: string): void {
        this.uploadTags = this.uploadTags.filter((t) => t !== tag);
    }

    submitUpload(): void {
        const video = this.uploadVideoAsset();
        if (!video || !this.uploadTitle.trim()) return;
        this.uploadSubmitting.set(true);
        this.facade
            .createClip({
                title: this.uploadTitle.trim(),
                description: this.uploadDescription.trim() || undefined,
                videoUrl: video.url,
                thumbnailUrl: this.uploadThumbnailAsset()?.url || undefined,
                tags: this.uploadTags.length > 0 ? this.uploadTags : undefined,
                duration: this.uploadDuration || 30,
                isPublished: this.uploadIsPublished
            })
            .subscribe({
                next: () => {
                    this.uploadSubmitting.set(false);
                    this.showUploadDialog.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "OK",
                        detail: this.translocoService.translate("clips.upload_form.success")
                    });
                    this.facade.loadFeed(1, 10);
                    this.cd.markForCheck();
                },
                error: () => {
                    this.uploadSubmitting.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: this.translocoService.translate("clips.errors.uploadFailed")
                    });
                    this.cd.markForCheck();
                }
            });
    }

    private startVideoUpload(file: File): void {
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
                    this.uploadVideoAsset.set(progress.asset);
                    this.uploadProgress.set(null);
                    if (!this.uploadTitle) this.uploadTitle = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
                    this.cd.markForCheck();
                }
                if (progress.status === "error") {
                    this.uploadProgress.set(null);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: progress.error ?? "Upload failed"
                    });
                    this.cd.markForCheck();
                }
            }
        });
    }

    private resetUploadForm(): void {
        this.uploadVideoAsset.set(null);
        this.uploadThumbnailAsset.set(null);
        this.uploadProgress.set(null);
        this.uploadTitle = "";
        this.uploadDescription = "";
        this.uploadTags = [];
        this.uploadTagInput = "";
        this.uploadDuration = 0;
        this.uploadIsPublished = true;
    }

    private setupObserver(): void {
        this.observer?.disconnect();
        const root = this.feedContainer.nativeElement;
        this.observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const clipId = (entry.target as HTMLElement).dataset["clipId"] ?? "";
                    const video = entry.target.querySelector("video") as HTMLVideoElement | null;
                    if (!video) continue;

                    if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
                        this.activeClipId.set(clipId);
                        this.playVideo(video);
                        this.startProgressTracking(clipId, video);
                        this.viewStartTimes.set(clipId, Date.now());

                        if (this.viewTimers.has(clipId)) {
                            clearTimeout(this.viewTimers.get(clipId)!);
                        }
                        this.viewTimers.set(
                            clipId,
                            setTimeout(() => {
                                this.facade.incrementView(clipId);
                                this.viewTimers.delete(clipId);
                            }, 2000)
                        );
                    } else {
                        this.sendViewStats(clipId, video);
                        video.pause();
                        this.stopProgressTracking(clipId);
                        if (this.viewTimers.has(clipId)) {
                            clearTimeout(this.viewTimers.get(clipId)!);
                            this.viewTimers.delete(clipId);
                        }
                    }
                }
            },
            { root, threshold: [0, 0.75] }
        );

        this.videoElements.forEach((el) => {
            const slide = el.nativeElement.closest(".clip-slide");
            if (slide) this.observer.observe(slide);
        });
    }

    private playFirstVisibleVideo(): void {
        const firstVideo = this.videoElements.first?.nativeElement;
        if (!firstVideo) return;

        const firstSlide = firstVideo.closest(".clip-slide") as HTMLElement | null;
        const clipId = firstSlide?.dataset["clipId"] ?? "";
        if (clipId) {
            this.activeClipId.set(clipId);
            this.startProgressTracking(clipId, firstVideo);
        }
        this.playVideo(firstVideo);
    }

    private playVideo(video: HTMLVideoElement): void {
        video.muted = this.muted();
        video.play().catch(() => {});
    }

    private sendViewStats(clipId: string, video: HTMLVideoElement): void {
        const startTime = this.viewStartTimes.get(clipId);
        if (!startTime) return;

        const watchDurationMs = Date.now() - startTime;
        if (watchDurationMs < 1000) return;

        const completionPercent = video.duration > 0 ? Math.round((video.currentTime / video.duration) * 100) : 0;
        this.facade.trackView(clipId, { watchDurationMs, completionPercent, source: "feed" });
        this.viewStartTimes.delete(clipId);
    }

    private startProgressTracking(clipId: string, video: HTMLVideoElement): void {
        this.stopProgressTracking(clipId);
        const interval = setInterval(() => {
            if (video.duration > 0) {
                this.videoProgress.update((m) => {
                    const newMap = new Map(m);
                    newMap.set(clipId, (video.currentTime / video.duration) * 100);
                    return newMap;
                });
            }
        }, 250);
        this.videoProgressIntervals.set(clipId, interval);
    }

    private stopProgressTracking(clipId: string): void {
        const interval = this.videoProgressIntervals.get(clipId);
        if (interval) {
            clearInterval(interval);
            this.videoProgressIntervals.delete(clipId);
        }
    }

    private showPlayPauseIcon(icon: "play" | "pause"): void {
        if (this.playPauseIconTimer) clearTimeout(this.playPauseIconTimer);
        this.playPauseIcon.set(icon);
        this.playPauseIconTimer = setTimeout(() => {
            this.playPauseIcon.set(null);
            this.cd.markForCheck();
        }, 600);
        this.cd.markForCheck();
    }

    private seekToPosition(clientX: number, bar: HTMLElement, clipIndex: number): void {
        const rect = bar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const video = this.videoElements.get(clipIndex)?.nativeElement;
        if (video && video.duration > 0) {
            video.currentTime = percent * video.duration;
            const clip = this.facade.clips()[clipIndex];
            if (clip) {
                this.videoProgress.update((m) => {
                    const newMap = new Map(m);
                    newMap.set(clip.id, percent * 100);
                    return newMap;
                });
            }
        }
    }

    private onSeekMove(event: MouseEvent): void {
        if (!this.isSeeking) return;
        const bars = this.feedContainer.nativeElement.querySelectorAll(".clip-progress");
        const bar = bars[this.seekingClipIndex] as HTMLElement | undefined;
        if (bar) this.seekToPosition(event.clientX, bar, this.seekingClipIndex);
    }

    private onSeekEnd(): void {
        this.isSeeking = false;
        this.seekingClipIndex = -1;
        document.removeEventListener("mousemove", this.boundSeekMove);
        document.removeEventListener("mouseup", this.boundSeekEnd);
    }

    private boundSeekTouchMove = (event: TouchEvent): void => {
        if (!this.isSeeking) return;
        const touch = event.touches[0];
        if (!touch) return;
        const bars = this.feedContainer.nativeElement.querySelectorAll(".clip-progress");
        const bar = bars[this.seekingClipIndex] as HTMLElement | undefined;
        if (bar) this.seekToPosition(touch.clientX, bar, this.seekingClipIndex);
    };

    private boundSeekTouchEnd = (): void => {
        this.isSeeking = false;
        this.seekingClipIndex = -1;
        document.removeEventListener("touchmove", this.boundSeekTouchMove);
        document.removeEventListener("touchend", this.boundSeekTouchEnd);
    };
}
