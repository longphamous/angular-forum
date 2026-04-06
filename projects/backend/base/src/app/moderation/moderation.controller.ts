import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { ProfileApprovalType } from "./entities/profile-approval.entity";
import { ModerationService } from "./moderation.service";

@ApiTags("Moderation")
@ApiBearerAuth("JWT")
@Controller("moderation")
export class ModerationController {
    constructor(private readonly moderationService: ModerationService) {}

    // ── User endpoints ────────────────────────────────────────────────────────

    @Get("my-status")
    getMyStatus(@CurrentUser() user: AuthenticatedUser): Promise<ProfileApprovalType[]> {
        return this.moderationService.getUserPendingStatus(user.userId);
    }

    @Post("submit")
    async submit(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { type: ProfileApprovalType; oldValue?: string; newValue: string }
    ): Promise<{ id: string; status: string }> {
        const entry = await this.moderationService.submitForApproval(
            user.userId,
            body.type,
            body.oldValue ?? null,
            body.newValue
        );
        return { id: entry.id, status: entry.status };
    }

    // ── Admin / Moderator endpoints ───────────────────────────────────────────

    @Roles("admin", "moderator")
    @Get("pending")
    getPending(@Query("page") page = "1", @Query("limit") limit = "20") {
        return this.moderationService.getPendingApprovals(
            Math.max(parseInt(page) || 1, 1),
            Math.min(Math.max(parseInt(limit) || 20, 1), 100)
        );
    }

    @Roles("admin", "moderator")
    @Get("history")
    getHistory(@Query("page") page = "1", @Query("limit") limit = "20") {
        return this.moderationService.getHistory(
            Math.max(parseInt(page) || 1, 1),
            Math.min(Math.max(parseInt(limit) || 20, 1), 100)
        );
    }

    @Roles("admin", "moderator")
    @Get("stats")
    getStats() {
        return this.moderationService.getStats();
    }

    @Roles("admin", "moderator")
    @Post("approve/:id")
    async approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: { note?: string }) {
        return this.moderationService.approveEntry(id, user.userId, body.note);
    }

    @Roles("admin", "moderator")
    @Post("reject/:id")
    async reject(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: { note?: string }) {
        return this.moderationService.rejectEntry(id, user.userId, body.note);
    }
}
