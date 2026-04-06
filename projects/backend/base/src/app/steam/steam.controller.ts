import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SteamService, UpdateSteamSettingsDto } from "./steam.service";

@ApiTags("Steam")
@ApiBearerAuth("JWT")
@Controller("steam")
@UseGuards(JwtAuthGuard)
export class SteamController {
    constructor(private readonly steamService: SteamService) {}

    // ── User Endpoints ──────────────────────────────────────────────────────

    @Post("link")
    linkSteam(@Request() req: { user: { userId: string; role: string } }, @Body() body: { steamId: string }) {
        return this.steamService.linkSteam(req.user.userId, body.steamId);
    }

    @Delete("link")
    unlinkSteam(@Request() req: { user: { userId: string; role: string } }) {
        return this.steamService.unlinkSteam(req.user.userId);
    }

    @Get("profile")
    getSteamProfile(@Request() req: { user: { userId: string; role: string } }) {
        return this.steamService.getSteamProfile(req.user.userId);
    }

    @Post("sync")
    syncProfile(@Request() req: { user: { userId: string; role: string } }) {
        return this.steamService.syncProfile(req.user.userId);
    }

    @Get("games")
    getOwnedGames(@Request() req: { user: { userId: string; role: string } }) {
        return this.steamService.getOwnedGames(req.user.userId);
    }

    @Get("games/recent")
    getRecentGames(@Request() req: { user: { userId: string; role: string } }) {
        return this.steamService.getRecentGames(req.user.userId);
    }

    @Get("games/:appId/achievements")
    getAchievements(@Request() req: { user: { userId: string; role: string } }, @Param("appId") appId: string) {
        return this.steamService.getAchievements(req.user.userId, appId);
    }

    @Post("sync-friends")
    syncFriends(@Request() req: { user: { userId: string; role: string } }) {
        return this.steamService.syncFriends(req.user.userId);
    }

    @Patch("settings")
    updateSettings(@Request() req: { user: { userId: string; role: string } }, @Body() body: UpdateSteamSettingsDto) {
        return this.steamService.updateSettings(req.user.userId, body);
    }

    // ── Public Endpoints ────────────────────────────────────────────────────

    @Public()
    @Get("profile/:userId")
    getPublicSteamProfile(@Param("userId") userId: string) {
        return this.steamService.getPublicSteamProfile(userId);
    }

    // ── Admin Endpoints ─────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/profiles")
    getAllLinkedProfiles() {
        return this.steamService.getAllLinkedProfiles();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/:userId")
    getAdminView(@Param("userId") userId: string) {
        return this.steamService.getAdminView(userId);
    }
}
