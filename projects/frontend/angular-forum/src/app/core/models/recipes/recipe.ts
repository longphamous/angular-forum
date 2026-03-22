export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeStatus = "draft" | "published";

export interface RecipeIngredient {
    name: string;
    amount: string;
    unit: string;
    group?: string;
}

export interface RecipeStep {
    description: string;
    imageUrl?: string;
    order: number;
}

export interface RecipeNutrition {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
}

export interface RecipeCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon: string;
    position: number;
}

export interface Recipe {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    categoryId: string | null;
    categoryName: string | null;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    coverImageUrl: string | null;
    servings: number | null;
    prepTime: number | null;
    cookTime: number | null;
    difficulty: RecipeDifficulty;
    dietaryTags: string[];
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
    nutrition: RecipeNutrition | null;
    tags: string[];
    status: RecipeStatus;
    viewCount: number;
    favoriteCount: number;
    allowComments: boolean;
    isFavorite: boolean;
    isOwner: boolean;
    averageRating: number;
    ratingCount: number;
    commentCount: number;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RecipeComment {
    id: string;
    recipeId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: RecipeComment[];
    createdAt: string;
    updatedAt: string;
}

export interface RecipeDetail extends Recipe {
    comments: RecipeComment[];
}

export interface CreateRecipePayload {
    title: string;
    description?: string;
    categoryId?: string;
    coverImageUrl?: string;
    servings?: number;
    prepTime?: number;
    cookTime?: number;
    difficulty?: RecipeDifficulty;
    dietaryTags?: string[];
    ingredients?: RecipeIngredient[];
    steps?: RecipeStep[];
    nutrition?: RecipeNutrition;
    tags?: string[];
    status?: RecipeStatus;
    allowComments?: boolean;
}

export interface PaginatedRecipes {
    data: Recipe[];
    total: number;
}

export const DIETARY_OPTIONS = [
    { label: "recipes.dietary.vegetarian", value: "vegetarian", icon: "pi pi-leaf" },
    { label: "recipes.dietary.vegan", value: "vegan", icon: "pi pi-heart" },
    { label: "recipes.dietary.glutenfree", value: "glutenfree", icon: "pi pi-ban" },
    { label: "recipes.dietary.lactosefree", value: "lactosefree", icon: "pi pi-ban" },
    { label: "recipes.dietary.lowcarb", value: "lowcarb", icon: "pi pi-chart-bar" },
    { label: "recipes.dietary.highprotein", value: "highprotein", icon: "pi pi-bolt" }
] as const;

export const DIFFICULTY_OPTIONS = [
    { label: "recipes.difficulty.easy", value: "easy" as RecipeDifficulty },
    { label: "recipes.difficulty.medium", value: "medium" as RecipeDifficulty },
    { label: "recipes.difficulty.hard", value: "hard" as RecipeDifficulty }
] as const;
