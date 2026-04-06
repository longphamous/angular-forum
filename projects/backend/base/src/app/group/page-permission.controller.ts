import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import {
    CreatePagePermissionDto,
    PagePermissionDto,
    PagePermissionService,
    UpdatePagePermissionDto
} from "./page-permission.service";

@ApiTags("Groups")
@ApiBearerAuth("JWT")
@Controller("page-permission")
export class PagePermissionController {
    constructor(private readonly pagePermService: PagePermissionService) {}

    /**
     * GET /page-permission
     * Lists all page permissions. Public (used by frontend guard).
     */
    @Public()
    @Get()
    findAll(): Promise<PagePermissionDto[]> {
        return this.pagePermService.findAll();
    }

    /**
     * GET /page-permission/:id
     * Returns a single page permission.
     */
    @Get(":id")
    findOne(@Param("id") id: string): Promise<PagePermissionDto> {
        return this.pagePermService.findOne(id);
    }

    /**
     * POST /page-permission
     * Creates a page permission rule. Requires admin role.
     */
    @Roles("admin")
    @Post()
    create(@Body() dto: CreatePagePermissionDto): Promise<PagePermissionDto> {
        return this.pagePermService.create(dto);
    }

    /**
     * PATCH /page-permission/:id
     * Updates name/route of a permission rule. Requires admin role.
     */
    @Roles("admin")
    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdatePagePermissionDto): Promise<PagePermissionDto> {
        return this.pagePermService.update(id, dto);
    }

    /**
     * DELETE /page-permission/:id
     * Deletes a permission rule. Requires admin role.
     */
    @Roles("admin")
    @Delete(":id")
    async remove(@Param("id") id: string): Promise<{ success: boolean }> {
        await this.pagePermService.remove(id);
        return { success: true };
    }

    /**
     * PUT /page-permission/:id/groups
     * Replaces the allowed groups for a permission. Body: { groupIds: string[] }. Requires admin role.
     */
    @Roles("admin")
    @Put(":id/groups")
    setGroups(@Param("id") id: string, @Body() body: { groupIds: string[] }): Promise<PagePermissionDto> {
        return this.pagePermService.setGroups(id, body.groupIds);
    }
}
