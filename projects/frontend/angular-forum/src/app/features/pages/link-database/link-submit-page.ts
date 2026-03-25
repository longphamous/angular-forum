import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import { MediaAsset } from "../../../core/models/media/media";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { LinkDatabaseFacade } from "../../../facade/link-database/link-database-facade";
import { MediaUpload } from "../../../shared/components/media-upload/media-upload";

@Component({
    selector: "app-link-submit-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MessageService],
    imports: [
        ButtonModule,
        ChipModule,
        FormsModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TranslocoModule,
        MediaUpload
    ],
    templateUrl: "./link-submit-page.html"
})
export class LinkSubmitPage implements OnInit {
    readonly facade = inject(LinkDatabaseFacade);
    protected readonly navHistory = inject(NavigationHistoryService);
    private readonly router = inject(Router);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);

    protected readonly saving = signal(false);

    // Form fields
    protected formTitle = "";
    protected formUrl = "";
    protected formDescription = "";
    protected formExcerpt = "";
    protected formPreviewImageUrl = "";
    protected formCategoryId = "";
    protected formTags: string[] = [];
    protected formTagInput = "";
    protected formAddress = "";
    protected formContactEmail = "";
    protected formContactPhone = "";

    ngOnInit(): void {
        this.facade.loadCategories();
    }

    protected onPreviewImageUploaded(asset: MediaAsset): void {
        this.formPreviewImageUrl = asset.url;
        this.cd.markForCheck();
    }

    protected addTag(): void {
        const tag = this.formTagInput.trim().toLowerCase();
        if (tag && !this.formTags.includes(tag)) {
            this.formTags = [...this.formTags, tag];
        }
        this.formTagInput = "";
    }

    protected removeTag(tag: string): void {
        this.formTags = this.formTags.filter((t) => t !== tag);
    }

    protected onTagKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            this.addTag();
        }
    }

    protected submit(): void {
        if (!this.formTitle.trim() || !this.formUrl.trim() || !this.formCategoryId) return;
        this.saving.set(true);
        this.facade
            .createLink({
                title: this.formTitle.trim(),
                url: this.formUrl.trim(),
                description: this.formDescription.trim() || undefined,
                excerpt: this.formExcerpt.trim() || undefined,
                previewImageUrl: this.formPreviewImageUrl.trim() || undefined,
                categoryId: this.formCategoryId,
                tags: this.formTags,
                address: this.formAddress.trim() || undefined,
                contactEmail: this.formContactEmail.trim() || undefined,
                contactPhone: this.formContactPhone.trim() || undefined
            })
            .subscribe({
                next: (link) => {
                    this.saving.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: this.translocoService.translate("links.submit.submitted"),
                        detail: this.translocoService.translate("links.submit.submitSuccess")
                    });
                    setTimeout(() => void this.router.navigate(["/links", link.id]), 1500);
                    this.cd.markForCheck();
                },
                error: () => {
                    this.saving.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: this.translocoService.translate("common.error"),
                        detail: this.translocoService.translate("links.submit.submitFailed")
                    });
                    this.cd.markForCheck();
                }
            });
    }
}
