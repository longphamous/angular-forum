import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";

import { BLOG_ROUTES } from "../../../core/api/blog.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { BlogCategory, BlogPost, BlogType } from "../../../core/models/blog/blog";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-blog-page",
    imports: [
        AdminQuicklink,
        AvatarModule,
        ButtonModule,
        ChipModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        PaginatorModule,
        RouterLink,
        SelectModule,
        SkeletonModule,
        TagModule,
        ToastModule,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: "./blog-page.html"
})
export class BlogPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly router = inject(Router);
    protected readonly authFacade = inject(AuthFacade);

    protected readonly loading = signal(false);
    protected readonly posts = signal<BlogPost[]>([]);
    protected readonly categories = signal<BlogCategory[]>([]);
    protected readonly searchQuery = signal("");
    protected readonly selectedType = signal<BlogType | null>(null);
    protected readonly selectedCategory = signal<string | null>(null);

    protected readonly typeOptions: { label: string; value: BlogType }[] = [
        { label: "blog.types.editorial", value: "editorial" },
        { label: "blog.types.news", value: "news" },
        { label: "blog.types.personal", value: "personal" },
        { label: "blog.types.diary", value: "diary" }
    ];

    protected readonly viewMode = signal<"grid" | "list">(
        (typeof localStorage !== "undefined" && (localStorage.getItem("blog_view_mode") as "grid" | "list")) || "grid"
    );
    protected readonly currentPage = signal(0);
    protected readonly pageSize = 12;

    protected readonly filteredPosts = computed(() => {
        const q = this.searchQuery().toLowerCase();
        const type = this.selectedType();
        const cat = this.selectedCategory();
        return this.posts().filter((p) => {
            const matchesSearch =
                !q || p.title.toLowerCase().includes(q) || (p.excerpt ?? "").toLowerCase().includes(q);
            const matchesType = !type || p.type === type;
            const matchesCat = !cat || p.categoryId === cat;
            return matchesSearch && matchesType && matchesCat;
        });
    });

    protected readonly paginatedPosts = computed(() => {
        const all = this.filteredPosts();
        const start = this.currentPage() * this.pageSize;
        return all.slice(start, start + this.pageSize);
    });

    protected readonly mostViewedPosts = computed(() =>
        [...this.posts()].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
    );

    protected readonly mostCommentedPosts = computed(() =>
        [...this.posts()].sort((a, b) => b.commentCount - a.commentCount).slice(0, 5)
    );

    protected readonly hasActiveFilters = computed(
        () => !!this.searchQuery() || !!this.selectedType() || !!this.selectedCategory()
    );

    private get apiBase(): string {
        return this.config.baseUrl;
    }

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.loading.set(true);
        this.http.get<BlogPost[]>(`${this.apiBase}${BLOG_ROUTES.posts()}`).subscribe({
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

    protected openPost(post: BlogPost): void {
        void this.router.navigate(["/blog", post.slug]);
    }

    protected writePost(): void {
        void this.router.navigate(["/blog/write"]);
    }

    protected clearFilters(): void {
        this.searchQuery.set("");
        this.selectedType.set(null);
        this.selectedCategory.set(null);
        this.currentPage.set(0);
    }

    protected typeBadgeSeverity(type: BlogType): "info" | "success" | "warn" | "secondary" {
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

    protected formatDate(dateStr: string | null): string {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    }

    protected setViewMode(mode: "grid" | "list"): void {
        this.viewMode.set(mode);
        localStorage.setItem("blog_view_mode", mode);
    }

    protected onPageChange(event: { first?: number; rows?: number }): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize;
        this.currentPage.set(Math.floor(first / rows));
    }

    protected setSearchQuery(value: string): void {
        this.searchQuery.set(value);
        this.currentPage.set(0);
    }

    protected setSelectedType(value: BlogType | null): void {
        this.selectedType.set(value);
        this.currentPage.set(0);
    }

    protected setSelectedCategory(value: string | null): void {
        this.selectedCategory.set(value);
        this.currentPage.set(0);
    }
}
