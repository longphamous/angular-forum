import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import { CreateFeaturedItemDto } from "./dto/create-featured-item.dto";
import { FeaturedSection } from "./entities/featured-item.entity";
import { FeaturedItemDto, FeaturedService } from "./featured.service";

@Controller("featured")
export class FeaturedController {
    constructor(private readonly featuredService: FeaturedService) {}

    // ── Public ────────────────────────────────────────────────────────────────

    @Public()
    @Get()
    getActive(@Query("section") section?: FeaturedSection): Promise<FeaturedItemDto[]> {
        return this.featuredService.getActive(section);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin")
    getAll(): Promise<FeaturedItemDto[]> {
        return this.featuredService.findAll();
    }

    @Roles("admin")
    @Post("admin")
    create(@Body() dto: CreateFeaturedItemDto): Promise<FeaturedItemDto> {
        return this.featuredService.create(dto);
    }

    @Roles("admin")
    @Patch("admin/:id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: Partial<CreateFeaturedItemDto>
    ): Promise<FeaturedItemDto> {
        return this.featuredService.update(id, dto);
    }

    @Roles("admin")
    @Delete("admin/:id")
    @HttpCode(204)
    delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
        return this.featuredService.delete(id);
    }
}
