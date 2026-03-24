import { HttpClient, HttpEventType, HttpRequest } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

import { MEDIA_ROUTES } from "../../core/api/media.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { MediaAccessLevel, MediaAsset, PaginatedMedia, UploadMediaOptions, UploadProgress } from "../../core/models/media/media";

@Injectable({ providedIn: "root" })
export class MediaFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    readonly userMedia = signal<MediaAsset[]>([]);
    readonly userMediaTotal = signal(0);
    readonly browseResults = signal<MediaAsset[]>([]);
    readonly browseTotal = signal(0);
    readonly currentAsset = signal<MediaAsset | null>(null);
    readonly loading = signal(false);

    private get base(): string {
        return this.config.baseUrl;
    }

    upload(file: File, options: UploadMediaOptions): Observable<UploadProgress> {
        const subject = new Subject<UploadProgress>();
        const fileId = `${Date.now()}-${file.name}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("sourceModule", options.sourceModule);
        if (options.category) formData.append("category", options.category);
        if (options.accessLevel) formData.append("accessLevel", options.accessLevel);
        if (options.altText) formData.append("altText", options.altText);
        if (options.tags?.length) formData.append("tags", JSON.stringify(options.tags));

        subject.next({ fileId, filename: file.name, loaded: 0, total: file.size, percent: 0, status: "uploading" });

        const req = new HttpRequest("POST", `${this.base}${MEDIA_ROUTES.upload()}`, formData, { reportProgress: true });

        this.http.request<MediaAsset>(req).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
                    subject.next({ fileId, filename: file.name, loaded: event.loaded, total: event.total ?? file.size, percent, status: "uploading" });
                } else if (event.type === HttpEventType.Response) {
                    const asset = event.body as MediaAsset;
                    subject.next({ fileId, filename: file.name, loaded: file.size, total: file.size, percent: 100, status: "complete", asset });
                    subject.complete();
                }
            },
            error: (err) => {
                subject.next({ fileId, filename: file.name, loaded: 0, total: file.size, percent: 0, status: "error", error: err?.message ?? "Upload failed" });
                subject.complete();
            }
        });

        return subject.asObservable();
    }

    browse(params: { sourceModule?: string; category?: string; ownerId?: string; mimeType?: string; search?: string; page?: number; limit?: number } = {}): void {
        this.loading.set(true);
        const q = new URLSearchParams();
        if (params.sourceModule) q.set("sourceModule", params.sourceModule);
        if (params.category) q.set("category", params.category);
        if (params.ownerId) q.set("ownerId", params.ownerId);
        if (params.mimeType) q.set("mimeType", params.mimeType);
        if (params.search) q.set("search", params.search);
        q.set("page", String(params.page ?? 1));
        q.set("limit", String(params.limit ?? 30));
        this.http.get<PaginatedMedia>(`${this.base}${MEDIA_ROUTES.browse()}?${q.toString()}`).subscribe({
            next: (r) => { this.browseResults.set(r.data); this.browseTotal.set(r.total); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    loadUserMedia(userId: string, page = 1, limit = 30): void {
        this.loading.set(true);
        this.http.get<PaginatedMedia>(`${this.base}${MEDIA_ROUTES.userMedia(userId)}?page=${page}&limit=${limit}`).subscribe({
            next: (r) => { this.userMedia.set(r.data); this.userMediaTotal.set(r.total); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    loadAsset(id: string): void {
        this.http.get<MediaAsset>(`${this.base}${MEDIA_ROUTES.asset(id)}`).subscribe({
            next: (a) => this.currentAsset.set(a)
        });
    }

    updateAsset(id: string, patch: { altText?: string; tags?: string[]; category?: string; accessLevel?: MediaAccessLevel }): Observable<MediaAsset> {
        return this.http.patch<MediaAsset>(`${this.base}${MEDIA_ROUTES.asset(id)}`, patch);
    }

    deleteAsset(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${MEDIA_ROUTES.asset(id)}`);
    }

    changeAccess(id: string, accessLevel: MediaAccessLevel): Observable<MediaAsset> {
        return this.http.post<MediaAsset>(`${this.base}${MEDIA_ROUTES.updateAccess(id)}`, { accessLevel });
    }

    getVariantUrl(asset: MediaAsset, variantKey: string): string {
        const variant = asset.variants.find((v) => v.variantKey === variantKey);
        return variant?.url ?? asset.url;
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
}
