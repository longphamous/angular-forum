import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import {
    DashboardService,
    DashboardStatsDto,
    NewestMemberDto,
    RecentThreadDto,
    TopPosterDto
} from "./dashboard.service";

@ApiTags("Feed")
@ApiBearerAuth("JWT")
@Controller("dashboard")
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Public()
    @Get("stats")
    getStats(): Promise<DashboardStatsDto> {
        return this.dashboardService.getStats();
    }

    @Public()
    @Get("recent-threads")
    getRecentThreads(): Promise<RecentThreadDto[]> {
        return this.dashboardService.getRecentThreads();
    }

    @Public()
    @Get("top-posters")
    getTopPosters(): Promise<TopPosterDto[]> {
        return this.dashboardService.getTopPosters();
    }

    @Public()
    @Get("newest-members")
    getNewestMembers(): Promise<NewestMemberDto[]> {
        return this.dashboardService.getNewestMembers();
    }
}
