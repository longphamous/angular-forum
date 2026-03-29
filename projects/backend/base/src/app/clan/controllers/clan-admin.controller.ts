import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";

import { Roles } from "../../auth/auth.decorators";
import { CreateCategoryDto } from "../dto/create-category.dto";
import type { ClanCategoryDto } from "../models/clan.model";
import { ClanAdminService } from "../services/clan-admin.service";

@Roles("admin")
@Controller("clans/admin")
export class ClanAdminController {
    constructor(private readonly clanAdminService: ClanAdminService) {}

    /**
     * GET /clans/admin/categories
     * Returns all clan categories ordered by position.
     */
    @Get("categories")
    getCategories(): Promise<ClanCategoryDto[]> {
        return this.clanAdminService.getCategories();
    }

    /**
     * POST /clans/admin/categories
     * Creates a new clan category.
     */
    @Post("categories")
    createCategory(@Body() dto: CreateCategoryDto): Promise<ClanCategoryDto> {
        return this.clanAdminService.createCategory(dto);
    }

    /**
     * PATCH /clans/admin/categories/:id
     * Updates a clan category.
     */
    @Patch("categories/:id")
    updateCategory(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: Partial<CreateCategoryDto>
    ): Promise<ClanCategoryDto> {
        return this.clanAdminService.updateCategory(id, dto);
    }

    /**
     * DELETE /clans/admin/categories/:id
     * Deletes a clan category.
     */
    @Delete("categories/:id")
    async deleteCategory(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.clanAdminService.deleteCategory(id);
        return { success: true };
    }
}
