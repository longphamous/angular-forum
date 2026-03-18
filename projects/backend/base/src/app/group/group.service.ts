import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { UserProfile } from "../user/models/user.model";
import { GroupEntity } from "./entities/group.entity";

export interface GroupDto {
    createdAt: string;
    description?: string;
    id: string;
    isSystem: boolean;
    name: string;
    updatedAt: string;
    userCount: number;
}

export interface CreateGroupDto {
    description?: string;
    name: string;
}

export interface UpdateGroupDto {
    description?: string;
    name?: string;
}

function toGroupDto(group: GroupEntity): GroupDto {
    return {
        createdAt: group.createdAt.toISOString(),
        description: group.description,
        id: group.id,
        isSystem: group.isSystem,
        name: group.name,
        updatedAt: group.updatedAt.toISOString(),
        userCount: group.users?.length ?? 0
    };
}

function toUserProfile(user: UserEntity): UserProfile {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        status: user.status,
        groups: user.groups?.map((g) => g.name) ?? [],
        postCount: 0,
        level: 1,
        levelName: "Neuling",
        xp: 0,
        xpToNextLevel: 100,
        xpProgressPercent: 0,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString()
    };
}

@Injectable()
export class GroupService {
    constructor(
        @InjectRepository(GroupEntity)
        private readonly groupRepo: Repository<GroupEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) {}

    async findAll(): Promise<GroupDto[]> {
        const groups = await this.groupRepo.find({ relations: { users: true }, order: { name: "ASC" } });
        return groups.map(toGroupDto);
    }

    async findOne(id: string): Promise<GroupDto> {
        return toGroupDto(await this.findById(id));
    }

    async create(dto: CreateGroupDto): Promise<GroupDto> {
        if (await this.groupRepo.existsBy({ name: dto.name })) {
            throw new BadRequestException(`Group "${dto.name}" already exists`);
        }
        const group = this.groupRepo.create({ name: dto.name, description: dto.description, isSystem: false });
        await this.groupRepo.save(group);
        return toGroupDto(group);
    }

    async update(id: string, dto: UpdateGroupDto): Promise<GroupDto> {
        const group = await this.findById(id);
        if (dto.name !== undefined) group.name = dto.name;
        if (dto.description !== undefined) group.description = dto.description;
        await this.groupRepo.save(group);
        return toGroupDto(group);
    }

    async remove(id: string): Promise<void> {
        const group = await this.findById(id);
        if (group.isSystem) {
            throw new BadRequestException(`System group "${group.name}" cannot be deleted`);
        }
        await this.groupRepo.remove(group);
    }

    async getUsersInGroup(id: string): Promise<UserProfile[]> {
        const group = await this.findById(id);
        return (group.users ?? []).map(toUserProfile);
    }

    async setGroupUsers(id: string, userIds: string[]): Promise<GroupDto> {
        const group = await this.findById(id);
        const users = await this.userRepo.findBy({ id: In(userIds) });
        group.users = users;
        await this.groupRepo.save(group);
        return toGroupDto(group);
    }

    async addUserToGroup(groupId: string, userId: string): Promise<void> {
        const group = await this.findById(groupId);
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: { groups: true } });
        if (!user) throw new NotFoundException(`User "${userId}" not found`);
        const already = (group.users ?? []).some((u) => u.id === userId);
        if (!already) {
            group.users = [...(group.users ?? []), user];
            await this.groupRepo.save(group);
        }
    }

    async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
        const group = await this.findById(groupId);
        group.users = (group.users ?? []).filter((u) => u.id !== userId);
        await this.groupRepo.save(group);
    }

    async getUserGroups(userId: string): Promise<GroupDto[]> {
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: { groups: true } });
        if (!user) throw new NotFoundException(`User "${userId}" not found`);
        return (user.groups ?? []).map(toGroupDto);
    }

    async setUserGroups(userId: string, groupIds: string[]): Promise<UserProfile> {
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: { groups: true } });
        if (!user) throw new NotFoundException(`User "${userId}" not found`);
        const groups = await this.groupRepo.findBy({ id: In(groupIds) });
        user.groups = groups;
        await this.userRepo.save(user);
        return toUserProfile(user);
    }

    private async findById(id: string): Promise<GroupEntity> {
        const group = await this.groupRepo.findOne({ where: { id }, relations: { users: true } });
        if (!group) throw new NotFoundException(`Group "${id}" not found`);
        return group;
    }
}
