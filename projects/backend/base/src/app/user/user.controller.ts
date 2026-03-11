import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthSession, UserProfile } from "./models/user.model";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
    constructor(private readonly userService: UserService) {}

    // ─── Auth (public – no token required) ───────────────────────────────────

    /**
     * POST /user/register
     * Registers a new user. Returns the public profile (no token yet).
     */
    @Public()
    @Post("register")
    register(@Body() dto: RegisterDto): Promise<UserProfile> {
        return this.userService.register(dto);
    }

    /**
     * POST /user/login
     * Authenticates a user. Returns a JWT access + refresh token pair and the public profile.
     */
    @Public()
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
     */
    @Get("profile/:userId")
    getProfile(@Param("userId") userId: string): Promise<UserProfile> {
        return this.userService.getProfile(userId);
    }

    /**
     * PUT /user/profile
     * Updates the profile of the currently authenticated user.
     * Body: { displayName?, avatarUrl?, bio? }
     */
    @Put("profile")
    updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto): Promise<UserProfile> {
        return this.userService.updateProfile(user.userId, dto);
    }

    // ─── Admin (admin role required) ──────────────────────────────────────────

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
