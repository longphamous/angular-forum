import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "../../auth/current-user.decorator";
import type { AuthenticatedUser } from "../../auth/models/jwt.model";
import { CreateApplicationDto } from "../dto/create-application.dto";
import { ManageMemberDto } from "../dto/manage-member.dto";
import type { ClanApplicationDto, ClanMemberDto } from "../models/clan.model";
import { ClanMemberService } from "../services/clan-member.service";

@Controller("clans")
export class ClanMemberController {
    constructor(private readonly clanMemberService: ClanMemberService) {}

    /**
     * GET /clans/:id/members
     * Returns all members of a clan.
     */
    @Get(":id/members")
    getMembers(@Param("id", ParseUUIDPipe) id: string): Promise<ClanMemberDto[]> {
        return this.clanMemberService.getMembers(id);
    }

    /**
     * POST /clans/:id/join
     * Join a clan. Behavior depends on the clan's joinType.
     */
    @Post(":id/join")
    async join(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto?: CreateApplicationDto
    ): Promise<{ success: boolean }> {
        await this.clanMemberService.join(id, user.userId, dto);
        return { success: true };
    }

    /**
     * POST /clans/:id/leave
     * Leave a clan. The owner cannot leave.
     */
    @Post(":id/leave")
    async leave(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.clanMemberService.leave(id, user.userId);
        return { success: true };
    }

    /**
     * POST /clans/:id/invite
     * Invite a user to the clan. Requires admin/owner role.
     */
    @Post(":id/invite")
    async invite(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body("userId", ParseUUIDPipe) targetUserId: string
    ): Promise<{ success: boolean }> {
        await this.clanMemberService.invite(id, user.userId, targetUserId);
        return { success: true };
    }

    /**
     * GET /clans/:id/applications
     * Returns pending applications for a clan. Requires admin/owner role.
     */
    @Get(":id/applications")
    getApplications(@Param("id", ParseUUIDPipe) id: string): Promise<ClanApplicationDto[]> {
        return this.clanMemberService.getApplications(id);
    }

    /**
     * POST /clans/:id/applications/:appId/accept
     * Accept a clan application. Requires admin/owner role.
     */
    @Post(":id/applications/:appId/accept")
    async acceptApplication(
        @Param("appId", ParseUUIDPipe) appId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.clanMemberService.acceptApplication(appId, user.userId);
        return { success: true };
    }

    /**
     * POST /clans/:id/applications/:appId/decline
     * Decline a clan application. Requires admin/owner role.
     */
    @Post(":id/applications/:appId/decline")
    async declineApplication(
        @Param("appId", ParseUUIDPipe) appId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.clanMemberService.declineApplication(appId, user.userId);
        return { success: true };
    }

    /**
     * PATCH /clans/:id/members/:memberId
     * Change a member's role. Cannot change the owner's role.
     */
    @Patch(":id/members/:memberId")
    changeMemberRole(
        @Param("memberId", ParseUUIDPipe) memberId: string,
        @Body() dto: ManageMemberDto
    ): Promise<ClanMemberDto> {
        return this.clanMemberService.changeMemberRole(memberId, dto);
    }

    /**
     * DELETE /clans/:id/members/:memberId
     * Kick a member from the clan. The kicker must outrank the target.
     */
    @Delete(":id/members/:memberId")
    async kickMember(
        @Param("memberId", ParseUUIDPipe) memberId: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<{ success: boolean }> {
        await this.clanMemberService.kickMember(memberId, user.userId);
        return { success: true };
    }
}
