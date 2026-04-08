import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { ActivityService } from "../activity/activity.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { PushFriendAccepted, PushFriendRequest } from "../push/push-event.types";
import { QuestService } from "../rpg/quest.service";
import { UserEntity } from "../user/entities/user.entity";
import { FriendshipEntity } from "./entities/friendship.entity";

export interface FriendUserDto {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    friendshipId: string;
    friendsSince: string;
}

export interface FriendRequestDto {
    id: string;
    user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    createdAt: string;
}

export type FriendshipStatusDto = "none" | "pending_sent" | "pending_received" | "friends" | "blocked";

export interface FriendshipStatusResult {
    status: FriendshipStatusDto;
    friendshipId: string | null;
}

export interface MutualFriendDto {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}

@Injectable()
export class FriendsService {
    constructor(
        @InjectRepository(FriendshipEntity)
        private readonly friendshipRepo: Repository<FriendshipEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService,
        private readonly pushService: PushService,
        private readonly activityService: ActivityService,
        private readonly questService: QuestService
    ) {}

    async sendRequest(requesterId: string, addresseeId: string): Promise<FriendRequestDto> {
        if (requesterId === addresseeId) {
            throw new BadRequestException("You cannot send a friend request to yourself.");
        }

        const existing = await this.friendshipRepo.findOne({
            where: [
                { requesterId, addresseeId },
                { requesterId: addresseeId, addresseeId: requesterId }
            ]
        });

        if (existing) {
            if (existing.status === "blocked") {
                throw new ForbiddenException("This action is not allowed.");
            }
            if (existing.status === "pending") {
                throw new BadRequestException("A friend request already exists.");
            }
            if (existing.status === "accepted") {
                throw new BadRequestException("You are already friends.");
            }
        }

        const addressee = await this.userRepo.findOne({ where: { id: addresseeId } });
        if (!addressee) {
            throw new NotFoundException("User not found.");
        }

        const requester = await this.userRepo.findOne({ where: { id: requesterId } });
        if (!requester) {
            throw new NotFoundException("Requester not found.");
        }

        const friendship = this.friendshipRepo.create({
            requesterId,
            addresseeId,
            status: "pending"
        });
        const saved = await this.friendshipRepo.save(friendship);
        void this.questService.trackProgress(requesterId, "add_friend").catch(() => undefined);

        await this.notificationsService.create(
            addresseeId,
            "friend_request",
            "Freundschaftsanfrage",
            `${requester.displayName} möchte mit dir befreundet sein.`,
            `/users/${requester.id}`,
            { friendshipId: saved.id }
        );

        // Push real-time friend request
        const pushPayload: PushFriendRequest = {
            friendshipId: saved.id,
            userId: requesterId,
            username: requester.username,
            displayName: requester.displayName,
            avatarUrl: requester.avatarUrl ?? null
        };
        this.pushService.sendToUser(addresseeId, "friend:request", pushPayload);

        return {
            id: saved.id,
            user: {
                id: addressee.id,
                username: addressee.username,
                displayName: addressee.displayName,
                avatarUrl: addressee.avatarUrl ?? null
            },
            createdAt: saved.createdAt.toISOString()
        };
    }

    async acceptRequest(userId: string, friendshipId: string): Promise<FriendUserDto> {
        const friendship = await this.friendshipRepo.findOne({ where: { id: friendshipId } });
        if (!friendship) {
            throw new NotFoundException("Friend request not found.");
        }

        if (friendship.addresseeId !== userId) {
            throw new ForbiddenException("You can only accept requests sent to you.");
        }

        if (friendship.status !== "pending") {
            throw new BadRequestException("This request is no longer pending.");
        }

        friendship.status = "accepted";
        const saved = await this.friendshipRepo.save(friendship);

        const requester = await this.userRepo.findOne({ where: { id: friendship.requesterId } });
        const addressee = await this.userRepo.findOne({ where: { id: userId } });

        // Push real-time friend accepted
        if (requester) {
            const acceptPush: PushFriendAccepted = {
                friendshipId: saved.id,
                userId,
                username: addressee?.username ?? "",
                displayName: addressee?.displayName ?? "",
                avatarUrl: addressee?.avatarUrl ?? null
            };
            this.pushService.sendToUser(friendship.requesterId, "friend:accepted", acceptPush);
        }

        if (addressee) {
            await this.notificationsService.create(
                friendship.requesterId,
                "friend_accepted",
                "Anfrage angenommen",
                `${addressee.displayName} hat deine Freundschaftsanfrage angenommen.`,
                `/users/${addressee.id}`
            );
        }

        void this.activityService.create(
            userId,
            "friend_added",
            `${addressee?.displayName ?? ""} & ${requester?.displayName ?? ""}`,
            undefined,
            `/users/${requester?.id ?? friendship.requesterId}`
        );

        return {
            id: requester?.id ?? friendship.requesterId,
            username: requester?.username ?? "",
            displayName: requester?.displayName ?? "",
            avatarUrl: requester?.avatarUrl ?? null,
            friendshipId: saved.id,
            friendsSince: saved.updatedAt.toISOString()
        };
    }

    async declineRequest(userId: string, friendshipId: string): Promise<void> {
        const friendship = await this.friendshipRepo.findOne({ where: { id: friendshipId } });
        if (!friendship) {
            throw new NotFoundException("Friend request not found.");
        }

        if (friendship.addresseeId !== userId) {
            throw new ForbiddenException("You can only decline requests sent to you.");
        }

        if (friendship.status !== "pending") {
            throw new BadRequestException("This request is no longer pending.");
        }

        await this.friendshipRepo.remove(friendship);
    }

