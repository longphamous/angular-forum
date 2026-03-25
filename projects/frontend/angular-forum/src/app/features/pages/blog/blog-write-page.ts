import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import { BLOG_ROUTES } from "../../../core/api/blog.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { BlogCategory, BlogPost, BlogStatus, BlogType, CreateBlogPostPayload } from "../../../core/models/blog/blog";
import { MediaAsset } from "../../../core/models/media/media";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { MediaUpload } from "../../../shared/components/media-upload/media-upload";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-blog-write-page",
    imports: [
        ButtonModule,
        ChipModule,
        FormsModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TextareaModule,
        ToastModule,
        ToggleSwitchModule,
        TranslocoModule,
        MediaUpload
    ],
    providers: [MessageService],
    templateUrl: "./blog-write-page.html"
})
export class BlogWritePage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);
    readonly navHistory = inject(NavigationHistoryService);

    protected readonly loading = signal(false);
    protected readonly saving = signal(false);
    protected readonly isEditMode = signal(false);
    protected readonly editPostId = signal<string | null>(null);
    protected readonly categories = signal<BlogCategory[]>([]);
    protected readonly tagInput = signal("");

    protected readonly form = signal<CreateBlogPostPayload>({
        title: "",
        content: "",
        excerpt: "",
        type: "personal",
        status: "draft",
        categoryId: undefined,
        coverImageUrl: "",
        tags: [],
        allowComments: true
    });

    protected readonly typeOptions = [
        { label: "blog.types.personal", value: "personal" as BlogType },
        { label: "blog.types.editorial", value: "editorial" as BlogType },
        { label: "blog.types.news", value: "news" as BlogType },
        { label: "blog.types.diary", value: "diary" as BlogType }
    ];

    protected readonly statusOptions = [
        { label: "blog.status.draft", value: "draft" as BlogStatus },
        { label: "blog.status.published", value: "published" as BlogStatus },
        { label: "blog.status.archived", value: "archived" as BlogStatus }
    ];

    private get apiBase(): string {
        return this.config.baseUrl;
    }

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get("slug");
        if (slug) {
            this.isEditMode.set(true);
            this.loadPost(slug);
        }
        this.loadCategories();
    }

    private loadPost(slug: string): void {
        this.loading.set(true);
        this.http.get<BlogPost>(`${this.apiBase}${BLOG_ROUTES.post(slug)}`).subscribe({
            next: (post) => {
                this.editPostId.set(post.id);
                this.form.set({
                    title: post.title,
                    content: post.content,
                    excerpt: post.excerpt ?? "",
                    type: post.type,
                    status: post.status,
                    categoryId: post.categoryId ?? undefined,
                    coverImageUrl: post.coverImageUrl ?? "",
                    tags: [...post.tags],
                    allowComments: post.allowComments
                });
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                void this.router.navigate(["/blog"]);
            }
        });
    }

    private loadCategories(): void {
        this.http.get<BlogCategory[]>(`${this.apiBase}${BLOG_ROUTES.categories()}`).subscribe({
            next: (cats) => this.categories.set(cats)
        });
    }

    protected addTag(): void {
        const tag = this.tagInput().trim().toLowerCase().replace(/\s+/g, "-");
        if (!tag) return;
        const current = this.form();
        if (!(current.tags ?? []).includes(tag)) {
            this.form.update((f) => ({ ...f, tags: [...(f.tags ?? []), tag] }));
        }
        this.tagInput.set("");
    }

    protected removeTag(tag: string): void {
        this.form.update((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
    }

    protected saveDraft(): void {
        this.form.update((f) => ({ ...f, status: "draft" }));
        this.save();
    }

    protected publish(): void {
        this.form.update((f) => ({ ...f, status: "published" }));
        this.save();
    }

    private save(): void {
        const f = this.form();
        if (!f.title.trim() || !f.content.trim()) {
            this.messageService.add({
                severity: "warn",
                summary: this.translocoService.translate("blog.write.requiredFields"),
                detail: this.translocoService.translate("blog.write.titleContentRequired")
            });
            return;
        }

        this.saving.set(true);
        const payload: CreateBlogPostPayload = {
            ...f,
            excerpt: f.excerpt?.trim() || undefined,
            coverImageUrl: f.coverImageUrl?.trim() || undefined,
            categoryId: f.categoryId || undefined
        };

        const request$ = this.isEditMode()
            ? this.http.put<BlogPost>(`${this.apiBase}${BLOG_ROUTES.updatePost(this.editPostId()!)}`, payload)
            : this.http.post<BlogPost>(`${this.apiBase}${BLOG_ROUTES.posts()}`, payload);

        request$.subscribe({
            next: (post) => {
                this.saving.set(false);
                this.messageService.add({
                    severity: "success",
                    summary: this.translocoService.translate("common.saved"),
                    detail: this.translocoService.translate(
                        this.isEditMode() ? "blog.write.articleUpdated" : "blog.write.articleCreated"
                    )
                });
                void this.router.navigate(["/blog", post.slug]);
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({
                    severity: "error",
                    summary: this.translocoService.translate("common.error"),
                    detail: this.translocoService.translate("blog.write.saveFailed")
                });
            }
        });
    }

    protected goBack(): void {
        this.navHistory.back("/blog");
    }

    protected setTitle(value: string): void {
        this.form.update((f) => ({ ...f, title: value }));
    }
    protected setContent(value: string): void {
        this.form.update((f) => ({ ...f, content: value }));
    }
    protected setExcerpt(value: string): void {
        this.form.update((f) => ({ ...f, excerpt: value }));
    }
    protected onCoverImageUploaded(asset: MediaAsset): void {
        this.form.update((f) => ({ ...f, coverImageUrl: asset.url }));
    }
    protected setCoverImageUrl(value: string): void {
        this.form.update((f) => ({ ...f, coverImageUrl: value }));
    }
    protected setType(value: BlogType): void {
        this.form.update((f) => ({ ...f, type: value }));
    }
    protected setStatus(value: BlogStatus): void {
        this.form.update((f) => ({ ...f, status: value }));
    }
    protected setCategoryId(value: string | undefined): void {
        this.form.update((f) => ({ ...f, categoryId: value }));
    }
    protected setAllowComments(value: boolean): void {
        this.form.update((f) => ({ ...f, allowComments: value }));
    }
}
