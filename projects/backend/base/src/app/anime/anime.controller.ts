import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query
} from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { AnimeService } from "./anime.service";
import { AnimeQueryDto } from "./dto/anime-query.dto";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { UpdateAnimeDto } from "./dto/update-anime.dto";
import { AnimeDto, PaginatedAnimeDto } from "./models/anime.model";

@Controller("anime")
export class AnimeController {
    constructor(private readonly animeService: AnimeService) {}

    /**
     * GET /api/anime
     * Returns a paginated + filtered list of anime.
     *
     * Query params (pagination):
     *   page        – 1-based page number (default: 1)
     *   limit       – items per page (default: 20, max: 100)
     *
     * Query params (filters):
     *   search      – partial match on title / titleEnglish / titleJapanese / titleSynonym
     *   type        – e.g. TV, Movie, OVA, ONA, Special, Music
     *   status      – e.g. "Finished Airing", "Currently Airing", "Not yet aired"
     *   season      – spring | summer | fall | winter
     *   seasonYear  – exact season year (e.g. 2023)
     *   startYear   – anime that started in this year or later
     *   endYear     – anime that ended in this year or earlier
     *   source      – e.g. Manga, "Light novel", Original
     *   rating      – e.g. PG-13, R, G
     *   nsfw        – true | false
     *   minEpisodes / maxEpisodes – episode count range
     *   minScore    / maxScore    – mean score range (0–10)
     *   minRank     / maxRank     – rank range
     *
     * Query params (sorting):
     *   sortBy      – id | title | mean | rank | popularity | episode | seasonYear | startYear | member | voter
     *   sortOrder   – ASC (default) | DESC
     */
    @Public()
    @Get()
    findAll(@Query() query: AnimeQueryDto): Promise<PaginatedAnimeDto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.animeService.findAll(page, limit, query);
    }

    /**
     * GET /api/anime/:id
     * Returns a single anime by its numeric ID.
     */
    @Public()
    @Get(":id")
    findById(@Param("id", ParseIntPipe) id: number): Promise<AnimeDto> {
        return this.animeService.findById(id);
    }

    /**
     * POST /api/anime
     * Creates a new anime entry. Requires authentication.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateAnimeDto): Promise<AnimeDto> {
        return this.animeService.create(dto);
    }

    /**
     * PATCH /api/anime/:id
     * Partially updates an existing anime entry. Requires authentication.
     */
    @Patch(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAnimeDto): Promise<AnimeDto> {
        return this.animeService.update(id, dto);
    }

    /**
     * DELETE /api/anime/:id
     * Soft-deletes an anime entry (sets deletedAt). Requires authentication.
     */
    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
        return this.animeService.remove(id);
    }
}
