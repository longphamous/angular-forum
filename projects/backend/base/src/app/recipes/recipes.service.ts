import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MediaService } from "../media/media.service";
import { UserEntity } from "../user/entities/user.entity";
import { RecipeCategoryEntity } from "./entities/recipe-category.entity";
import { RecipeCommentEntity } from "./entities/recipe-comment.entity";
import { RecipeFavoriteEntity } from "./entities/recipe-favorite.entity";
import { RecipeRatingEntity } from "./entities/recipe-rating.entity";
import {
    RecipeDifficulty,
    RecipeEntity,
    RecipeIngredient,
    RecipeNutrition,
    RecipeStatus,
    RecipeStep
} from "./entities/recipe.entity";

export interface CreateRecipeDto {
    title: string;
    description?: string;
    categoryId?: string;
    coverImageUrl?: string;
    coverImageMediaId?: string;
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

export type UpdateRecipeDto = Partial<CreateRecipeDto>;

export interface CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    position?: number;
    isActive?: boolean;
}

export interface RecipeQueryDto {
    categoryId?: string;
    difficulty?: RecipeDifficulty;
    dietaryTag?: string;
    search?: string;
    status?: RecipeStatus;
    page?: number;
    limit?: number;
    sort?: string;
}

export interface EnrichedComment {
    id: string;
    recipeId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: EnrichedComment[];
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class RecipesService {
    constructor(
        @InjectRepository(RecipeEntity)
        private readonly recipeRepo: Repository<RecipeEntity>,
        @InjectRepository(RecipeCategoryEntity)
        private readonly categoryRepo: Repository<RecipeCategoryEntity>,
        @InjectRepository(RecipeCommentEntity)
        private readonly commentRepo: Repository<RecipeCommentEntity>,
        @InjectRepository(RecipeFavoriteEntity)
        private readonly favoriteRepo: Repository<RecipeFavoriteEntity>,
        @InjectRepository(RecipeRatingEntity)
        private readonly ratingRepo: Repository<RecipeRatingEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly mediaService: MediaService
    ) {}

    // ── Categories ──────────────────────────────────────────────

    async getCategories(): Promise<object[]> {
        const cats = await this.categoryRepo.find({
            where: { isActive: true },
            order: { position: "ASC", name: "ASC" }
        });
        return Promise.all(
            cats.map(async (c) => {
                const recipeCount = await this.recipeRepo.count({
                    where: { categoryId: c.id, status: "published" }
                });
                return { ...c, recipeCount };
            })
        );
    }

    async createCategory(dto: CreateCategoryDto): Promise<RecipeCategoryEntity> {
        const cat = this.categoryRepo.create(dto);
        return this.categoryRepo.save(cat);
    }

    async updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<RecipeCategoryEntity> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        Object.assign(cat, dto);
        return this.categoryRepo.save(cat);
    }

