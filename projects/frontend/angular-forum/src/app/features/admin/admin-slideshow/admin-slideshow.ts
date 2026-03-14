import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { ConfirmationService } from "primeng/api";

import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { SLIDESHOW_ROUTES } from "../../../core/api/slideshow.routes";
import { TeaserSlide } from "../../../core/models/slideshow/teaser-slide";

export interface SlideFormData {
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    linkLabel: string;
    isActive: boolean;
    sortOrder: number;
}

const EMPTY_FORM: SlideFormData = {
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    linkLabel: "",
    isActive: true,
    sortOrder: 0
};

@Component({
    selector: "admin-slideshow",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService],
    templateUrl: "./admin-slideshow.html"
})
export class AdminSlideshow implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translocoService = inject(TranslocoService);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly uploading = signal(false);
    readonly error = signal<string | null>(null);
    readonly successMsg = signal<string | null>(null);
    readonly slides = signal<TeaserSlide[]>([]);
    readonly dialogVisible = signal(false);
    readonly editingId = signal<string | null>(null);
    readonly form = signal<SlideFormData>({ ...EMPTY_FORM });

    ngOnInit(): void {
        this.loadSlides();
    }

    private loadSlides(): void {
        this.loading.set(true);
        this.http.get<TeaserSlide[]>(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.admin.list()}`).subscribe({
            next: (data) => {
                this.slides.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminSlideshow.loadError"));
                this.loading.set(false);
            }
        });
    }

    openCreate(): void {
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.error.set(null);
        this.successMsg.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(slide: TeaserSlide): void {
        this.editingId.set(slide.id);
        this.form.set({
            title: slide.title,
            description: slide.description ?? "",
            imageUrl: slide.imageUrl,
            linkUrl: slide.linkUrl ?? "",
            linkLabel: slide.linkLabel ?? "",
            isActive: slide.isActive,
            sortOrder: slide.sortOrder
        });
        this.error.set(null);
        this.successMsg.set(null);
        this.dialogVisible.set(true);
    }

    saveSlide(): void {
        const f = this.form();
        if (!f.title.trim() || !f.imageUrl.trim()) return;
        this.saving.set(true);
        this.error.set(null);

        const id = this.editingId();
        const payload = {
            title: f.title,
            description: f.description || undefined,
            imageUrl: f.imageUrl,
            linkUrl: f.linkUrl || undefined,
            linkLabel: f.linkLabel || undefined,
            isActive: f.isActive,
            sortOrder: f.sortOrder
        };

        const req = id
            ? this.http.patch<TeaserSlide>(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.admin.update(id)}`, payload)
            : this.http.post<TeaserSlide>(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.admin.create()}`, payload);

        req.subscribe({
            next: (saved) => {
                if (id) {
                    this.slides.update((list) => list.map((s) => (s.id === id ? saved : s)));
                    this.successMsg.set(this.translocoService.translate("adminSlideshow.updateSuccess", { title: saved.title }));
                } else {
                    this.slides.update((list) => [...list, saved]);
                    this.successMsg.set(this.translocoService.translate("adminSlideshow.createSuccess", { title: saved.title }));
                }
                this.saving.set(false);
                this.dialogVisible.set(false);
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminSlideshow.saveError"));
                this.saving.set(false);
            }
        });
    }

    confirmDelete(slide: TeaserSlide): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("adminSlideshow.deleteDialog.confirm", { title: slide.title }),
            header: this.translocoService.translate("adminSlideshow.deleteDialog.header"),
            icon: "pi pi-trash",
            acceptLabel: this.translocoService.translate("common.delete"),
            rejectLabel: this.translocoService.translate("common.cancel"),
            acceptButtonProps: { severity: "danger" },
            accept: () => this.deleteSlide(slide)
        });
    }

    private deleteSlide(slide: TeaserSlide): void {
        this.http.delete(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.admin.delete(slide.id)}`).subscribe({
            next: () => {
                this.slides.update((list) => list.filter((s) => s.id !== slide.id));
                this.successMsg.set(this.translocoService.translate("adminSlideshow.deleteSuccess", { title: slide.title }));
            },
            error: () => this.error.set(this.translocoService.translate("adminSlideshow.deleteError"))
        });
    }

    uploadImage(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;
        const file = input.files[0];
        const formData = new FormData();
        formData.append("file", file);
        this.uploading.set(true);
        this.http.post<{ url: string }>(`${this.apiConfig.baseUrl}${SLIDESHOW_ROUTES.admin.upload()}`, formData).subscribe({
            next: (res) => {
                this.form.update((f) => ({ ...f, imageUrl: res.url }));
                this.uploading.set(false);
            },
            error: () => {
                this.error.set(this.translocoService.translate("adminSlideshow.uploadError"));
                this.uploading.set(false);
            }
        });
        input.value = "";
    }

    updateForm(patch: Partial<SlideFormData>): void {
        this.form.update((f) => ({ ...f, ...patch }));
    }
}
