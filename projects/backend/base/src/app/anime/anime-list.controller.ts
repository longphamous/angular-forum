import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { AnimeListEntryDto, AnimeListService } from "./anime-list.service";
import { SaveAnimeListEntryDto } from "./dto/save-anime-list-entry.dto";

@Controller()
export class AnimeListController {
    constructor(private readonly animeListService: AnimeListService) {}

    /**
     * GET /anime/list
     * Returns the authenticated user's anime list with enriched anime data.
     */
    @Get("anime/list")
    getUserList(@CurrentUser() user: AuthenticatedUser): Promise<AnimeListEntryDto[]> {
        return this.animeListService.getUserList(user.userId);
    }

    /**
     * POST /anime/list
     * Creates or updates a list entry for the authenticated user.
     */
    @Post("anime/list")
    saveEntry(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: SaveAnimeListEntryDto
    ): Promise<AnimeListEntryDto> {
        return this.animeListService.saveEntry(user.userId, dto);
    }

    /**
     * DELETE /anime/list/:animeId
     * Removes an entry from the authenticated user's list.
     */
    @Delete("anime/list/:animeId")
    @HttpCode(HttpStatus.NO_CONTENT)
    removeEntry(
        @CurrentUser() user: AuthenticatedUser,
        @Param("animeId", ParseIntPipe) animeId: number
    ): Promise<void> {
        return this.animeListService.removeEntry(user.userId, animeId);
    }

    /**
     * GET /users/:userId/anime-list
     * Public endpoint: returns any user's anime list.
     */
    @Public()
    @Get("users/:userId/anime-list")
    getPublicUserList(@Param("userId", ParseUUIDPipe) userId: string): Promise<AnimeListEntryDto[]> {
        return this.animeListService.getUserList(userId);
    }
}
