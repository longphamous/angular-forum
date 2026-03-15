import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { GALLERY_ROUTES } from "../../../core/api/gallery.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { AlbumAccess, GalleryAlbum } from "../../../core/models/gallery/gallery";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CardModule,
        FormsModule,
        InputTextModule,
        SkeletonModule,
        TableModule,
        TagModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService],
    selector: "app-admin-gallery",
    templateUrl: "./admin-gallery.html"
})
export class AdminGallery implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    protected readonly loading = signal(false);
    protected readonly albums = signal<GalleryAlbum[]>([]);
    protected readonly globalFilter = signal("");

    protected readonly publicCount = computed(() => this.albums().filter((a) => a.accessLevel === "public").length);
    protected readonly membersOnlyCount = computed(
        () => this.albums().filter((a) => a.accessLevel === "members_only").length
    );
    protected readonly privateCount = computed(() => this.albums().filter((a) => a.accessLevel === "private").length);

    ngOnInit(): void {
        this.loadAlbums();
    }

    private get apiBase(): string {
        return this.config.baseUrl;
    }

    protected loadAlbums(): void {
        this.loading.set(true);
        this.http.get<GalleryAlbum[]>(`${this.apiBase}${GALLERY_ROUTES.albums()}`).subscribe({
            next: (albums) => {
                this.albums.set(albums);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    protected openAlbum(album: GalleryAlbum): void {
        void this.router.navigate(["/gallery", album.id]);
    }

    protected deleteAlbum(album: GalleryAlbum): void {
        if (!confirm(`Delete album "${album.title}" and all its media?`)) return;
        this.http.delete(`${this.apiBase}${GALLERY_ROUTES.album(album.id)}`).subscribe({
            next: () => {
                this.albums.update((list) => list.filter((a) => a.id !== album.id));
                this.messageService.add({ severity: "success", summary: "Deleted", detail: album.title });
            },
            error: () =>
                this.messageService.add({ severity: "error", summary: "Error", detail: "Failed to delete album" })
        });
    }

    protected accessSeverity(access: AlbumAccess): "success" | "warn" | "danger" {
        if (access === "public") return "success";
        if (access === "members_only") return "warn";
        return "danger";
    }

    protected accessLabel(access: AlbumAccess): string {
        if (access === "public") return "Public";
        if (access === "members_only") return "Members Only";
        return "Private";
    }
}
