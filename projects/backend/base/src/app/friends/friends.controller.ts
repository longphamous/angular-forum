import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import {
    FriendRequestDto,
    FriendshipStatusResult,
    FriendsService,
    FriendUserDto,
    MutualFriendDto
} from "./friends.service";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) {}

    @Post("request/:targetUserId")
    async sendRequest(
        @CurrentUser() user: AuthenticatedUser,
        @Param("targetUserId") targetUserId: string
    ): Promise<FriendRequestDto> {
        return this.friendsService.sendRequest(user.userId, targetUserId);
    }

    @Post(":id/accept")
    async acceptRequest(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<FriendUserDto> {
        return this.friendsService.acceptRequest(user.userId, id);
    }

    @Post(":id/decline")
    @HttpCode(HttpStatus.NO_CONTENT)
    async declineRequest(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
        return this.friendsService.declineRequest(user.userId, id);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFriendship(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
        const friendship = await this.friendsService.getFriendshipById(id, user.userId);
        if (friendship.status === "pending") {
            return this.friendsService.cancelRequest(user.userId, id);
        }
        // For accepted friendships, determine the friend's ID
        const friendId = friendship.requesterId === user.userId ? friendship.addresseeId : friendship.requesterId;
        return this.friendsService.removeFriend(user.userId, friendId);
    }

    @Get()
    async getFriends(@CurrentUser() user: AuthenticatedUser): Promise<FriendUserDto[]> {
        return this.friendsService.getFriends(user.userId);
    }

    @Get("requests/incoming")
    async getIncomingRequests(@CurrentUser() user: AuthenticatedUser): Promise<FriendRequestDto[]> {
        return this.friendsService.getIncomingRequests(user.userId);
    }

    @Get("requests/outgoing")
    async getOutgoingRequests(@CurrentUser() user: AuthenticatedUser): Promise<FriendRequestDto[]> {
        return this.friendsService.getOutgoingRequests(user.userId);
    }

    @Get("status/:targetUserId")
    async getFriendshipStatus(
        @CurrentUser() user: AuthenticatedUser,
        @Param("targetUserId") targetUserId: string
    ): Promise<FriendshipStatusResult> {
        return this.friendsService.getFriendshipStatus(user.userId, targetUserId);
    }

    @Get("mutual/:targetUserId")
    async getMutualFriends(
        @CurrentUser() user: AuthenticatedUser,
        @Param("targetUserId") targetUserId: string
    ): Promise<MutualFriendDto[]> {
        return this.friendsService.getMutualFriends(user.userId, targetUserId);
    }

    @Get("count")
    async getFriendCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
        const count = await this.friendsService.getFriendCount(user.userId);
        return { count };
    }
}
