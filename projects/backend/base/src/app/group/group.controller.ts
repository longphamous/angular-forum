import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/auth.decorators";
import { UserProfile } from "../user/models/user.model";
import { CreateGroupDto, GroupDto, GroupService, UpdateGroupDto } from "./group.service";

@ApiTags("Groups")
@ApiBearerAuth("JWT")
@Controller("group")
export class GroupController {
    constructor(private readonly groupService: GroupService) {}

    /**
     * GET /group
     * Lists all groups.
     */
    @Get()
    findAll(): Promise<GroupDto[]> {
        return this.groupService.findAll();
    }

    /**
     * GET /group/:id
     * Returns a single group.
     */
    @Get(":id")
    findOne(@Param("id") id: string): Promise<GroupDto> {
        return this.groupService.findOne(id);
    }

    /**
     * POST /group
     * Creates a new group. Requires admin role.
     */
    @Roles("admin")
    @Post()
    create(@Body() dto: CreateGroupDto): Promise<GroupDto> {
        return this.groupService.create(dto);
    }

    /**
     * PATCH /group/:id
     * Updates a group. Requires admin role.
     */
    @Roles("admin")
    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateGroupDto): Promise<GroupDto> {
        return this.groupService.update(id, dto);
    }

    /**
     * DELETE /group/:id
     * Deletes a non-system group. Requires admin role.
     */
    @Roles("admin")
    @Delete(":id")
    async remove(@Param("id") id: string): Promise<{ success: boolean }> {
        await this.groupService.remove(id);
        return { success: true };
    }

    /**
     * GET /group/:id/users
     * Lists all users in a group. Requires admin role.
     */
    @Roles("admin")
    @Get(":id/users")
    getUsersInGroup(@Param("id") id: string): Promise<UserProfile[]> {
        return this.groupService.getUsersInGroup(id);
    }

    /**
     * PUT /group/:id/users
     * Replaces the user list for a group. Body: { userIds: string[] }. Requires admin role.
     */
    @Roles("admin")
    @Put(":id/users")
    setGroupUsers(@Param("id") id: string, @Body() body: { userIds: string[] }): Promise<GroupDto> {
        return this.groupService.setGroupUsers(id, body.userIds);
    }

    /**
     * POST /group/:id/users/:userId
     * Adds a user to a group. Requires admin role.
     */
    @Roles("admin")
    @Post(":id/users/:userId")
    async addUser(@Param("id") id: string, @Param("userId") userId: string): Promise<{ success: boolean }> {
        await this.groupService.addUserToGroup(id, userId);
        return { success: true };
    }

    /**
     * DELETE /group/:id/users/:userId
     * Removes a user from a group. Requires admin role.
     */
    @Roles("admin")
    @Delete(":id/users/:userId")
    async removeUser(@Param("id") id: string, @Param("userId") userId: string): Promise<{ success: boolean }> {
        await this.groupService.removeUserFromGroup(id, userId);
        return { success: true };
    }

    /**
     * GET /group/user/:userId/groups
     * Returns groups of a user. Requires admin role.
     */
    @Roles("admin")
    @Get("user/:userId/groups")
    getUserGroups(@Param("userId") userId: string): Promise<GroupDto[]> {
        return this.groupService.getUserGroups(userId);
    }

    /**
     * PUT /group/user/:userId/groups
     * Sets the groups for a user. Body: { groupIds: string[] }. Requires admin role.
     */
    @Roles("admin")
    @Put("user/:userId/groups")
    setUserGroups(@Param("userId") userId: string, @Body() body: { groupIds: string[] }): Promise<UserProfile> {
        return this.groupService.setUserGroups(userId, body.groupIds);
    }
}
