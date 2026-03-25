import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { SteamProfileEntity } from "./entities/steam-profile.entity";

// ── Steam API response types ────────────────────────────────────────────────

interface SteamPlayerSummary {
    steamid: string;
    personaname: string;
    avatarfull: string;
    profileurl: string;
    personastate: number;
    gameextrainfo?: string;
}

interface SteamPlayerSummariesResponse {
    response: { players: SteamPlayerSummary[] };
}

interface SteamOwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    playtime_2weeks?: number;
}

interface SteamOwnedGamesResponse {
    response: { game_count: number; games: SteamOwnedGame[] };
}

interface SteamRecentGame {
    appid: number;
    name: string;
    playtime_2weeks: number;
    playtime_forever: number;
    img_icon_url: string;
}

interface SteamRecentGamesResponse {
    response: { total_count: number; games: SteamRecentGame[] };
}

interface SteamFriend {
    steamid: string;
    relationship: string;
    friend_since: number;
}

interface SteamFriendListResponse {
    friendslist: { friends: SteamFriend[] };
}

interface SteamAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
    name?: string;
    description?: string;
}

interface SteamAchievementsResponse {
    playerstats: {
        steamID: string;
        gameName: string;
        achievements: SteamAchievement[];
        success: boolean;
    };
}

// ── Public return types ─────────────────────────────────────────────────────

export interface SteamProfileDto {
    id: string;
    userId: string;
    steamId: string;
    personaName: string;
    avatarUrl: string | null;
    profileUrl: string | null;
    onlineStatus: number;
    currentGame: string | null;
    gameCount: number;
    isPublic: boolean;
    syncFriends: boolean;
    lastSynced: string | null;
}

export interface SteamGameDto {
    appId: number;
    name: string;
    playtimeForever: number;
    playtime2Weeks?: number;
    iconUrl: string;
}

export interface SteamAchievementDto {
    apiName: string;
    name: string;
    description: string;
    achieved: boolean;
    unlockTime: number;
}

export interface UpdateSteamSettingsDto {
    isPublic?: boolean;
    syncFriends?: boolean;
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SteamService {
    private readonly logger = new Logger(SteamService.name);
    private readonly cache = new Map<string, { data: unknown; expiry: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly API_TIMEOUT = 5000;
    private readonly apiKey: string | undefined;

    constructor(
        @InjectRepository(SteamProfileEntity)
        private readonly profileRepo: Repository<SteamProfileEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly configService: ConfigService
    ) {
        this.apiKey = this.configService.get<string>("STEAM_API_KEY");
        if (!this.apiKey) {
            this.logger.warn("STEAM_API_KEY is not configured – all Steam API calls will return empty results");
        }
    }

    // ── Steam API helpers ───────────────────────────────────────────────────

    private async fetchSteamProfile(steamId: string): Promise<SteamPlayerSummary | null> {
        if (!this.apiKey) return null;

        const cacheKey = `profile:${steamId}`;
        const cached = this.getCached<SteamPlayerSummary>(cacheKey);
        if (cached) return cached;

        try {
            this.logger.debug(`Steam API: GetPlayerSummaries for ${steamId}`);
            const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${this.apiKey}&steamids=${steamId}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(this.API_TIMEOUT) });
            if (!res.ok) return null;

            const json = (await res.json()) as SteamPlayerSummariesResponse;
            const player = json.response?.players?.[0] ?? null;
            if (player) this.setCache(cacheKey, player);
            return player;
        } catch (err) {
            this.logger.warn(`Failed to fetch Steam profile for ${steamId}: ${(err as Error).message}`);
            return null;
        }
    }

    private async fetchOwnedGames(steamId: string): Promise<SteamOwnedGamesResponse["response"] | null> {
        if (!this.apiKey) return null;

        const cacheKey = `owned:${steamId}`;
        const cached = this.getCached<SteamOwnedGamesResponse["response"]>(cacheKey);
        if (cached) return cached;

        try {
            this.logger.debug(`Steam API: GetOwnedGames for ${steamId}`);
            const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${this.apiKey}&steamid=${steamId}&include_appinfo=1&format=json`;
            const res = await fetch(url, { signal: AbortSignal.timeout(this.API_TIMEOUT) });
            if (!res.ok) return null;

            const json = (await res.json()) as SteamOwnedGamesResponse;
            const data = json.response ?? null;
            if (data) this.setCache(cacheKey, data);
            return data;
        } catch (err) {
            this.logger.warn(`Failed to fetch owned games for ${steamId}: ${(err as Error).message}`);
            return null;
        }
    }

    private async fetchRecentGames(steamId: string): Promise<SteamRecentGame[] | null> {
        if (!this.apiKey) return null;

        const cacheKey = `recent:${steamId}`;
        const cached = this.getCached<SteamRecentGame[]>(cacheKey);
        if (cached) return cached;

        try {
            this.logger.debug(`Steam API: GetRecentlyPlayedGames for ${steamId}`);
            const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${this.apiKey}&steamid=${steamId}&format=json`;
            const res = await fetch(url, { signal: AbortSignal.timeout(this.API_TIMEOUT) });
            if (!res.ok) return null;

            const json = (await res.json()) as SteamRecentGamesResponse;
            const games = json.response?.games ?? [];
            this.setCache(cacheKey, games);
            return games;
        } catch (err) {
            this.logger.warn(`Failed to fetch recent games for ${steamId}: ${(err as Error).message}`);
            return null;
        }
    }

