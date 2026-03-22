import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { UserEntity, UserRole } from "../user/entities/user.entity";
import { ProfileApprovalEntity, ProfileApprovalStatus, ProfileApprovalType } from "./entities/profile-approval.entity";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXEMPT_ROLES: ReadonlySet<UserRole> = new Set(["admin", "moderator"]);

const FIELD_MAP: Record<string, keyof Pick<UserEntity, "avatarUrl" | "coverUrl" | "signature">> = {
    avatar: "avatarUrl",
    avatar_url: "avatarUrl",
    cover: "coverUrl",
    signature: "signature"
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(
        @InjectRepository(ProfileApprovalEntity)
        private readonly approvalRepo: Repository<ProfileApprovalEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService
    ) {}

    // ── User-facing ───────────────────────────────────────────────────────────

    async submitForApproval(
        userId: string,
        type: ProfileApprovalType,
        oldValue: string | null,
        newValue: string
    ): Promise<ProfileApprovalEntity> {
        const existing = await this.approvalRepo.findOne({
            where: { userId, type, status: "pending" as ProfileApprovalStatus }
        });
        if (existing) {
            throw new BadRequestException(`You already have a pending ${type} change request`);
        }

        const entry = this.approvalRepo.create({
            userId,
            type,
            oldValue,
            newValue,
            status: "pending" as ProfileApprovalStatus
        });
        return this.approvalRepo.save(entry);
    }

    async getUserPendingStatus(userId: string): Promise<ProfileApprovalType[]> {
        const rows = await this.approvalRepo.find({
            where: { userId, status: "pending" as ProfileApprovalStatus },
            select: ["type"]
        });
        return rows.map((r) => r.type);
    }

    async isExempt(userId: string): Promise<boolean> {
        try {
            const user = await this.userRepo.findOne({ where: { id: userId }, select: ["id", "role"] });
            return user ? EXEMPT_ROLES.has(user.role) : false;
        } catch {
            return false;
        }
    }

    // ── Admin / Moderator ─────────────────────────────────────────────────────

    async getPendingApprovals(
        page: number,
        limit: number
    ): Promise<{ data: (ProfileApprovalEntity & { user?: { username: string; displayName: string; avatarUrl: string | null } })[]; total: number }> {
        const [rows, total] = await this.approvalRepo.findAndCount({
            where: { status: "pending" as ProfileApprovalStatus },
            order: { createdAt: "ASC" },
            skip: (page - 1) * limit,
            take: limit
        });

        const userIds = [...new Set(rows.map((r) => r.userId))];
        const users =
            userIds.length > 0
                ? await this.userRepo
                      .createQueryBuilder("u")
                      .select(["u.id", "u.username", "u.displayName", "u.avatarUrl"])
                      .whereInIds(userIds)
                      .getMany()
                : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        const data = rows.map((r) => {
            const u = userMap.get(r.userId);
            return {
                ...r,
                user: u ? { username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl ?? null } : undefined
            };
        });

        return { data, total };
    }

    async approveEntry(id: string, reviewerId: string, note?: string): Promise<ProfileApprovalEntity> {
        const entry = await this.findEntryOrFail(id);
        if (entry.status !== "pending") {
            throw new BadRequestException("This entry has already been reviewed");
        }

        // Apply the change to the user's profile
        const field = FIELD_MAP[entry.type];
        if (field) {
            try {
                await this.userRepo.update(entry.userId, { [field]: entry.newValue } as Partial<UserEntity>);
            } catch (err) {
                this.logger.error(`Failed to update user profile for approval ${id}: ${(err as Error).message}`);
                throw new BadRequestException("Failed to apply profile change");
            }
        }

        entry.status = "approved";
        entry.reviewedBy = reviewerId;
        entry.reviewNote = note ?? null;
        entry.reviewedAt = new Date();
        const saved = await this.approvalRepo.save(entry);

        // Notify user
        try {
            await this.notificationsService.create(
                entry.userId,
                "system",
                "Profile change approved",
                `Your ${entry.type} change has been approved.`,
                "/user/profile"
            );
        } catch (err) {
            this.logger.error(`Failed to send approval notification: ${(err as Error).message}`);
        }

        return saved;
    }

    async rejectEntry(id: string, reviewerId: string, note?: string): Promise<ProfileApprovalEntity> {
        const entry = await this.findEntryOrFail(id);
        if (entry.status !== "pending") {
            throw new BadRequestException("This entry has already been reviewed");
        }

        entry.status = "rejected";
        entry.reviewedBy = reviewerId;
        entry.reviewNote = note ?? null;
        entry.reviewedAt = new Date();
        const saved = await this.approvalRepo.save(entry);

        // Notify user
        try {
            const reason = note ? ` Reason: ${note}` : "";
            await this.notificationsService.create(
                entry.userId,
                "system",
                "Profile change rejected",
                `Your ${entry.type} change has been rejected.${reason}`,
                "/user/profile"
            );
        } catch (err) {
            this.logger.error(`Failed to send rejection notification: ${(err as Error).message}`);
        }

        return saved;
    }

    async getHistory(
        page: number,
        limit: number
    ): Promise<{ data: ProfileApprovalEntity[]; total: number }> {
        const [data, total] = await this.approvalRepo.findAndCount({
            where: [
                { status: "approved" as ProfileApprovalStatus },
                { status: "rejected" as ProfileApprovalStatus }
            ],
            order: { reviewedAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });
        return { data, total };
    }

    async getStats(): Promise<{ pending: number; approvedToday: number; rejectedToday: number }> {
        const pending = await this.approvalRepo.count({ where: { status: "pending" as ProfileApprovalStatus } });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const approvedToday = await this.approvalRepo
            .createQueryBuilder("pa")
            .where("pa.status = :status", { status: "approved" })
            .andWhere("pa.reviewed_at >= :start", { start: todayStart.toISOString() })
            .getCount();

        const rejectedToday = await this.approvalRepo
            .createQueryBuilder("pa")
            .where("pa.status = :status", { status: "rejected" })
            .andWhere("pa.reviewed_at >= :start", { start: todayStart.toISOString() })
            .getCount();

        return { pending, approvedToday, rejectedToday };
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findEntryOrFail(id: string): Promise<ProfileApprovalEntity> {
        const entry = await this.approvalRepo.findOne({ where: { id } });
        if (!entry) {
            throw new NotFoundException(`Approval entry with id "${id}" not found`);
        }
        return entry;
    }
}
