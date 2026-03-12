import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { Public, Roles } from "../../auth/auth.decorators";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { CategoryDetailDto, CategoryDto } from "../models/forum.model";
import { CategoryService } from "../services/category.service";

@Controller("forum/categories")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    /**
     * GET /forum/categories
     * Lists all active categories ordered by position.
     */
    @Public()
    @Get()
    findAll(): Promise<CategoryDto[]> {
        return this.categoryService.findAll();
    }

    /**
     * GET /forum/categories/:id
     * Returns a single category with its forums.
     */
    @Public()
    @Get(":id")
    findById(@Param("id") id: string): Promise<CategoryDetailDto> {
        return this.categoryService.findById(id);
    }

    /**
     * POST /forum/categories
     * Creates a new category. Requires admin role.
     */
    @Roles("admin")
    @Post()
    create(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.create(dto);
    }

    /**
     * PATCH /forum/categories/:id
     * Updates a category. Requires admin role.
     */
    @Roles("admin")
    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.update(id, dto);
    }

    /**
     * DELETE /forum/categories/:id
     * Deletes a category. Requires admin role.
     */
    @Roles("admin")
    @Delete(":id")
    async remove(@Param("id") id: string): Promise<{ success: boolean }> {
        await this.categoryService.remove(id);
        return { success: true };
    }
}