    private async fetchFriendList(steamId: string): Promise<SteamFriend[] | null> {
        if (!this.apiKey) return null;

        const cacheKey = `friends:${steamId}`;
        const cached = this.getCached<SteamFriend[]>(cacheKey);
        if (cached) return cached;

        try {
            this.logger.debug(`Steam API: GetFriendList for ${steamId}`);
            const url = `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${this.apiKey}&steamid=${steamId}&relationship=friend`;
            const res = await fetch(url, { signal: AbortSignal.timeout(this.API_TIMEOUT) });
            if (!res.ok) return null;

            const json = (await res.json()) as SteamFriendListResponse;
            const friends = json.friendslist?.friends ?? [];
            this.setCache(cacheKey, friends);
            return friends;
        } catch (err) {
            this.logger.warn(`Failed to fetch friend list for ${steamId}: ${(err as Error).message}`);
            return null;
        }
    }

    private async fetchPlayerAchievements(steamId: string, appId: string): Promise<SteamAchievement[] | null> {
        if (!this.apiKey) return null;

        const cacheKey = `achievements:${steamId}:${appId}`;
        const cached = this.getCached<SteamAchievement[]>(cacheKey);
        if (cached) return cached;

        try {
            this.logger.debug(`Steam API: GetPlayerAchievements for ${steamId}, app ${appId}`);
            const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${this.apiKey}&steamid=${steamId}&appid=${appId}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(this.API_TIMEOUT) });
            if (!res.ok) return null;

