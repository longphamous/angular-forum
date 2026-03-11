import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { AnimeService } from "./anime.service";
import { AnimeQueryDto } from "./dto/anime-query.dto";
import { AnimeDto, PaginatedAnimeDto } from "./models/anime.model";

@Public()
@Controller("anime")
export class AnimeController {
    constructor(private readonly animeService: AnimeService) {}

    /**
     * GET /api/anime
     * Returns a paginated list of anime.
     *
     * Query params:
     *   page  – page number, 1-based (default: 1)
     *   limit – items per page (default: 20, max: 100)
     */
    @Get()
    findAll(@Query() query: AnimeQueryDto): Promise<PaginatedAnimeDto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.animeService.findAll(page, limit);
    }

    /**
     * GET /api/anime/:id
     * Returns a single anime by its numeric ID.
     */
    @Get(":id")
    findById(@Param("id", ParseIntPipe) id: number): Promise<AnimeDto> {
        return this.animeService.findById(id);
    }
}
