import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";

import { AdminLogEntity, LogCategory, LogLevel } from "./entities/admin-log.entity";

export interface CreateLogDto {
    level: LogLevel;
    category: LogCategory;
    action: string;
    message: string;
    userId?: string | null;
    username?: string | null;
    targetId?: string | null;
    ipAddress?: string | null;
    metadata?: Record<string, unknown> | null;
}

export interface LogFilter {
    level?: LogLevel;
    category?: LogCategory;
    from?: string;
    to?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedLogs {
    items: AdminLogEntity[];
    total: number;
    page: number;
    limit: number;
}

@Injectable()
export class AdminLogsService {
    constructor(
        @InjectRepository(AdminLogEntity)
        private readonly logRepo: Repository<AdminLogEntity>
    ) {}

    async log(dto: CreateLogDto): Promise<void> {
        const entity = this.logRepo.create({
            level: dto.level,
            category: dto.category,
            action: dto.action,
            message: dto.message,
            userId: dto.userId ?? null,
            username: dto.username ?? null,
            targetId: dto.targetId ?? null,
            ipAddress: dto.ipAddress ?? null,
            metadata: dto.metadata ?? null
        });
        await this.logRepo.save(entity);
    }

    async findAll(filter: LogFilter): Promise<PaginatedLogs> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 50;
        const skip = (page - 1) * limit;

        const qb = this.logRepo.createQueryBuilder("log");

        if (filter.level) {
            qb.andWhere("log.level = :level", { level: filter.level });
        }
        if (filter.category) {
            qb.andWhere("log.category = :category", { category: filter.category });
        }
        if (filter.userId) {
            qb.andWhere("log.user_id = :userId", { userId: filter.userId });
        }
        if (filter.from) {
            qb.andWhere("log.created_at >= :from", { from: filter.from });
        }
        if (filter.to) {
            qb.andWhere("log.created_at <= :to", { to: filter.to });
        }
        if (filter.search) {
            qb.andWhere("(log.message ILIKE :search OR log.action ILIKE :search OR log.username ILIKE :search)", {
                search: `%${filter.search}%`
            });
        }

        qb.orderBy("log.created_at", "DESC");
        qb.skip(skip).take(limit);

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }

    async getStats(): Promise<{ total: number; byLevel: Record<string, number>; byCategory: Record<string, number> }> {
        const total = await this.logRepo.count();

        const levelCounts = await this.logRepo
            .createQueryBuilder("log")
            .select("log.level", "level")
            .addSelect("COUNT(*)", "count")
            .groupBy("log.level")
            .getRawMany<{ level: string; count: string }>();

        const categoryCounts = await this.logRepo
            .createQueryBuilder("log")
            .select("log.category", "category")
            .addSelect("COUNT(*)", "count")
            .groupBy("log.category")
            .getRawMany<{ category: string; count: string }>();

        const byLevel: Record<string, number> = {};
        for (const row of levelCounts) {
            byLevel[row.level] = parseInt(row.count, 10);
        }

        const byCategory: Record<string, number> = {};
        for (const row of categoryCounts) {
            byCategory[row.category] = parseInt(row.count, 10);
        }

        return { total, byLevel, byCategory };
    }

    async deleteOlderThan(days: number): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const result = await this.logRepo.delete({
            createdAt: LessThanOrEqual(cutoff)
        });
        return result.affected ?? 0;
    }
}
