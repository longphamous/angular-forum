import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../../notifications/notifications.service";
import { UserEntity } from "../../user/entities/user.entity";
import { CreateApplicationDto } from "../dto/create-application.dto";
import { ManageMemberDto } from "../dto/manage-member.dto";
import { ClanEntity } from "../entities/clan.entity";
import { ClanApplicationEntity } from "../entities/clan-application.entity";
import { ClanMemberEntity, type ClanMemberRole } from "../entities/clan-member.entity";
import type { ClanApplicationDto, ClanMemberDto } from "../models/clan.model";

const ROLE_HIERARCHY: Record<ClanMemberRole, number> = {
    owner: 4,
    admin: 3,
    moderator: 2,
    member: 1
};

@Injectable()
export class ClanMemberService {
    constructor(
        @InjectRepository(ClanEntity)
        private readonly clanRepo: Repository<ClanEntity>,
        @InjectRepository(ClanMemberEntity)
        private readonly memberRepo: Repository<ClanMemberEntity>,
        @InjectRepository(ClanApplicationEntity)
        private readonly applicationRepo: Repository<ClanApplicationEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    // ── Members ──────────────────────────────────────────────────────────────

    async getMembers(clanId: string): Promise<ClanMemberDto[]> {
        const members = await this.memberRepo.find({
            where: { clanId },
            order: { joinedAt: "ASC" }
        });

        const userIds = members.map((m) => m.userId);
        const userMap = await this.getUserMap(userIds);

        return members.map((m) => this.toMemberDto(m, userMap.get(m.userId)));
    }

    async join(clanId: string, userId: string, dto?: CreateApplicationDto): Promise<void> {
        const clan = await this.clanRepo.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }

        // Check if already a member
        const existing = await this.memberRepo.findOne({ where: { clanId, userId } });
        if (existing) {
            throw new BadRequestException("You are already a member of this clan");
        }

        switch (clan.joinType) {
            case "open":
                await this.addMember(clanId, userId, "member");
                await this.incrementMemberCount(clanId);
                break;
            case "application": {
                // Check for pending application
                const pendingApp = await this.applicationRepo.findOne({
                    where: { clanId, userId, status: "pending" }
                });
                if (pendingApp) {
                    throw new BadRequestException("You already have a pending application");
                }
                const application = this.applicationRepo.create({
                    clanId,
                    userId,
                    type: "application",
                    message: dto?.message,
                    status: "pending"
                });
                await this.applicationRepo.save(application);

                // Notify clan owner
                const user = await this.userRepo.findOne({ where: { id: userId } });
                await this.notificationsService.create(
                    clan.ownerId,
                    "clan_application_received",
                    "New clan application",
                    `${user?.displayName ?? "A user"} has applied to join ${clan.name}`,
                    `/clans/${clan.slug}`
                );
                break;
            }
            case "invite":
            case "moderated":
                throw new ForbiddenException("This clan does not accept direct join requests");
        }
    }

    async leave(clanId: string, userId: string): Promise<void> {
        const member = await this.memberRepo.findOne({ where: { clanId, userId } });
        if (!member) {
            throw new NotFoundException("You are not a member of this clan");
        }
        if (member.role === "owner") {
            throw new ForbiddenException("The clan owner cannot leave. Transfer ownership or disband the clan.");
        }

        await this.memberRepo.remove(member);
        await this.decrementMemberCount(clanId);
    }

    async invite(clanId: string, inviterId: string, targetUserId: string): Promise<void> {
        const clan = await this.clanRepo.findOneBy({ id: clanId });
        if (!clan) {
            throw new NotFoundException("Clan not found");
        }

        await this.verifyIsClanAdmin(clanId, inviterId);

        // Check if target is already a member
        const existing = await this.memberRepo.findOne({
            where: { clanId, userId: targetUserId }
        });
        if (existing) {
            throw new BadRequestException("User is already a member of this clan");
        }

        const invitation = this.applicationRepo.create({
            clanId,
            userId: targetUserId,
            invitedById: inviterId,
            type: "invitation",
            status: "pending"
        });
        await this.applicationRepo.save(invitation);

        const inviter = await this.userRepo.findOne({ where: { id: inviterId } });
        await this.notificationsService.create(
            targetUserId,
            "clan_invitation",
            "Clan invitation",
            `${inviter?.displayName ?? "Someone"} has invited you to join ${clan.name}`,
            `/clans/${clan.slug}`
        );
    }

    // ── Applications ─────────────────────────────────────────────────────────

    async getApplications(clanId: string): Promise<ClanApplicationDto[]> {
        const applications = await this.applicationRepo.find({
            where: { clanId, status: "pending" },
            order: { createdAt: "DESC" }
        });

        const userIds = [
            ...new Set([
                ...applications.map((a) => a.userId),
                ...applications.filter((a) => a.invitedById).map((a) => a.invitedById!)
            ])
        ];
        const userMap = await this.getUserMap(userIds);

        return applications.map((a) => this.toApplicationDto(a, userMap));
    }

