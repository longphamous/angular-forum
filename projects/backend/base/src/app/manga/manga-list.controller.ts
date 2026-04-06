import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { SaveMangaListEntryDto } from "./dto/save-manga-list-entry.dto";
import { MangaListEntryDto, MangaListService } from "./manga-list.service";

/**
 * Routes are grouped under /manga/list to avoid route collisions.
 * Public user list lives at /manga/list/user/:userId.
 */
@ApiTags("Manga")
@ApiBearerAuth("JWT")
@Controller("manga/list")
export class MangaListController {
    constructor(private readonly mangaListService: MangaListService) {}

    /**
     * GET /manga/list
     * Returns the authenticated user's manga list with enriched manga data.
     */
    @Get()
    getUserList(@CurrentUser() user: AuthenticatedUser): Promise<MangaListEntryDto[]> {
        return this.mangaListService.getUserList(user.userId);
    }

    /**
     * POST /manga/list
     * Creates or updates a list entry for the authenticated user.
     */
    @Post()
    saveEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveMangaListEntryDto): Promise<MangaListEntryDto> {
        return this.mangaListService.saveEntry(user.userId, dto);
    }

    /**
     * DELETE /manga/list/:mangaId
     * Removes an entry from the authenticated user's list.
     */
    @Delete(":mangaId")
    @HttpCode(HttpStatus.NO_CONTENT)
    removeEntry(
        @CurrentUser() user: AuthenticatedUser,
        @Param("mangaId", ParseIntPipe) mangaId: number
    ): Promise<void> {
        return this.mangaListService.removeEntry(user.userId, mangaId);
    }

    /**
     * GET /manga/list/user/:userId
     * Public endpoint: returns any user's manga list by UUID.
     */
    @Public()
    @Get("user/:userId")
    getPublicUserList(@Param("userId") userId: string): Promise<MangaListEntryDto[]> {
        return this.mangaListService.getUserList(userId);
    }
}
