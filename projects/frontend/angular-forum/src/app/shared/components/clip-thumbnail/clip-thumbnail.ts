import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    input,
    signal,
    ViewChild
} from "@angular/core";

/**
 * Displays a clip thumbnail: uses the provided `thumbnailUrl` if available,
 * otherwise captures a frame from the video at 1 second.
 *
 * Usage:
 * ```html
 * <clip-thumbnail [videoUrl]="clip.videoUrl" [thumbnailUrl]="clip.thumbnailUrl" />
 * ```
 */
@Component({
    selector: "clip-thumbnail",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (thumbnailUrl()) {
            <img [src]="thumbnailUrl()" class="clip-thumb-img" alt="" />
        } @else if (frameDataUrl()) {
            <img [src]="frameDataUrl()" class="clip-thumb-img" alt="" />
        } @else {
            <video
                #videoEl
                class="clip-thumb-video"
                [src]="videoUrl()"
                preload="metadata"
                muted
                playsinline
                (loadeddata)="captureFrame()"
            ></video>
        }
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            .clip-thumb-img,
            .clip-thumb-video {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
        `
    ]
})
export class ClipThumbnail implements AfterViewInit {
    readonly videoUrl = input.required<string>();
    readonly thumbnailUrl = input<string | null>(null);

    @ViewChild("videoEl") videoEl?: ElementRef<HTMLVideoElement>;

    readonly frameDataUrl = signal<string | null>(null);

    ngAfterViewInit(): void {
        if (!this.thumbnailUrl() && this.videoEl) {
            const video = this.videoEl.nativeElement;
            video.currentTime = 1;
        }
    }

    captureFrame(): void {
        const video = this.videoEl?.nativeElement;
        if (!video || video.videoWidth === 0) return;

        try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0);
            this.frameDataUrl.set(canvas.toDataURL("image/jpeg", 0.7));
        } catch {
            // Cross-origin or other errors — video element stays as fallback
        }
    }
}
