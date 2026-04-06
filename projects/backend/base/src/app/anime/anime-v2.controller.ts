import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { AnimeV2Service } from "./anime-v2.service";
import { AnimeV2QueryDto, CharacterQueryDto, PersonQueryDto } from "./dto/anime-v2-query.dto";
import {
    AnimeCharacterDetailDto,
    AnimeProducerDto,
    AnimeV2Dto,
    PaginatedAnimeCharacterListDto,
    PaginatedAnimeV2Dto,
    PaginatedPersonListDto,
    PersonDetailDto
} from "./models/anime-v2.model";

@ApiTags("Anime v2")
@ApiBearerAuth("JWT")
@Controller("v2/anime")
export class AnimeV2Controller {
    constructor(private readonly animeV2Service: AnimeV2Service) {}

    /**
     * GET /api/v2/anime
     * Returns a paginated + filtered list of anime from the animedb database.
     * Includes genres, studios, producers, and licensors.
     */
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(@Query() query: AnimeV2QueryDto): Promise<PaginatedAnimeV2Dto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.animeV2Service.findAll(page, limit, query);
    }

    /**
     * GET /api/v2/anime/genres
     * Returns all distinct genre names used by anime entries.
     */
    @Public()
    @Get("genres")
    @HttpCode(HttpStatus.OK)
    getAllGenres(): Promise<string[]> {
        return this.animeV2Service.getAllGenres();
    }

    /**
     * GET /api/v2/anime/studios
     * Returns all studios that have produced at least one anime.
     */
    @Public()
    @Get("studios")
    @HttpCode(HttpStatus.OK)
    getAllStudios(): Promise<AnimeProducerDto[]> {
        return this.animeV2Service.getAllProducers();
    }

    /**
     * GET /api/v2/anime/characters
     * Returns a paginated + filtered list of anime characters.
     */
    @Public()
    @Get("characters")
    @HttpCode(HttpStatus.OK)
    findAllCharacters(@Query() query: CharacterQueryDto): Promise<PaginatedAnimeCharacterListDto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.animeV2Service.findAllCharacters(page, limit, query);
    }

    /**
     * GET /api/v2/anime/characters/:id
     * Returns a single character by MAL ID with animeography.
     */
    @Public()
    @Get("characters/:id")
    @HttpCode(HttpStatus.OK)
    findCharacterById(@Param("id", ParseIntPipe) id: number): Promise<AnimeCharacterDetailDto> {
        return this.animeV2Service.findCharacterById(id);
    }

    /**
     * GET /api/v2/anime/people
     * Returns a paginated + filtered list of people (voice actors, staff, etc.).
     */
    @Public()
    @Get("people")
    @HttpCode(HttpStatus.OK)
    findAllPeople(@Query() query: PersonQueryDto): Promise<PaginatedPersonListDto> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        return this.animeV2Service.findAllPeople(page, limit, query);
    }

    /**
     * GET /api/v2/anime/people/:id
     * Returns a single person by MAL ID with staff roles and voice acting roles.
     */
    @Public()
    @Get("people/:id")
    @HttpCode(HttpStatus.OK)
    findPersonById(@Param("id", ParseIntPipe) id: number): Promise<PersonDetailDto> {
        return this.animeV2Service.findPersonById(id);
    }

    /**
     * GET /api/v2/anime/:id
     * Returns a single anime by MAL ID with full detail including
     * characters, staff, themes, episodes, statistics, recommendations,
     * external links, and related entries.
     */
    @Public()
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    findById(@Param("id", ParseIntPipe) id: number): Promise<AnimeV2Dto> {
        return this.animeV2Service.findById(id);
    }
}