    async deleteCategory(id: string): Promise<void> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        await this.recipeRepo
            .createQueryBuilder()
            .update()
            .set({ categoryId: () => "NULL" })
            .where("categoryId = :id", { id })
            .execute();
        await this.categoryRepo.remove(cat);
    }

    // ── Recipes ─────────────────────────────────────────────────

    async getRecipes(
        query: RecipeQueryDto,
        userId: string,
        isAdmin: boolean
    ): Promise<{ data: object[]; total: number; page: number; limit: number }> {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);

        const qb = this.recipeRepo.createQueryBuilder("r").leftJoinAndSelect("r.category", "c");

        if (!isAdmin) {
            qb.where("r.status = :status", { status: "published" });
        } else if (query.status) {
            qb.where("r.status = :status", { status: query.status });
        }

        if (query.categoryId) {
            qb.andWhere("r.category_id = :categoryId", { categoryId: query.categoryId });
        }
        if (query.difficulty) {
            qb.andWhere("r.difficulty = :difficulty", { difficulty: query.difficulty });
        }
        if (query.dietaryTag) {
            qb.andWhere("r.dietary_tags @> :tag", { tag: JSON.stringify([query.dietaryTag]) });
        }
        if (query.search) {
            qb.andWhere("(r.title ILIKE :search OR r.description ILIKE :search)", {
                search: `%${query.search}%`
            });
        }

        const sortMap: Record<string, { col: string; dir: "ASC" | "DESC" }> = {
            newest: { col: "r.createdAt", dir: "DESC" },
            oldest: { col: "r.createdAt", dir: "ASC" },
            popular: { col: "r.viewCount", dir: "DESC" },
            favorites: { col: "r.favoriteCount", dir: "DESC" }
        };
        const sortOption = sortMap[query.sort ?? "newest"] ?? sortMap["newest"];
        qb.orderBy(sortOption.col, sortOption.dir);

        qb.skip((page - 1) * limit).take(limit);

        const [recipes, total] = await qb.getManyAndCount();
        const data = await Promise.all(recipes.map((r) => this.enrichRecipe(r, userId)));

        return { data, total, page, limit };
    }

    async getRecipeBySlug(slug: string, userId: string, isAdmin: boolean): Promise<object> {
        const qb = this.recipeRepo
            .createQueryBuilder("r")
            .leftJoinAndSelect("r.category", "c")
            .where("r.slug = :slug", { slug });

        if (!isAdmin) qb.andWhere("r.status = 'published'");

        const recipe = await qb.getOne();
        if (!recipe) throw new NotFoundException("Recipe not found");

        if (!isAdmin && recipe.status !== "published" && recipe.authorId !== userId) {
            throw new NotFoundException("Recipe not found");
        }

        await this.recipeRepo.increment({ id: recipe.id }, "viewCount", 1);
        recipe.viewCount++;

        const comments = await this.commentRepo.find({
            where: { recipeId: recipe.id },
            order: { createdAt: "ASC" }
        });
        const enrichedComments = await Promise.all(comments.map((c) => this.enrichComment(c)));

        const topLevel = enrichedComments.filter((c: EnrichedComment) => !c.parentId);
        const byParent = new Map<string, EnrichedComment[]>();
        enrichedComments
            .filter((c: EnrichedComment) => c.parentId)
            .forEach((c: EnrichedComment) => {
                const arr = byParent.get(c.parentId as string) ?? [];
                arr.push(c);
                byParent.set(c.parentId as string, arr);
            });
        const nested = topLevel.map((c: EnrichedComment) => ({ ...c, replies: byParent.get(c.id) ?? [] }));

        const enriched = await this.enrichRecipe(recipe, userId);
        return { ...enriched, comments: nested };
    }

    async createRecipe(authorId: string, dto: CreateRecipeDto): Promise<object> {
        const slug = this.generateSlug(dto.title);
        const recipe = this.recipeRepo.create({
            title: dto.title,
            slug,
            description: dto.description ?? null,
            categoryId: dto.categoryId ?? null,
            authorId,
            coverImageUrl: dto.coverImageUrl ?? null,
            servings: dto.servings ?? null,
            prepTime: dto.prepTime ?? null,
            cookTime: dto.cookTime ?? null,
            difficulty: dto.difficulty ?? "medium",
            dietaryTags: dto.dietaryTags ?? [],
            ingredients: dto.ingredients ?? [],
            steps: dto.steps ?? [],
            nutrition: dto.nutrition ?? null,
            tags: dto.tags ?? [],
            status: dto.status ?? "draft",
            allowComments: dto.allowComments ?? true,
            publishedAt: dto.status === "published" ? new Date() : null
        });

        if (dto.coverImageMediaId) {
            const asset = await this.mediaService.findById(dto.coverImageMediaId);
            recipe.coverImageUrl = asset.url;
            recipe.coverImageMediaId = dto.coverImageMediaId;
        }

        const saved = await this.recipeRepo.save(recipe);
        return this.enrichRecipe(saved, authorId);
    }

    async updateRecipe(id: string, userId: string, isAdmin: boolean, dto: UpdateRecipeDto): Promise<object> {
        const recipe = await this.recipeRepo.findOne({ where: { id }, relations: ["category"] });
        if (!recipe) throw new NotFoundException("Recipe not found");
        if (!isAdmin && recipe.authorId !== userId) throw new ForbiddenException("Access denied");

        if (dto.title && dto.title !== recipe.title) recipe.slug = this.generateSlug(dto.title);
        if (dto.title !== undefined) recipe.title = dto.title;
        if (dto.description !== undefined) recipe.description = dto.description ?? null;
        if (dto.categoryId !== undefined) recipe.categoryId = dto.categoryId ?? null;
        if (dto.coverImageUrl !== undefined) recipe.coverImageUrl = dto.coverImageUrl ?? null;
        if (dto.servings !== undefined) recipe.servings = dto.servings ?? null;
        if (dto.prepTime !== undefined) recipe.prepTime = dto.prepTime ?? null;
        if (dto.cookTime !== undefined) recipe.cookTime = dto.cookTime ?? null;
        if (dto.difficulty !== undefined) recipe.difficulty = dto.difficulty;
        if (dto.dietaryTags !== undefined) recipe.dietaryTags = dto.dietaryTags;
        if (dto.ingredients !== undefined) recipe.ingredients = dto.ingredients;
        if (dto.steps !== undefined) recipe.steps = dto.steps;
        if (dto.nutrition !== undefined) recipe.nutrition = dto.nutrition ?? null;
        if (dto.tags !== undefined) recipe.tags = dto.tags;
        if (dto.allowComments !== undefined) recipe.allowComments = dto.allowComments;

        if (dto.coverImageMediaId) {
            const asset = await this.mediaService.findById(dto.coverImageMediaId);
            recipe.coverImageUrl = asset.url;
            recipe.coverImageMediaId = dto.coverImageMediaId;
        }

        if (dto.status !== undefined) {
            if (recipe.status !== "published" && dto.status === "published") recipe.publishedAt = new Date();
            recipe.status = dto.status;
        }

        const saved = await this.recipeRepo.save(recipe);
        return this.enrichRecipe(saved, userId);
    }

    async deleteRecipe(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const recipe = await this.recipeRepo.findOne({ where: { id } });
        if (!recipe) throw new NotFoundException("Recipe not found");
        if (!isAdmin && recipe.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.recipeRepo.softRemove(recipe);
    }

    // ── Favorites ───────────────────────────────────────────────

    async toggleFavorite(userId: string, recipeId: string): Promise<{ favorited: boolean; favoriteCount: number }> {
        const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
        if (!recipe) throw new NotFoundException("Recipe not found");

        const existing = await this.favoriteRepo.findOne({ where: { userId, recipeId } });
        if (existing) {
            await this.favoriteRepo.remove(existing);
            await this.recipeRepo.decrement({ id: recipeId }, "favoriteCount", 1);
            const updated = await this.recipeRepo.findOne({ where: { id: recipeId } });
            return { favorited: false, favoriteCount: updated?.favoriteCount ?? 0 };
        } else {
            const fav = this.favoriteRepo.create({ userId, recipeId });
            await this.favoriteRepo.save(fav);
            await this.recipeRepo.increment({ id: recipeId }, "favoriteCount", 1);
            const updated = await this.recipeRepo.findOne({ where: { id: recipeId } });
            return { favorited: true, favoriteCount: updated?.favoriteCount ?? 0 };
        }
    }

    // ── Ratings ─────────────────────────────────────────────────

    async rateRecipe(
        userId: string,
        recipeId: string,
        rating: number
    ): Promise<{ averageRating: number; totalRatings: number }> {
        if (rating < 1 || rating > 5) throw new BadRequestException("Rating must be between 1 and 5");

        const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
        if (!recipe) throw new NotFoundException("Recipe not found");

        let existing = await this.ratingRepo.findOne({ where: { userId, recipeId } });
        if (existing) {
            existing.rating = rating;
            await this.ratingRepo.save(existing);
        } else {
            existing = this.ratingRepo.create({ userId, recipeId, rating });
            await this.ratingRepo.save(existing);
        }

        const { avg, count } = await this.ratingRepo
            .createQueryBuilder("r")
            .select("AVG(r.rating)", "avg")
            .addSelect("COUNT(r.id)", "count")
            .where("r.recipe_id = :recipeId", { recipeId })
            .getRawOne();

        return { averageRating: parseFloat(parseFloat(avg).toFixed(1)), totalRatings: parseInt(count, 10) };
    }

    // ── Comments ────────────────────────────────────────────────

    async addComment(recipeId: string, userId: string, content: string, parentId?: string): Promise<object> {
        const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
        if (!recipe) throw new NotFoundException("Recipe not found");
        if (!recipe.allowComments) throw new ForbiddenException("Comments are disabled for this recipe");

        const comment = this.commentRepo.create({ recipeId, authorId: userId, content, parentId: parentId ?? null });
        const saved = await this.commentRepo.save(comment);
        return this.enrichComment(saved);
    }

    async updateComment(id: string, userId: string, isAdmin: boolean, content: string): Promise<EnrichedComment> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        comment.content = content;
        const saved = await this.commentRepo.save(comment);
        return this.enrichComment(saved);
    }

    async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.commentRepo.remove(comment);
    }

    // ── My Recipes / Favorites ──────────────────────────────────

    async getMyRecipes(userId: string): Promise<object[]> {
        const recipes = await this.recipeRepo.find({
            where: { authorId: userId },
            relations: ["category"],
            order: { createdAt: "DESC" }
        });
        return Promise.all(recipes.map((r) => this.enrichRecipe(r, userId)));
    }

    async getMyFavorites(userId: string): Promise<object[]> {
        const favorites = await this.favoriteRepo.find({
            where: { userId },
            order: { createdAt: "DESC" }
        });
        const recipeIds = favorites.map((f) => f.recipeId);
        if (recipeIds.length === 0) return [];

        const recipes = await this.recipeRepo
            .createQueryBuilder("r")
            .leftJoinAndSelect("r.category", "c")
            .where("r.id IN (:...ids)", { ids: recipeIds })
            .andWhere("r.status = 'published'")
            .getMany();

        return Promise.all(recipes.map((r) => this.enrichRecipe(r, userId)));
    }

    // ── Helpers ─────────────────────────────────────────────────

    private async enrichRecipe(recipe: RecipeEntity, userId: string): Promise<object> {
        const author = await this.userRepo.findOne({ where: { id: recipe.authorId } });
        const commentCount = await this.commentRepo.count({ where: { recipeId: recipe.id } });
        const category =
            recipe.category ??
            (recipe.categoryId ? await this.categoryRepo.findOne({ where: { id: recipe.categoryId } }) : null);

        let isFavorite = false;
        if (userId) {
            const fav = await this.favoriteRepo.findOne({ where: { userId, recipeId: recipe.id } });
            isFavorite = !!fav;
        }

        const ratingResult = await this.ratingRepo
            .createQueryBuilder("r")
            .select("AVG(r.rating)", "avg")
            .addSelect("COUNT(r.id)", "count")
            .where("r.recipe_id = :recipeId", { recipeId: recipe.id })
            .getRawOne();

        const averageRating = ratingResult?.avg ? parseFloat(parseFloat(ratingResult.avg).toFixed(1)) : 0;
        const totalRatings = ratingResult?.count ? parseInt(ratingResult.count, 10) : 0;

        return {
            id: recipe.id,
            title: recipe.title,
            slug: recipe.slug,
            description: recipe.description,
            categoryId: recipe.categoryId,
            categoryName: category?.name ?? null,
            authorId: recipe.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            coverImageUrl: recipe.coverImageUrl,
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            difficulty: recipe.difficulty,
            dietaryTags: recipe.dietaryTags,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            nutrition: recipe.nutrition,
            tags: recipe.tags,
            status: recipe.status,
            viewCount: recipe.viewCount,
            favoriteCount: recipe.favoriteCount,
            commentCount,
            averageRating,
            totalRatings,
            isFavorite,
            allowComments: recipe.allowComments,
            isOwner: recipe.authorId === userId,
            publishedAt: recipe.publishedAt?.toISOString() ?? null,
            createdAt: recipe.createdAt.toISOString(),
            updatedAt: recipe.updatedAt.toISOString()
        };
    }

    private async enrichComment(comment: RecipeCommentEntity): Promise<EnrichedComment> {
        const author = await this.userRepo.findOne({ where: { id: comment.authorId } });
        return {
            id: comment.id,
            recipeId: comment.recipeId,
            authorId: comment.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            content: comment.content,
            parentId: comment.parentId,
            replies: [],
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        };
    }

    private generateSlug(title: string): string {
        const base = title
            .toLowerCase()
            .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return `${base}-${Date.now()}`;
    }
}
