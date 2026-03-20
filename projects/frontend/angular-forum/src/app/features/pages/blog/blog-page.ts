import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
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
        ButtonModule,
        ChipModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
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

    protected readonly featuredPosts = computed(() =>
        this.posts()
            .filter((p) => p.type === "editorial" || p.type === "news")
            .slice(0, 3)
    );

    protected readonly recentPosts = computed(() => {
        const featuredIds = new Set(this.featuredPosts().map((p) => p.id));
        return this.posts()
            .filter((p) => !featuredIds.has(p.id))
            .slice(0, 4);
    });

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

    protected setSearchQuery(value: string): void {
        this.searchQuery.set(value);
    }

    protected setSelectedType(value: BlogType | null): void {
        this.selectedType.set(value);
    }

    protected setSelectedCategory(value: string | null): void {
        this.selectedCategory.set(value);
    }
}
