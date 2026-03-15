import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import { BLOG_ROUTES } from "../../../core/api/blog.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { BlogCategory, BlogPost, BlogStatus, BlogType } from "../../../core/models/blog/blog";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-admin-blog",
    imports: [
        ButtonModule,
        DialogModule,
        FormsModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: "./admin-blog.html"
})
export class AdminBlog implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    protected readonly loading = signal(false);
    protected readonly posts = signal<BlogPost[]>([]);
    protected readonly categories = signal<BlogCategory[]>([]);
    protected readonly activeTab = signal<"posts" | "categories">("posts");

    protected readonly categoryDialogVisible = signal(false);
    protected readonly savingCategory = signal(false);
    protected readonly editingCategoryId = signal<string | null>(null);
    protected readonly categoryForm = signal({ name: "", slug: "", description: "", color: "#3B82F6" });

    protected readonly statusOptions = [
        { label: "blog.status.draft", value: "draft" as BlogStatus },
        { label: "blog.status.published", value: "published" as BlogStatus },
        { label: "blog.status.archived", value: "archived" as BlogStatus }
    ];

    protected readonly totalPublished = () => this.posts().filter((p) => p.status === "published").length;
    protected readonly totalDrafts = () => this.posts().filter((p) => p.status === "draft").length;
    protected readonly totalArchived = () => this.posts().filter((p) => p.status === "archived").length;

    private get apiBase(): string {
        return this.config.baseUrl;
    }

    ngOnInit(): void {
        this.loadData();
    }

    protected loadData(): void {
        this.loading.set(true);
        this.http.get<BlogPost[]>(`${this.apiBase}${BLOG_ROUTES.posts()}?status=all`).subscribe({
            next: (posts) => {
                this.posts.set(posts);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
        this.http.get<BlogCategory[]>(`${this.apiBase}${BLOG_ROUTES.categories()}`).subscribe({
            next: (cats) => this.categories.set(cats)
        });
    }

    protected setTab(tab: "posts" | "categories"): void {
        this.activeTab.set(tab);
    }

    protected viewPost(post: BlogPost): void {
        void this.router.navigate(["/blog", post.slug]);
    }

    protected editPost(post: BlogPost): void {
        void this.router.navigate(["/blog", post.slug, "edit"]);
    }

    protected deletePost(post: BlogPost): void {
        if (!confirm(`Artikel "${post.title}" wirklich löschen?`)) return;
        this.http.delete(`${this.apiBase}${BLOG_ROUTES.deletePost(post.id)}`).subscribe({
            next: () => {
                this.posts.update((list) => list.filter((p) => p.id !== post.id));
                this.messageService.add({
                    severity: "success",
                    summary: "Gelöscht",
                    detail: "Artikel wurde gelöscht."
                });
            },
            error: () =>
                this.messageService.add({ severity: "error", summary: "Fehler", detail: "Löschen fehlgeschlagen." })
        });
    }

    protected statusSeverity(status: BlogStatus): "success" | "warn" | "secondary" | "danger" {
        switch (status) {
            case "published":
                return "success";
            case "draft":
                return "warn";
            default:
                return "secondary";
        }
    }

    protected typeSeverity(type: BlogType): "info" | "success" | "warn" | "secondary" {
        switch (type) {
            case "editorial":
                return "info";
            case "news":
                return "success";
            case "diary":
                return "warn";
            default:
                return "secondary";
        }
    }

    protected openCreateCategory(): void {
        this.editingCategoryId.set(null);
        this.categoryForm.set({ name: "", slug: "", description: "", color: "#3B82F6" });
        this.categoryDialogVisible.set(true);
    }

    protected openEditCategory(cat: BlogCategory): void {
        this.editingCategoryId.set(cat.id);
        this.categoryForm.set({
            name: cat.name,
            slug: cat.slug,
            description: cat.description ?? "",
            color: cat.color ?? "#3B82F6"
        });
        this.categoryDialogVisible.set(true);
    }

    protected saveCategory(): void {
        const f = this.categoryForm();
        if (!f.name.trim() || !f.slug.trim()) return;

        this.savingCategory.set(true);
        const editId = this.editingCategoryId();
        const request$ = editId
            ? this.http.put<BlogCategory>(`${this.apiBase}${BLOG_ROUTES.category(editId)}`, f)
            : this.http.post<BlogCategory>(`${this.apiBase}${BLOG_ROUTES.categories()}`, f);

        request$.subscribe({
            next: (cat) => {
                if (editId) {
                    this.categories.update((list) => list.map((c) => (c.id === editId ? { ...c, ...cat } : c)));
                } else {
                    this.categories.update((list) => [...list, { ...cat, postCount: 0 }]);
                }
                this.categoryDialogVisible.set(false);
                this.savingCategory.set(false);
                this.messageService.add({
                    severity: "success",
                    summary: "Gespeichert",
                    detail: "Kategorie gespeichert."
                });
            },
            error: () => {
                this.savingCategory.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler", detail: "Speichern fehlgeschlagen." });
            }
        });
    }

    protected deleteCategory(cat: BlogCategory): void {
        if (!confirm(`Kategorie "${cat.name}" wirklich löschen?`)) return;
        this.http.delete(`${this.apiBase}${BLOG_ROUTES.category(cat.id)}`).subscribe({
            next: () => {
                this.categories.update((list) => list.filter((c) => c.id !== cat.id));
                this.messageService.add({
                    severity: "success",
                    summary: "Gelöscht",
                    detail: "Kategorie wurde gelöscht."
                });
            },
            error: () =>
                this.messageService.add({ severity: "error", summary: "Fehler", detail: "Löschen fehlgeschlagen." })
        });
    }

    protected autoSlug(name: string): void {
        const slug = name
            .toLowerCase()
            .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        this.categoryForm.update((f) => ({ ...f, name, slug }));
    }

    protected setCategorySlug(value: string): void {
        this.categoryForm.update((f) => ({ ...f, slug: value }));
    }
    protected setCategoryDescription(value: string): void {
        this.categoryForm.update((f) => ({ ...f, description: value }));
    }
    protected setCategoryColor(value: string): void {
        this.categoryForm.update((f) => ({ ...f, color: value }));
    }

    protected formatDate(dateStr: string | null): string {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("de-DE");
    }
}
