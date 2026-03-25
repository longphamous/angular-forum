import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { RECIPES_ROUTES } from "../../../core/api/recipes.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    DIETARY_OPTIONS,
    DIFFICULTY_OPTIONS,
    PaginatedRecipes,
    Recipe,
    RecipeCategory,
    RecipeDifficulty
} from "../../../core/models/recipes/recipe";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-recipes-page",
    standalone: true,
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
        TranslocoModule
    ],
    templateUrl: "./recipes-page.html"
})
export class RecipesPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly router = inject(Router);
    protected readonly authFacade = inject(AuthFacade);

    protected readonly loading = signal(true);
    protected readonly recipes = signal<Recipe[]>([]);
    protected readonly categories = signal<RecipeCategory[]>([]);
    protected readonly searchQuery = signal("");
    protected readonly selectedCategory = signal<string | null>(null);
    protected readonly selectedDifficulty = signal<RecipeDifficulty | null>(null);
    protected readonly selectedDiet = signal<string | null>(null);

    protected readonly difficultyOptions = [...DIFFICULTY_OPTIONS];
    protected readonly dietaryOptions = [...DIETARY_OPTIONS];

    protected readonly filteredRecipes = computed(() => {
        let list = this.recipes();
        const q = this.searchQuery().toLowerCase();
        const cat = this.selectedCategory();
        const diff = this.selectedDifficulty();
        const diet = this.selectedDiet();

        if (q)
            list = list.filter(
                (r) => r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q)
            );
        if (cat) list = list.filter((r) => r.categoryId === cat);
        if (diff) list = list.filter((r) => r.difficulty === diff);
        if (diet) list = list.filter((r) => r.dietaryTags.includes(diet));
        return list;
    });

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.loading.set(true);
        const base = this.config.baseUrl;
        this.http.get<PaginatedRecipes>(`${base}${RECIPES_ROUTES.list()}?limit=100`).subscribe({
            next: (res) => {
                this.recipes.set(res.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
        this.http.get<RecipeCategory[]>(`${base}${RECIPES_ROUTES.categories()}`).subscribe({
            next: (cats) => this.categories.set(cats)
        });
    }

    protected openRecipe(recipe: Recipe): void {
        void this.router.navigate(["/recipes", recipe.slug]);
    }

    protected createRecipe(): void {
        void this.router.navigate(["/recipes/create"]);
    }

    protected clearFilters(): void {
        this.searchQuery.set("");
        this.selectedCategory.set(null);
        this.selectedDifficulty.set(null);
        this.selectedDiet.set(null);
    }

    protected formatTime(minutes: number | null): string {
        if (!minutes) return "—";
        if (minutes < 60) return `${minutes} Min.`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
    }

    protected difficultySeverity(d: RecipeDifficulty): "success" | "warn" | "danger" {
        if (d === "easy") return "success";
        if (d === "hard") return "danger";
        return "warn";
    }
}
