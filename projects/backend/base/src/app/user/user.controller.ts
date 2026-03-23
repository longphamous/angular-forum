import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { Public, Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { NotificationsService } from "../notifications/notifications.service";
import { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthSession, UserProfile } from "./models/user.model";
import { OnlineUserDto, UserService } from "./user.service";

@Controller("user")
export class UserController {
    /** In-memory cache to throttle profile-visit notifications: key = "visitorId:profileId", value = timestamp */
    private readonly profileVisitCache = new Map<string, number>();
    private static readonly PROFILE_VISIT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    constructor(
        private readonly userService: UserService,
        private readonly notificationsService: NotificationsService
    ) {}

    // ─── Auth (public – no token required) ───────────────────────────────────

    /**
     * POST /user/register
     * Registers a new user. Returns the public profile (no token yet).
     */
    @Public()
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @Post("register")
    register(@Body() dto: RegisterDto): Promise<UserProfile> {
        return this.userService.register(dto);
    }

    /**
     * POST /user/login
     * Authenticates a user. Returns a JWT access + refresh token pair and the public profile.
     */
    @Public()
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Post("login")
    login(@Body() dto: LoginDto): Promise<{ session: AuthSession; profile: UserProfile }> {
        return this.userService.login(dto);
    }

    /**
     * POST /user/refresh
     * Issues a new token pair using a valid refresh token.
     * Body: { refreshToken: string }
     */
    @Public()
    @Post("refresh")
    refresh(@Body() body: { refreshToken: string }): Promise<AuthSession> {
        return this.userService.refreshTokens(body.refreshToken);
    }

    // ─── Online presence (public) ─────────────────────────────────────────────

    /**
     * GET /user/online
     * Returns users who were seen today or in the last 24 h.
     */
    @Public()
    @Get("online")
    getOnlineUsers(
        @Query("window") window = "today",
        @Query("sort") sort = "lastSeen",
        @Query("order") order = "desc",
        @Query("limit") limit = "20"
    ): Promise<OnlineUserDto[]> {
        return this.userService.findOnlineUsers({
            window: window === "24h" ? "24h" : "today",
            sort: sort === "username" ? "username" : "lastSeen",
            order: order === "asc" ? "asc" : "desc",
            limit: Math.min(Math.max(parseInt(limit) || 20, 1), 100)
        });
    }

    /**
     * GET /user/online-ids
     * Returns IDs of users seen within the last 5 minutes.
     */
    @Public()
    @Get("online-ids")
    getOnlineUserIds(): Promise<string[]> {
        return this.userService.getOnlineUserIds();
    }

    // ─── Profile (any authenticated user) ────────────────────────────────────

    /**
     * GET /user/me
     * Returns the profile of the currently authenticated user.
     */
    @Get("me")
    getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfile> {
        return this.userService.getProfile(user.userId);
    }

    /**
     * GET /user/profile/:userId
     * Returns the public profile of any user.
     * Sensitive fields (email, lastLoginAt) are stripped for non-owners.
     */
    @Get("profile/:userId")
    async getProfile(
        @Param("userId") userId: string,
        @CurrentUser() currentUser?: AuthenticatedUser
    ): Promise<UserProfile> {
        const profile = await this.userService.getProfile(userId);
        const isOwner = currentUser?.userId === userId;
        const isAdmin = currentUser?.role === "admin";

        // Send profile-visit notification (fire-and-forget, throttled to once per 24h per visitor)
        if (currentUser && !isOwner) {
            const cacheKey = `${currentUser.userId}:${userId}`;
            const lastVisit = this.profileVisitCache.get(cacheKey);
            const now = Date.now();
            if (!lastVisit || now - lastVisit > UserController.PROFILE_VISIT_COOLDOWN_MS) {
                this.profileVisitCache.set(cacheKey, now);
                void this.notificationsService
                    .create(
                        userId,
                        "system",
                        "Profile visited",
                        `${currentUser.username} has visited your profile.`,
                        `/users/${currentUser.userId}`
                    )
                    .catch(() => undefined);
            }
        }

        if (!isOwner && !isAdmin) {
            return { ...profile, email: "" };
        }
        return profile;
    }

    /**
     * PUT /user/profile
     * Updates the profile of the currently authenticated user.
     * Body: { displayName?, avatarUrl?, bio? }
     */
    @Patch("profile")
    updateProfile(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateProfileDto
    ): Promise<{ profile: UserProfile; pendingFields?: string[] }> {
        return this.userService.updateProfile(user.userId, dto);
    }

    // ─── Admin (admin role required) ──────────────────────────────────────────

    /**
     * GET /user/search?q=<query>&limit=<n>
     * Searches users by username or display name. Requires admin role.
     */
    /**
     * GET /user/autocomplete?q=<query>
     * Lightweight user search for autocomplete. Available to all authenticated users.
     */
    @Get("autocomplete")
    autocompleteUsers(
        @Query("q") q = ""
    ): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
        return this.userService.autocompleteUsers(q);
    }

    @Roles("admin")
    @Get("search")
    searchUsers(
        @Query("q") q = "",
        @Query("limit") limit = "10"
    ): Promise<{ id: string; username: string; displayName: string }[]> {
        return this.userService.searchUsers(q, Math.min(Math.max(parseInt(limit) || 10, 1), 50));
    }

    /**
     * GET /user
     * Lists all user profiles. Requires admin role.
     */
    @Roles("admin")
    @Get()
    getAllUsers(): Promise<UserProfile[]> {
        return this.userService.getAllUsers();
    }

    /**
     * POST /user/admin
     * Creates a new user with a custom role and status. Requires admin role.
     */
    @Roles("admin")
    @Post("admin")
    adminCreateUser(@Body() dto: AdminCreateUserDto): Promise<UserProfile> {
        return this.userService.adminCreateUser(dto);
    }

    /**
     * PATCH /user/:userId
     * Updates a user's role, status, or profile. Requires admin role.
     */
    @Roles("admin")
    @Patch(":userId")
    adminUpdateUser(@Param("userId") userId: string, @Body() dto: AdminUpdateUserDto): Promise<UserProfile> {
        return this.userService.adminUpdateUser(userId, dto);
    }

    /**
     * DELETE /user/:userId
     * Deletes a user account. Requires admin role.
     */
    @Roles("admin")
    @Delete(":userId")
    async deleteUser(@Param("userId") userId: string): Promise<{ success: boolean }> {
        await this.userService.deleteUser(userId);
        return { success: true };
    }
}
