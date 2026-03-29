import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { ManageProjectMemberDto } from "../dto/manage-project-member.dto";
import { type ProjectMemberRole, TicketProjectMemberEntity } from "../entities/ticket-project-member.entity";
import type { ProjectMemberDto } from "../models/ticket.model";

@Injectable()
export class TicketProjectMemberService {
    constructor(
        @InjectRepository(TicketProjectMemberEntity) private readonly memberRepo: Repository<TicketProjectMemberEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>
    ) {}

    async getMembers(projectId: string): Promise<ProjectMemberDto[]> {
        const members = await this.memberRepo.find({ where: { projectId }, order: { role: "ASC", createdAt: "ASC" } });
        const userIds = members.map((m) => m.userId);
        const userMap = await this.getUserMap(userIds);
        return members.map((m) => this.toDto(m, userMap));
    }

    async addMember(projectId: string, dto: ManageProjectMemberDto): Promise<ProjectMemberDto> {
        const existing = await this.memberRepo.findOne({ where: { projectId, userId: dto.userId } });
        if (existing) {
            existing.role = dto.role;
            const saved = await this.memberRepo.save(existing);
            const userMap = await this.getUserMap([saved.userId]);
            return this.toDto(saved, userMap);
        }

        const member = this.memberRepo.create({ projectId, userId: dto.userId, role: dto.role });
        const saved = await this.memberRepo.save(member);
        const userMap = await this.getUserMap([saved.userId]);
        return this.toDto(saved, userMap);
    }

    async removeMember(id: string): Promise<void> {
        const member = await this.memberRepo.findOne({ where: { id } });
        if (!member) throw new NotFoundException(`Member "${id}" not found`);
        await this.memberRepo.remove(member);
    }

    async checkPermission(projectId: string, userId: string, requiredRole: ProjectMemberRole): Promise<boolean> {
        const member = await this.memberRepo.findOne({ where: { projectId, userId } });
        if (!member) return false;
        const roleHierarchy: Record<string, number> = { admin: 3, developer: 2, viewer: 1 };
        return (roleHierarchy[member.role] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
    }

    private toDto(m: TicketProjectMemberEntity, userMap: Map<string, string>): ProjectMemberDto {
        return {
            id: m.id,
            projectId: m.projectId,
            userId: m.userId,
            userName: userMap.get(m.userId),
            role: m.role,
            createdAt: m.createdAt.toISOString()
        };
    }

    private async getUserMap(ids: string[]): Promise<Map<string, string>> {
        if (!ids.length) return new Map();
        const users = await this.userRepo.findBy({ id: In([...new Set(ids)]) });
        return new Map(users.map((u) => [u.id, u.displayName]));
    }
}