    async cancelRequest(userId: string, friendshipId: string): Promise<void> {
        const friendship = await this.friendshipRepo.findOne({ where: { id: friendshipId } });
        if (!friendship) {
            throw new NotFoundException("Friend request not found.");
        }

        if (friendship.requesterId !== userId) {
            throw new ForbiddenException("You can only cancel your own requests.");
        }

        if (friendship.status !== "pending") {
            throw new BadRequestException("This request is no longer pending.");
        }

        await this.friendshipRepo.remove(friendship);
    }

    async removeFriend(userId: string, friendId: string): Promise<void> {
        const friendship = await this.friendshipRepo.findOne({
            where: [
                { requesterId: userId, addresseeId: friendId, status: "accepted" },
                { requesterId: friendId, addresseeId: userId, status: "accepted" }
            ]
        });

        if (!friendship) {
            throw new NotFoundException("Friendship not found.");
        }

        await this.friendshipRepo.remove(friendship);
    }

    async getFriends(userId: string): Promise<FriendUserDto[]> {
        const friendships = await this.friendshipRepo.find({
            where: [
                { requesterId: userId, status: "accepted" },
                { addresseeId: userId, status: "accepted" }
            ]
        });

        if (friendships.length === 0) {
            return [];
        }

        const friendIds = friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
        const users = await this.userRepo.find({ where: { id: In(friendIds) } });
        const userMap = new Map(users.map((u) => [u.id, u]));

        return friendships
            .map((f) => {
                const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
                const user = userMap.get(friendId);
                if (!user) return null;
                return {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl ?? null,
                    friendshipId: f.id,
                    friendsSince: f.updatedAt.toISOString()
                };
            })
            .filter((dto): dto is FriendUserDto => dto !== null);
    }

    async getIncomingRequests(userId: string): Promise<FriendRequestDto[]> {
        const requests = await this.friendshipRepo.find({
            where: { addresseeId: userId, status: "pending" },
            order: { createdAt: "DESC" }
        });

        if (requests.length === 0) {
            return [];
        }

        const requesterIds = requests.map((r) => r.requesterId);
        const users = await this.userRepo.find({ where: { id: In(requesterIds) } });
        const userMap = new Map(users.map((u) => [u.id, u]));

        return requests
            .map((r) => {
                const user = userMap.get(r.requesterId);
                if (!user) return null;
                return {
                    id: r.id,
                    user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl ?? null
                    },
                    createdAt: r.createdAt.toISOString()
                };
            })
            .filter((dto): dto is FriendRequestDto => dto !== null);
    }

    async getOutgoingRequests(userId: string): Promise<FriendRequestDto[]> {
        const requests = await this.friendshipRepo.find({
            where: { requesterId: userId, status: "pending" },
            order: { createdAt: "DESC" }
        });

        if (requests.length === 0) {
            return [];
        }

        const addresseeIds = requests.map((r) => r.addresseeId);
        const users = await this.userRepo.find({ where: { id: In(addresseeIds) } });
        const userMap = new Map(users.map((u) => [u.id, u]));

        return requests
            .map((r) => {
                const user = userMap.get(r.addresseeId);
                if (!user) return null;
                return {
                    id: r.id,
                    user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl ?? null
                    },
                    createdAt: r.createdAt.toISOString()
                };
            })
            .filter((dto): dto is FriendRequestDto => dto !== null);
    }

    async getFriendshipStatus(userId: string, targetId: string): Promise<FriendshipStatusResult> {
        const friendship = await this.friendshipRepo.findOne({
            where: [
                { requesterId: userId, addresseeId: targetId },
                { requesterId: targetId, addresseeId: userId }
            ]
        });

        if (!friendship) {
            return { status: "none", friendshipId: null };
        }

        if (friendship.status === "accepted") {
            return { status: "friends", friendshipId: friendship.id };
        }

        if (friendship.status === "blocked") {
            return { status: "blocked", friendshipId: friendship.id };
        }

        if (friendship.status === "pending") {
            if (friendship.requesterId === userId) {
                return { status: "pending_sent", friendshipId: friendship.id };
            }
            return { status: "pending_received", friendshipId: friendship.id };
        }

        return { status: "none", friendshipId: null };
    }

    async getMutualFriends(userId: string, targetId: string): Promise<MutualFriendDto[]> {
        const [userFriends, targetFriends] = await Promise.all([
            this.getFriendIds(userId),
            this.getFriendIds(targetId)
        ]);

        const mutualIds = userFriends.filter((id) => targetFriends.includes(id));

        if (mutualIds.length === 0) {
            return [];
        }

        const users = await this.userRepo.find({ where: { id: In(mutualIds) } });

        return users.map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl ?? null
        }));
    }

    async getFriendshipById(id: string, userId: string): Promise<FriendshipEntity> {
        const friendship = await this.friendshipRepo.findOne({ where: { id } });
        if (!friendship) {
            throw new NotFoundException("Friendship not found.");
        }
        if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
            throw new ForbiddenException("You are not part of this friendship.");
        }
        return friendship;
    }

    async getFriendCount(userId: string): Promise<number> {
        return this.friendshipRepo.count({
            where: [
                { requesterId: userId, status: "accepted" },
                { addresseeId: userId, status: "accepted" }
            ]
        });
    }

    private async getFriendIds(userId: string): Promise<string[]> {
        const friendships = await this.friendshipRepo.find({
            where: [
                { requesterId: userId, status: "accepted" },
                { addresseeId: userId, status: "accepted" }
            ]
        });

        return friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
    }
}
