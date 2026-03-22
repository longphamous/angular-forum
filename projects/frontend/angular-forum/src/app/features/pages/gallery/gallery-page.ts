import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ChipModule } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import { GALLERY_ROUTES } from "../../../core/api/gallery.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { AlbumAccess, CreateAlbumPayload, GalleryAlbum } from "../../../core/models/gallery/gallery";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminQuicklink,
        ButtonModule,
        CardModule,
        ChipModule,
        DialogModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TranslocoModule
    ],
    providers: [MessageService],
    selector: "app-gallery-page",
    templateUrl: "./gallery-page.html"
})
export class GalleryPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    protected readonly authFacade = inject(AuthFacade);

    protected readonly loading = signal(false);
    protected readonly albums = signal<GalleryAlbum[]>([]);
    protected readonly searchQuery = signal("");
    protected readonly selectedCategory = signal<string | null>(null);

    protected readonly createDialogVisible = signal(false);
    protected readonly saving = signal(false);
    protected readonly newAlbum = signal<CreateAlbumPayload>({
        title: "",
        description: "",
        category: "",
        accessLevel: "public",
        watermarkEnabled: false,
        allowComments: true,
        allowRatings: true,
        allowDownload: true,
        tags: []
    });
    protected readonly tagInput = signal("");

    protected readonly accessOptions = [
        { label: "gallery.access.public", value: "public" },
        { label: "gallery.access.membersOnly", value: "members_only" },
        { label: "gallery.access.private", value: "private" }
    ];

    protected readonly filteredAlbums = computed(() => {
        const q = this.searchQuery().toLowerCase();
        const cat = this.selectedCategory();
        return this.albums().filter((a) => {
            const matchesSearch =
                !q || a.title.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q);
            const matchesCat = !cat || a.category === cat;
            return matchesSearch && matchesCat;
        });
    });

    protected readonly categories = computed(() => {
        const cats = new Set(
            this.albums()
                .map((a) => a.category)
                .filter(Boolean) as string[]
        );
        return Array.from(cats).sort();
    });

    protected readonly isAdmin = this.authFacade.isAdmin;

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

    protected openCreateDialog(): void {
        this.newAlbum.set({
            title: "",
            description: "",
            category: "",
            accessLevel: "public",
            watermarkEnabled: false,
            allowComments: true,
            allowRatings: true,
            allowDownload: true,
            tags: []
        });
        this.tagInput.set("");
        this.createDialogVisible.set(true);
    }

    protected addTag(): void {
        const tag = this.tagInput().trim();
        if (!tag) return;
        const current = this.newAlbum();
        if (!current.tags.includes(tag)) {
            this.newAlbum.set({ ...current, tags: [...current.tags, tag] });
        }
        this.tagInput.set("");
    }

    protected removeTag(tag: string): void {
        const current = this.newAlbum();
        this.newAlbum.set({ ...current, tags: current.tags.filter((t) => t !== tag) });
    }

    protected createAlbum(): void {
        const payload = this.newAlbum();
        if (!payload.title.trim()) return;

        this.saving.set(true);
        this.http.post<GalleryAlbum>(`${this.apiBase}${GALLERY_ROUTES.albums()}`, payload).subscribe({
            next: (album) => {
                this.albums.update((list) => [album, ...list]);
                this.createDialogVisible.set(false);
                this.saving.set(false);
                void this.router.navigate(["/gallery", album.id]);
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: "error", summary: "Error", detail: "Failed to create album" });
            }
        });
    }

    protected deleteAlbum(album: GalleryAlbum, event: Event): void {
        event.stopPropagation();
        if (!confirm(`Delete album "${album.title}"?`)) return;
        this.http.delete(`${this.apiBase}${GALLERY_ROUTES.album(album.id)}`).subscribe({
            next: () => this.albums.update((list) => list.filter((a) => a.id !== album.id)),
            error: () =>
                this.messageService.add({ severity: "error", summary: "Error", detail: "Failed to delete album" })
        });
    }

    protected accessSeverity(access: AlbumAccess): "success" | "warn" | "danger" {
        if (access === "public") return "success";
        if (access === "members_only") return "warn";
        return "danger";
    }

    protected accessIcon(access: AlbumAccess): string {
        if (access === "public") return "pi-globe";
        if (access === "members_only") return "pi-users";
        return "pi-lock";
    }

    protected formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    protected onAccessLevelChange(value: string | undefined): void {
        if (value === "public" || value === "members_only" || value === "private") {
            this.newAlbum.update((a) => ({ ...a, accessLevel: value }));
        }
    }

    protected setAlbumTitle(value: string): void {
        this.newAlbum.update((a) => ({ ...a, title: value }));
    }

    protected setAlbumDescription(value: string): void {
        this.newAlbum.update((a) => ({ ...a, description: value }));
    }

    protected setAlbumCategory(value: string): void {
        this.newAlbum.update((a) => ({ ...a, category: value }));
    }

    protected setWatermarkEnabled(value: boolean): void {
        this.newAlbum.update((a) => ({ ...a, watermarkEnabled: value }));
    }

    protected setAllowComments(value: boolean): void {
        this.newAlbum.update((a) => ({ ...a, allowComments: value }));
    }

    protected setAllowRatings(value: boolean): void {
        this.newAlbum.update((a) => ({ ...a, allowRatings: value }));
    }

    protected setAllowDownload(value: boolean): void {
        this.newAlbum.update((a) => ({ ...a, allowDownload: value }));
    }
}
