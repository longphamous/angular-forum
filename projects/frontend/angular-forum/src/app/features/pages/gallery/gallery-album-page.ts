import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { GalleriaModule } from "primeng/galleria";
import { InputTextModule } from "primeng/inputtext";
import { RatingModule } from "primeng/rating";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { GALLERY_ROUTES } from "../../../core/api/gallery.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    AddMediaPayload,
    GalleryAlbumDetail,
    GalleryComment,
    GalleryMedia
} from "../../../core/models/gallery/gallery";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        DialogModule,
        FormsModule,
        GalleriaModule,
        InputTextModule,
        RatingModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService],
    selector: "app-gallery-album-page",
    templateUrl: "./gallery-album-page.html"
})
export class GalleryAlbumPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    protected readonly navHistory = inject(NavigationHistoryService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly messageService = inject(MessageService);
    protected readonly authFacade = inject(AuthFacade);

    protected readonly loading = signal(true);
    protected readonly album = signal<GalleryAlbumDetail | null>(null);
    protected readonly selectedMedia = signal<GalleryMedia | null>(null);
    protected readonly comments = signal<GalleryComment[]>([]);
    protected readonly commentsLoading = signal(false);
    protected readonly newComment = signal("");
    protected readonly submittingComment = signal(false);

    protected readonly slideshowVisible = signal(false);
    protected readonly slideshowIndex = signal(0);

    protected readonly addMediaDialogVisible = signal(false);
    protected readonly savingMedia = signal(false);
    protected readonly newMediaType = signal<"image" | "video" | "youtube">("image");
    protected readonly newMediaUrl = signal("");
    protected readonly newMediaYoutubeId = signal("");
    protected readonly newMediaTitle = signal("");
    protected readonly newMediaDescription = signal("");

    protected readonly isAdmin = this.authFacade.isAdmin;
    protected readonly currentUserId = computed(() => this.authFacade.currentUser()?.id ?? "");

    protected readonly galleriaImages = computed(() => {
        const a = this.album();
        if (!a) return [];
        return a.media
            .filter((m) => m.type === "image")
            .map((m) => ({ itemImageSrc: m.url, thumbnailImageSrc: m.url, alt: m.title ?? "" }));
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("albumId") ?? "";
        this.loadAlbum(id);
    }

    private get apiBase(): string {
        return this.config.baseUrl;
    }

    private loadAlbum(id: string): void {
        this.loading.set(true);
        this.http.get<GalleryAlbumDetail>(`${this.apiBase}${GALLERY_ROUTES.album(id)}`).subscribe({
            next: (album) => {
                this.album.set(album);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                void this.router.navigate(["/gallery"]);
            }
        });
    }

    protected openMedia(media: GalleryMedia): void {
        this.selectedMedia.set(media);
        this.loadComments(media.id);
    }

    protected closeViewer(): void {
        this.selectedMedia.set(null);
        this.comments.set([]);
    }

    protected loadComments(mediaId: string): void {
        const album = this.album();
        if (!album?.allowComments) return;
        this.commentsLoading.set(true);
        this.http.get<GalleryComment[]>(`${this.apiBase}${GALLERY_ROUTES.mediaComments(mediaId)}`).subscribe({
            next: (c) => {
                this.comments.set(c);
                this.commentsLoading.set(false);
            },
            error: () => this.commentsLoading.set(false)
        });
    }

    protected submitComment(): void {
        const media = this.selectedMedia();
        const content = this.newComment().trim();
        if (!media || !content) return;

        this.submittingComment.set(true);
        this.http
            .post<GalleryComment>(`${this.apiBase}${GALLERY_ROUTES.mediaComments(media.id)}`, { content })
            .subscribe({
                next: (c) => {
                    this.comments.update((list) => [...list, c]);
                    this.newComment.set("");
                    this.submittingComment.set(false);
                },
                error: () => this.submittingComment.set(false)
            });
    }

    protected deleteComment(commentId: string): void {
        this.http.delete(`${this.apiBase}${GALLERY_ROUTES.comment(commentId)}`).subscribe({
            next: () => this.comments.update((list) => list.filter((c) => c.id !== commentId))
        });
    }

    protected rateMedia(rating: number): void {
        const media = this.selectedMedia();
        if (!media) return;
        this.http.post(`${this.apiBase}${GALLERY_ROUTES.rateMedia(media.id)}`, { rating }).subscribe({
            next: () => {
                this.selectedMedia.update((m) => (m ? { ...m, userRating: rating } : m));
                this.album.update((a) => {
                    if (!a) return a;
                    return {
                        ...a,
                        media: a.media.map((m) => (m.id === media.id ? { ...m, userRating: rating } : m))
                    };
                });
            }
        });
    }

    protected openSlideshow(startIndex = 0): void {
        this.slideshowIndex.set(startIndex);
        this.slideshowVisible.set(true);
    }

    protected openAddMediaDialog(): void {
        this.newMediaType.set("image");
        this.newMediaUrl.set("");
        this.newMediaYoutubeId.set("");
        this.newMediaTitle.set("");
        this.newMediaDescription.set("");
        this.addMediaDialogVisible.set(true);
    }

    protected addMedia(): void {
        const album = this.album();
        if (!album) return;

        const type = this.newMediaType();
        const payload: AddMediaPayload = {
            type,
            url:
                type === "youtube"
                    ? `https://img.youtube.com/vi/${this.newMediaYoutubeId()}/hqdefault.jpg`
                    : this.newMediaUrl(),
            youtubeId: type === "youtube" ? this.newMediaYoutubeId() : undefined,
            title: this.newMediaTitle() || undefined,
            description: this.newMediaDescription() || undefined
        };

        if (!payload.url && type !== "youtube") return;
        if (type === "youtube" && !this.newMediaYoutubeId()) return;

        this.savingMedia.set(true);
        this.http.post<GalleryMedia>(`${this.apiBase}${GALLERY_ROUTES.albumMedia(album.id)}`, payload).subscribe({
            next: (media) => {
                this.album.update((a) => (a ? { ...a, media: [...a.media, media], mediaCount: a.mediaCount + 1 } : a));
                this.addMediaDialogVisible.set(false);
                this.savingMedia.set(false);
            },
            error: () => this.savingMedia.set(false)
        });
    }

    protected deleteMedia(mediaId: string, event: Event): void {
        event.stopPropagation();
        if (!confirm("Delete this media item?")) return;
        this.http.delete(`${this.apiBase}${GALLERY_ROUTES.media(mediaId)}`).subscribe({
            next: () => {
                this.album.update((a) =>
                    a ? { ...a, media: a.media.filter((m) => m.id !== mediaId), mediaCount: a.mediaCount - 1 } : a
                );
            }
        });
    }

    protected youtubeEmbedUrl(youtubeId: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${youtubeId}`);
    }

    protected openMapsLink(lat: number, lng: number): void {
        window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
    }

    protected formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    protected formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString();
    }

    protected goBack(): void {
        this.navHistory.back("/gallery");
    }

    protected mediaTypeOptions = [
        { label: "gallery.mediaType.image", value: "image" },
        { label: "gallery.mediaType.video", value: "video" },
        { label: "gallery.mediaType.youtube", value: "youtube" }
    ];

    protected onMediaTypeChange(value: string | undefined): void {
        if (value === "image" || value === "video" || value === "youtube") {
            this.newMediaType.set(value);
        }
    }
}