    async acceptApplication(appId: string, userId: string): Promise<void> {
        const application = await this.applicationRepo.findOneBy({ id: appId });
        if (!application) {
            throw new NotFoundException("Application not found");
        }

        await this.verifyIsClanAdmin(application.clanId, userId);

        application.status = "approved";
        await this.applicationRepo.save(application);

        await this.addMember(application.clanId, application.userId, "member");
        await this.incrementMemberCount(application.clanId);

        const clan = await this.clanRepo.findOneBy({ id: application.clanId });
        await this.notificationsService.create(
            application.userId,
            "clan_application_accepted",
            "Application accepted",
            `Your application to join ${clan?.name ?? "a clan"} has been accepted`,
            `/clans/${clan?.slug}`
        );
    }

    async declineApplication(appId: string, userId: string): Promise<void> {
        const application = await this.applicationRepo.findOneBy({ id: appId });
        if (!application) {
            throw new NotFoundException("Application not found");
        }

        await this.verifyIsClanAdmin(application.clanId, userId);

        application.status = "rejected";
        await this.applicationRepo.save(application);

        const clan = await this.clanRepo.findOneBy({ id: application.clanId });
        await this.notificationsService.create(
            application.userId,
            "clan_application_declined",
            "Application declined",
            `Your application to join ${clan?.name ?? "a clan"} has been declined`,
            `/clans/${clan?.slug}`
        );
    }

    // ── Role management ──────────────────────────────────────────────────────

    async changeMemberRole(memberId: string, dto: ManageMemberDto): Promise<ClanMemberDto> {
        const member = await this.memberRepo.findOneBy({ id: memberId });
        if (!member) {
            throw new NotFoundException("Member not found");
        }
        if (member.role === "owner") {
            throw new ForbiddenException("Cannot change the owner's role");
        }

        member.role = dto.role;
        const saved = await this.memberRepo.save(member);

        const user = await this.userRepo.findOne({ where: { id: saved.userId } });
        return this.toMemberDto(saved, user?.displayName);
    }

    async kickMember(memberId: string, userId: string): Promise<void> {
        const target = await this.memberRepo.findOneBy({ id: memberId });
        if (!target) {
            throw new NotFoundException("Member not found");
        }

        const kicker = await this.memberRepo.findOne({
            where: { clanId: target.clanId, userId }
        });
        if (!kicker) {
            throw new ForbiddenException("You are not a member of this clan");
        }

        if (ROLE_HIERARCHY[kicker.role] <= ROLE_HIERARCHY[target.role]) {
            throw new ForbiddenException("You cannot kick a member with an equal or higher role");
        }

        const clanId = target.clanId;
        const targetUserId = target.userId;

        await this.memberRepo.remove(target);
        await this.decrementMemberCount(clanId);

        const clan = await this.clanRepo.findOneBy({ id: clanId });
        await this.notificationsService.create(
            targetUserId,
            "clan_member_kicked",
            "Removed from clan",
            `You have been removed from ${clan?.name ?? "a clan"}`,
            `/clans/${clan?.slug}`
        );
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async verifyIsClanAdmin(clanId: string, userId: string): Promise<void> {
        const member = await this.memberRepo.findOne({ where: { clanId, userId } });
        if (!member || (member.role !== "admin" && member.role !== "owner")) {
            throw new ForbiddenException("You do not have permission to manage this clan");
        }
    }

    private async addMember(clanId: string, userId: string, role: ClanMemberRole): Promise<void> {
        const member = this.memberRepo.create({ clanId, userId, role });
        await this.memberRepo.save(member);
    }

    private async incrementMemberCount(clanId: string): Promise<void> {
        await this.clanRepo.increment({ id: clanId }, "memberCount", 1);
    }

    private async decrementMemberCount(clanId: string): Promise<void> {
        await this.clanRepo.decrement({ id: clanId }, "memberCount", 1);
    }

    private async getUserMap(userIds: string[]): Promise<Map<string, string>> {
        const map = new Map<string, string>();
        if (userIds.length === 0) {
            return map;
        }
        const users = await this.userRepo
            .createQueryBuilder("u")
            .select(["u.id", "u.displayName"])
            .where("u.id IN (:...ids)", { ids: userIds })
            .getMany();
        for (const u of users) {
            map.set(u.id, u.displayName);
        }
        return map;
    }

    private toMemberDto(member: ClanMemberEntity, userName?: string): ClanMemberDto {
        return {
            id: member.id,
            clanId: member.clanId,
            userId: member.userId,
            userName,
            role: member.role,
            joinedAt: member.joinedAt.toISOString()
        };
    }

    private toApplicationDto(app: ClanApplicationEntity, userMap: Map<string, string>): ClanApplicationDto {
        return {
            id: app.id,
            clanId: app.clanId,
            userId: app.userId,
            userName: userMap.get(app.userId),
            invitedById: app.invitedById,
            invitedByName: app.invitedById ? userMap.get(app.invitedById) : undefined,
            type: app.type,
            message: app.message,
            status: app.status,
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString()
        };
    }
}
