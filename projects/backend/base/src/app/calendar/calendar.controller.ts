import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Request,
    UseGuards
} from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
    CalendarService,
    CreateCalendarEventDto,
    RespondDto,
    UpdateCalendarEventDto
} from "./calendar.service";

@Controller("calendar")
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) {}

    // ─── Public / Authenticated List ──────────────────────────────────────────

    @Public()
    @Get()
    findEvents(
        @Query("from") from: string,
        @Query("to") to: string,
        @Request() req: { user?: { userId: string } }
    ) {
        const fromDate = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const toDate = to ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        return this.calendarService.findEvents({ from: fromDate, to: toDate, userId: req.user?.userId });
    }

    @Get("my")
    findMyEvents(@Request() req: { user: { userId: string } }) {
        return this.calendarService.findMyEvents(req.user.userId);
    }

    @Get("ical/feed")
    @Header("Content-Type", "text/calendar; charset=utf-8")
    @Header("Content-Disposition", "attachment; filename=\"aniverse-calendar.ics\"")
    async myIcalFeed(@Request() req: { user: { userId: string } }) {
        return this.calendarService.generateMyIcal(req.user.userId);
    }

    @Public()
    @Get(":id")
    findById(
        @Param("id", ParseUUIDPipe) id: string,
        @Request() req: { user?: { userId: string } }
    ) {
        return this.calendarService.findById(id, req.user?.userId);
    }

    @Public()
    @Get(":id/ical")
    @Header("Content-Type", "text/calendar; charset=utf-8")
    @Header("Content-Disposition", "attachment; filename=\"event.ics\"")
    async getIcal(@Param("id", ParseUUIDPipe) id: string) {
        return this.calendarService.generateIcal(id);
    }

    // ─── Authenticated CRUD ───────────────────────────────────────────────────

    @Post()
    create(
        @Request() req: { user: { userId: string } },
        @Body() body: CreateCalendarEventDto
    ) {
        return this.calendarService.create(req.user.userId, body);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Request() req: { user: { userId: string } },
        @Body() body: UpdateCalendarEventDto
    ) {
        return this.calendarService.update(id, req.user.userId, body);
    }

    @Delete(":id")
    remove(
        @Param("id", ParseUUIDPipe) id: string,
        @Request() req: { user: { userId: string } }
    ) {
        return this.calendarService.delete(id, req.user.userId);
    }

    @Post(":id/respond")
    respond(
        @Param("id", ParseUUIDPipe) id: string,
        @Request() req: { user: { userId: string } },
        @Body() body: RespondDto
    ) {
        return this.calendarService.respond(id, req.user.userId, body);
    }

    @Post(":id/invite")
    invite(
        @Param("id", ParseUUIDPipe) id: string,
        @Request() req: { user: { userId: string } },
        @Body() body: { userIds: string[] }
    ) {
        return this.calendarService.invite(id, req.user.userId, body.userIds ?? []);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/all")
    findAll() {
        return this.calendarService.findAll();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch("admin/:id")
    adminUpdate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() body: UpdateCalendarEventDto
    ) {
        return this.calendarService.adminUpdate(id, body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete("admin/:id")
    adminDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.calendarService.adminDelete(id);
    }
}
