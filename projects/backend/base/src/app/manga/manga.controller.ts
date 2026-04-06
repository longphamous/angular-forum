import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { MangaQueryDto } from "./dto/manga-query.dto";
import { MangaService } from "./manga.service";
import { MangaDto, PaginatedMangaDto } from "./models/manga.model";

@ApiTags("Manga")
@ApiBearerAuth("JWT")
@Controller("v2/manga")
export class MangaController {
    constructor(private readonly mangaService: MangaService) {}

    /**
     * GET /api/v2/manga
     * Returns a paginated + filtered list of manga from the animedb database.
     * Includes genres and authors.
     */
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(@Query() query: MangaQueryDto): Promise<PaginatedMangaDto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.mangaService.findAll(page, limit, query);
    }

    /**
     * GET /api/v2/manga/genres
     * Returns all distinct genre names used by manga entries.
     */
    @Public()
    @Get("genres")
    @HttpCode(HttpStatus.OK)
    getAllGenres(): Promise<string[]> {
        return this.mangaService.getAllGenres();
    }

    /**
     * GET /api/v2/manga/:id
     * Returns a single manga by MAL ID with full detail including
     * characters, statistics, recommendations, external links,
     * and related entries.
     */
    @Public()
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    findById(@Param("id", ParseIntPipe) id: number): Promise<MangaDto> {
        return this.mangaService.findById(id);
    }
}