            const json = (await res.json()) as SteamAchievementsResponse;
            const achievements = json.playerstats?.achievements ?? [];
            this.setCache(cacheKey, achievements);
            return achievements;
        } catch (err) {
            this.logger.warn(`Failed to fetch achievements for ${steamId}, app ${appId}: ${(err as Error).message}`);
            return null;
        }
    }

    // ── Service methods ─────────────────────────────────────────────────────

    async linkSteam(userId: string, steamId: string): Promise<SteamProfileDto> {
        const existing = await this.profileRepo.findOne({ where: { userId } });
        if (existing) {
            throw new Error("Steam account already linked. Unlink first.");
        }

        const duplicate = await this.profileRepo.findOne({ where: { steamId } });
        if (duplicate) {
            throw new Error("This Steam account is already linked to another user.");
        }

        const steamData = await this.fetchSteamProfile(steamId);

        const profile = this.profileRepo.create({
            userId,
            steamId,
            personaName: steamData?.personaname ?? steamId,
            avatarUrl: steamData?.avatarfull ?? null,
            profileUrl: steamData?.profileurl ?? null,
            onlineStatus: steamData?.personastate ?? 0,
            currentGame: steamData?.gameextrainfo ?? null,
            gameCount: 0,
            lastSynced: new Date()
        });

        // Fetch game count if possible
        const ownedGames = await this.fetchOwnedGames(steamId);
        if (ownedGames) {
            profile.gameCount = ownedGames.game_count ?? 0;
        }

        const saved = await this.profileRepo.save(profile);
        return this.toDto(saved);
    }

    async unlinkSteam(userId: string): Promise<void> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }
        await this.profileRepo.remove(profile);
    }

    async getSteamProfile(userId: string): Promise<SteamProfileDto | null> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) return null;
        return this.toDto(profile);
    }

    async getPublicSteamProfile(userId: string): Promise<SteamProfileDto | null> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile || !profile.isPublic) return null;
        return this.toDto(profile);
    }

    async syncProfile(userId: string): Promise<SteamProfileDto | null> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }

        const steamData = await this.fetchSteamProfile(profile.steamId);
        if (steamData) {
            profile.personaName = steamData.personaname;
            profile.avatarUrl = steamData.avatarfull ?? null;
            profile.profileUrl = steamData.profileurl ?? null;
            profile.onlineStatus = steamData.personastate ?? 0;
            profile.currentGame = steamData.gameextrainfo ?? null;
        }

        const ownedGames = await this.fetchOwnedGames(profile.steamId);
        if (ownedGames) {
            profile.gameCount = ownedGames.game_count ?? 0;
        }

        profile.lastSynced = new Date();
        const saved = await this.profileRepo.save(profile);
        return this.toDto(saved);
    }

    async getOwnedGames(userId: string): Promise<SteamGameDto[]> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }

        const data = await this.fetchOwnedGames(profile.steamId);
        if (!data?.games) return [];

        return data.games.map((g) => ({
            appId: g.appid,
            name: g.name,
            playtimeForever: g.playtime_forever,
            playtime2Weeks: g.playtime_2weeks,
            iconUrl: g.img_icon_url
                ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
                : ""
        }));
    }

    async getRecentGames(userId: string): Promise<SteamGameDto[]> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }

        const games = await this.fetchRecentGames(profile.steamId);
        if (!games) return [];

        return games.map((g) => ({
            appId: g.appid,
            name: g.name,
            playtimeForever: g.playtime_forever,
            playtime2Weeks: g.playtime_2weeks,
            iconUrl: g.img_icon_url
                ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
                : ""
        }));
    }

    async getAchievements(userId: string, appId: string): Promise<SteamAchievementDto[]> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }

        const achievements = await this.fetchPlayerAchievements(profile.steamId, appId);
        if (!achievements) return [];

        return achievements.map((a) => ({
            apiName: a.apiname,
            name: a.name ?? a.apiname,
            description: a.description ?? "",
            achieved: a.achieved === 1,
            unlockTime: a.unlocktime
        }));
    }

    async syncFriends(userId: string): Promise<{ matched: number; total: number }> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }

        if (!profile.syncFriends) {
            return { matched: 0, total: 0 };
        }

        const friends = await this.fetchFriendList(profile.steamId);
        if (!friends || friends.length === 0) {
            return { matched: 0, total: 0 };
        }

        const friendSteamIds = friends.map((f) => f.steamid);

        // Find registered users who have linked these Steam IDs
        const matchedProfiles = await this.profileRepo
            .createQueryBuilder("sp")
            .where("sp.steam_id IN (:...steamIds)", { steamIds: friendSteamIds })
            .andWhere("sp.user_id != :userId", { userId })
            .getMany();

        return { matched: matchedProfiles.length, total: friends.length };
    }

    async updateSettings(userId: string, dto: UpdateSteamSettingsDto): Promise<SteamProfileDto> {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            throw new NotFoundException("No Steam account linked");
        }

        if (dto.isPublic !== undefined) profile.isPublic = dto.isPublic;
        if (dto.syncFriends !== undefined) profile.syncFriends = dto.syncFriends;

        const saved = await this.profileRepo.save(profile);
        return this.toDto(saved);
    }

    async getAdminView(userId: string): Promise<object | null> {
        const profile = await this.profileRepo.findOne({ where: { userId }, relations: ["user"] });
        if (!profile) return null;

        return {
            id: profile.id,
            userId: profile.userId,
            username: profile.user?.username ?? null,
            steamId: profile.steamId,
            personaName: profile.personaName,
            avatarUrl: profile.avatarUrl,
            profileUrl: profile.profileUrl,
            onlineStatus: profile.onlineStatus,
            currentGame: profile.currentGame,
            gameCount: profile.gameCount,
            isPublic: profile.isPublic,
            syncFriends: profile.syncFriends,
            lastSynced: profile.lastSynced?.toISOString() ?? null,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt.toISOString()
        };
    }

    async getAllLinkedProfiles(): Promise<object[]> {
        const profiles = await this.profileRepo.find({
            relations: ["user"],
            order: { createdAt: "DESC" }
        });

        return profiles.map((p) => ({
            id: p.id,
            userId: p.userId,
            username: p.user?.username ?? null,
            steamId: p.steamId,
            personaName: p.personaName,
            avatarUrl: p.avatarUrl,
            gameCount: p.gameCount,
            isPublic: p.isPublic,
            lastSynced: p.lastSynced?.toISOString() ?? null,
            createdAt: p.createdAt.toISOString()
        }));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private toDto(profile: SteamProfileEntity): SteamProfileDto {
        return {
            id: profile.id,
            userId: profile.userId,
            steamId: profile.steamId,
            personaName: profile.personaName,
            avatarUrl: profile.avatarUrl,
            profileUrl: profile.profileUrl,
            onlineStatus: profile.onlineStatus,
            currentGame: profile.currentGame,
            gameCount: profile.gameCount,
            isPublic: profile.isPublic,
            syncFriends: profile.syncFriends,
            lastSynced: profile.lastSynced?.toISOString() ?? null
        };
    }

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (entry && entry.expiry > Date.now()) {
            return entry.data as T;
        }
        return null;
    }

    private setCache(key: string, data: unknown): void {
        this.cache.set(key, { data, expiry: Date.now() + this.CACHE_TTL });
    }
}
