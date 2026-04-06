import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { AnimeService } from "./anime.service";
import { AnimeQueryDto } from "./dto/anime-query.dto";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { UpdateAnimeDto } from "./dto/update-anime.dto";
import { AnimeDto, PaginatedAnimeDto } from "./models/anime.model";

/**
 * @deprecated Use /api/v2/anime endpoints instead.
 * This controller will be removed in a future release.
 */
@ApiTags("Anime (deprecated)")
@ApiBearerAuth("JWT")
@Controller("anime")
export class AnimeController {
    constructor(private readonly animeService: AnimeService) {}

    /**
     * @deprecated Use GET /api/v2/anime instead.
     */
    @Public()
    @Get()
    @Header("Deprecation", "true")
    @Header("Sunset", "2026-12-31")
    @Header("Link", '</api/v2/anime>; rel="successor-version"')
    findAll(@Query() query: AnimeQueryDto): Promise<PaginatedAnimeDto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.animeService.findAll(page, limit, query);
    }

    /**
     * @deprecated Use GET /api/v2/anime/genres instead.
     */
    @Public()
    @Get("genres")
    @Header("Deprecation", "true")
    @Header("Sunset", "2026-12-31")
    @Header("Link", '</api/v2/anime/genres>; rel="successor-version"')
    getAllGenres(): Promise<string[]> {
        return this.animeService.getAllGenres();
    }

    /**
     * @deprecated Use GET /api/v2/anime/:id instead.
     */
    @Public()
    @Get(":id")
    @Header("Deprecation", "true")
    @Header("Sunset", "2026-12-31")
    @Header("Link", '</api/v2/anime/:id>; rel="successor-version"')
    findById(@Param("id", ParseIntPipe) id: number): Promise<AnimeDto> {
        return this.animeService.findById(id);
    }

    /**
     * @deprecated No v2 equivalent – animedb is read-only.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Header("Deprecation", "true")
    @Header("Sunset", "2026-12-31")
    create(@Body() dto: CreateAnimeDto): Promise<AnimeDto> {
        return this.animeService.create(dto);
    }

    /**
     * @deprecated No v2 equivalent – animedb is read-only.
     */
    @Patch(":id")
    @Header("Deprecation", "true")
    @Header("Sunset", "2026-12-31")
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAnimeDto): Promise<AnimeDto> {
        return this.animeService.update(id, dto);
    }

    /**
     * @deprecated No v2 equivalent – animedb is read-only.
     */
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @Header("Deprecation", "true")
    @Header("Sunset", "2026-12-31")
    remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
        return this.animeService.remove(id);
    }
}
