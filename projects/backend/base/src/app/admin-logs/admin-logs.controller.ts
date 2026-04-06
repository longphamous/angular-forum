import { Controller, Delete, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/auth.decorators";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AdminLogsService, LogFilter } from "./admin-logs.service";
import type { LogCategory, LogLevel } from "./entities/admin-log.entity";

@ApiTags("Admin")
@ApiBearerAuth("JWT")
@Controller("admin/logs")
@UseGuards(RolesGuard)
@Roles("admin")
export class AdminLogsController {
    constructor(private readonly logsService: AdminLogsService) {}

    @Get()
    getLogs(
        @Query("level") level?: LogLevel,
        @Query("category") category?: LogCategory,
        @Query("from") from?: string,
        @Query("to") to?: string,
        @Query("userId") userId?: string,
        @Query("search") search?: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ) {
        const filter: LogFilter = {
            level,
            category,
            from,
            to,
            userId,
            search,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined
        };
        return this.logsService.findAll(filter);
    }

    @Get("stats")
    getStats() {
        return this.logsService.getStats();
    }

    @Delete("cleanup")
    cleanup(@Query("days") days?: string) {
        const retentionDays = days ? parseInt(days, 10) : 90;
        return this.logsService.deleteOlderThan(retentionDays);
    }
}
