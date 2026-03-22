import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Request,
    UseGuards
} from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RecipeDifficulty, RecipeStatus } from "./entities/recipe.entity";
import { CreateCategoryDto, CreateRecipeDto, RecipeQueryDto, RecipesService, UpdateRecipeDto } from "./recipes.service";

@Controller("recipes")
@UseGuards(JwtAuthGuard)
export class RecipesController {
    constructor(private readonly recipesService: RecipesService) {}

    // ── Public Endpoints ────────────────────────────────────────

    @Public()
    @Get()
    getRecipes(
        @Request() req: { user?: { userId: string; role: string } },
        @Query("categoryId") categoryId?: string,
        @Query("difficulty") difficulty?: RecipeDifficulty,
        @Query("dietaryTag") dietaryTag?: string,
        @Query("search") search?: string,
        @Query("status") status?: RecipeStatus,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @Query("sort") sort?: string
    ) {
        const query: RecipeQueryDto = {
            categoryId,
            difficulty,
            dietaryTag,
            search,
            status,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            sort
        };
        return this.recipesService.getRecipes(query, req.user?.userId ?? "", req.user?.role === "admin");
    }

    @Public()
    @Get("categories")
    getCategories() {
        return this.recipesService.getCategories();
    }

    // ── Authenticated Endpoints ─────────────────────────────────

    @Get("my/recipes")
    getMyRecipes(@Request() req: { user: { userId: string } }) {
        return this.recipesService.getMyRecipes(req.user.userId);
    }

    @Get("my/favorites")
    getMyFavorites(@Request() req: { user: { userId: string } }) {
        return this.recipesService.getMyFavorites(req.user.userId);
    }

    @Post()
    createRecipe(@Request() req: { user: { userId: string } }, @Body() dto: CreateRecipeDto) {
        return this.recipesService.createRecipe(req.user.userId, dto);
    }

    @Patch("comments/:id")
    updateComment(
        @Param("id") id: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() body: { content: string }
    ) {
        return this.recipesService.updateComment(id, req.user.userId, req.user.role === "admin", body.content);
    }

    @Delete("comments/:id")
    deleteComment(@Param("id") id: string, @Request() req: { user: { userId: string; role: string } }) {
        return this.recipesService.deleteComment(id, req.user.userId, req.user.role === "admin");
    }

    // ── Admin Endpoints ─────────────────────────────────────────

    @Post("categories")
    createCategory(@Request() req: { user: { role: string } }, @Body() dto: CreateCategoryDto) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.recipesService.createCategory(dto);
    }

    @Patch("categories/:id")
    updateCategory(
        @Param("id") id: string,
        @Request() req: { user: { role: string } },
        @Body() dto: Partial<CreateCategoryDto>
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.recipesService.updateCategory(id, dto);
    }

    @Delete("categories/:id")
    deleteCategory(@Param("id") id: string, @Request() req: { user: { role: string } }) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.recipesService.deleteCategory(id);
    }

    // ── Parameterized Endpoints (must come after static routes) ──

    @Public()
    @Get(":slug")
    getRecipe(@Param("slug") slug: string, @Request() req: { user?: { userId: string; role: string } }) {
        return this.recipesService.getRecipeBySlug(slug, req.user?.userId ?? "", req.user?.role === "admin");
    }

    @Put(":id")
    updateRecipe(
        @Param("id") id: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() dto: UpdateRecipeDto
    ) {
        return this.recipesService.updateRecipe(id, req.user.userId, req.user.role === "admin", dto);
    }

    @Delete(":id")
    deleteRecipe(@Param("id") id: string, @Request() req: { user: { userId: string; role: string } }) {
        return this.recipesService.deleteRecipe(id, req.user.userId, req.user.role === "admin");
    }

    @Post(":id/favorite")
    toggleFavorite(@Param("id") id: string, @Request() req: { user: { userId: string } }) {
        return this.recipesService.toggleFavorite(req.user.userId, id);
    }

    @Post(":id/rate")
    rateRecipe(
        @Param("id") id: string,
        @Request() req: { user: { userId: string } },
        @Body() body: { rating: number }
    ) {
        return this.recipesService.rateRecipe(req.user.userId, id, body.rating);
    }

    @Post(":id/comments")
    addComment(
        @Param("id") id: string,
        @Request() req: { user: { userId: string } },
        @Body() body: { content: string; parentId?: string }
    ) {
        return this.recipesService.addComment(id, req.user.userId, body.content, body.parentId);
    }
}
