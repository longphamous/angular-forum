import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import {
    CreateCategoryDto,
    CreateLinkDto,
    LinkFilterDto,
    UpdateCategoryDto,
    UpdateLinkDto
} from "./dto/link-database.dto";
import { LinkDatabaseService } from "./link-database.service";

interface AuthReq {
    user: { id: string; role: string };
}

@Controller("links")
export class LinkDatabaseController {
    constructor(private readonly service: LinkDatabaseService) {}

    @Get("categories")
    @Public()
    getCategories() {
        return this.service.getCategories();
    }

    @Get("categories/:id")
    @Public()
    getCategory(@Param("id") id: string) {
        return this.service.getCategory(id);
    }

    @Get()
    @Public()
    getLinks(
        @Query("categoryId") categoryId?: string,
        @Query("tag") tag?: string,
        @Query("search") search?: string,
        @Query("sortBy") sortBy?: string,
        @Query("limit") limit?: string,
        @Query("offset") offset?: string,
        @Request() req?: { user?: { id: string } }
    ) {
        const filter: LinkFilterDto = {
            categoryId,
            tag,
            search,
            sortBy: sortBy as LinkFilterDto["sortBy"],
            limit: limit ? Number(limit) : 20,
            offset: offset ? Number(offset) : 0
        };
        return this.service.getLinks(filter, req?.user?.id);
    }

    @Get(":id")
    @Public()
    getLinkById(@Param("id") id: string, @Request() req?: { user?: { id: string } }) {
        return this.service.getLinkById(id, req?.user?.id);
    }

    @Post()
    createLink(@Request() req: AuthReq, @Body() dto: CreateLinkDto) {
        return this.service.createLink(req.user.id, dto);
    }

    @Put(":id")
    updateLink(@Param("id") id: string, @Request() req: AuthReq, @Body() dto: UpdateLinkDto) {
        return this.service.updateLink(id, req.user.id, req.user.role === "admin", dto);
    }

    @Delete(":id")
    deleteLink(@Param("id") id: string, @Request() req: AuthReq) {
        return this.service.deleteLink(id, req.user.id, req.user.role === "admin");
    }

    @Post(":id/rate")
    rateLink(@Param("id") id: string, @Request() req: AuthReq, @Body() body: { score: number }) {
        return this.service.rateLink(id, req.user.id, body.score);
    }

    @Get(":id/comments")
    @Public()
    getComments(@Param("id") id: string) {
        return this.service.getComments(id);
    }

    @Post(":id/comments")
    addComment(@Param("id") id: string, @Request() req: AuthReq, @Body() body: { content: string }) {
        return this.service.addComment(id, req.user.id, body.content);
    }

    @Patch("comments/:id")
    updateComment(@Param("id") id: string, @Request() req: AuthReq, @Body() body: { content: string }) {
        return this.service.updateComment(id, req.user.id, req.user.role === "admin", body.content);
    }

    @Delete("comments/:id")
    deleteComment(@Param("id") id: string, @Request() req: AuthReq) {
        return this.service.deleteComment(id, req.user.id, req.user.role === "admin");
    }

    // Admin endpoints
    @Get("admin/pending")
    getPending() {
        return this.service.getPendingLinks();
    }

    @Patch(":id/approve")
    approve(@Param("id") id: string) {
        return this.service.approveLink(id);
    }

    @Patch(":id/reject")
    reject(@Param("id") id: string, @Body() body: { reason?: string }) {
        return this.service.rejectLink(id, body.reason);
    }

    @Patch(":id/assign")
    assign(@Param("id") id: string, @Body() body: { assignedToId: string | null }) {
        return this.service.assignLink(id, body.assignedToId);
    }

    @Post("admin/categories")
    createCategory(@Body() dto: CreateCategoryDto) {
        return this.service.createCategory(dto);
    }

    @Put("admin/categories/:id")
    updateCategory(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
        return this.service.updateCategory(id, dto);
    }

    @Delete("admin/categories/:id")
    deleteCategory(@Param("id") id: string) {
        return this.service.deleteCategory(id);
    }
}
