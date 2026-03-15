import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { AttendeeStatus, CalendarAttendeeEntity } from "./entities/calendar-attendee.entity";
import { CalendarEventEntity, RecurrenceRule } from "./entities/calendar-event.entity";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface AttendeeDto {
    id: string;
    userId: string;
    displayName: string;
    username: string;
    status: AttendeeStatus;
    companions: number;
    declineReason: string | null;
    respondedAt: string | null;
}

export interface CalendarEventDto {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startDate: string;
    endDate: string;
    allDay: boolean;
    isPublic: boolean;
    maxAttendees: number | null;
    createdByUserId: string;
    createdByDisplayName: string;
    threadId: string | null;
    recurrenceRule: RecurrenceRule | null;
    color: string | null;
    attendeeCount: number;
    acceptedCount: number;
    myStatus: AttendeeStatus | null;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarEventDetailDto extends CalendarEventDto {
    attendees: AttendeeDto[];
}

export interface CreateCalendarEventDto {
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    isPublic?: boolean;
    maxAttendees?: number | null;
    recurrenceRule?: RecurrenceRule | null;
    color?: string | null;
    inviteUserIds?: string[];
}

export type UpdateCalendarEventDto = Partial<CreateCalendarEventDto>;

export interface RespondDto {
    status: AttendeeStatus;
    companions?: number;
    declineReason?: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(CalendarEventEntity)
        private readonly eventRepo: Repository<CalendarEventEntity>,
        @InjectRepository(CalendarAttendeeEntity)
        private readonly attendeeRepo: Repository<CalendarAttendeeEntity>,
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {}

    // ─── Public / Authenticated List ──────────────────────────────────────────

    async findEvents(opts: { from: string; to: string; userId?: string }): Promise<CalendarEventDto[]> {
        const rows = await this.dataSource.query<Record<string, unknown>[]>(
            `SELECT e.*,
                    u.display_name as created_by_display_name,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'declined') AS attendee_count,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS accepted_count,
                    my_a.status AS my_status
               FROM calendar_events e
               LEFT JOIN users u ON u.id = e.created_by_user_id
               LEFT JOIN calendar_attendees a ON a.event_id = e.id
               LEFT JOIN calendar_attendees my_a ON my_a.event_id = e.id AND my_a.user_id = $1
              WHERE e.start_date >= $2 AND e.start_date <= $3
                AND (e.is_public = true OR e.created_by_user_id = $1 OR my_a.id IS NOT NULL)
              GROUP BY e.id, u.display_name, my_a.status
              ORDER BY e.start_date ASC`,
            [opts.userId ?? "00000000-0000-0000-0000-000000000000", opts.from, opts.to]
        );
        return rows.map(this.toDto);
    }

    async findMyEvents(userId: string): Promise<CalendarEventDto[]> {
        const rows = await this.dataSource.query<Record<string, unknown>[]>(
            `SELECT e.*,
                    u.display_name as created_by_display_name,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'declined') AS attendee_count,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS accepted_count,
                    my_a.status AS my_status
               FROM calendar_events e
               LEFT JOIN users u ON u.id = e.created_by_user_id
               LEFT JOIN calendar_attendees a ON a.event_id = e.id
               LEFT JOIN calendar_attendees my_a ON my_a.event_id = e.id AND my_a.user_id = $1
              WHERE e.created_by_user_id = $1 OR my_a.id IS NOT NULL
              GROUP BY e.id, u.display_name, my_a.status
              ORDER BY e.start_date ASC`,
            [userId]
        );
        return rows.map(this.toDto);
    }

    // ─── Single Event Detail ──────────────────────────────────────────────────

    async findById(id: string, userId?: string): Promise<CalendarEventDetailDto> {
        const rows = await this.dataSource.query<Record<string, unknown>[]>(
            `SELECT e.*,
                    u.display_name as created_by_display_name,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'declined') AS attendee_count,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS accepted_count,
                    my_a.status AS my_status
               FROM calendar_events e
               LEFT JOIN users u ON u.id = e.created_by_user_id
               LEFT JOIN calendar_attendees a ON a.event_id = e.id
               LEFT JOIN calendar_attendees my_a ON my_a.event_id = e.id AND my_a.user_id = $1
              WHERE e.id = $2
              GROUP BY e.id, u.display_name, my_a.status`,
            [userId ?? "00000000-0000-0000-0000-000000000000", id]
        );
        if (!rows.length) throw new NotFoundException("Event not found");
        const event = this.toDto(rows[0]!);
        const attendees = await this.getAttendees(id);
        return { ...event, attendees };
    }

    // ─── Admin All Events ─────────────────────────────────────────────────────

    async findAll(): Promise<CalendarEventDetailDto[]> {
        const rows = await this.dataSource.query<Record<string, unknown>[]>(
            `SELECT e.*,
                    u.display_name as created_by_display_name,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'declined') AS attendee_count,
                    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS accepted_count,
                    NULL AS my_status
               FROM calendar_events e
               LEFT JOIN users u ON u.id = e.created_by_user_id
               LEFT JOIN calendar_attendees a ON a.event_id = e.id
              GROUP BY e.id, u.display_name
              ORDER BY e.start_date ASC`
        );
        return Promise.all(
            rows.map(async (r) => ({ ...this.toDto(r), attendees: await this.getAttendees(r["id"] as string) }))
        );
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    async create(userId: string, dto: CreateCalendarEventDto): Promise<CalendarEventDetailDto> {
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (end < start) throw new BadRequestException("End date must be after start date");

        const event = this.eventRepo.create({
            title: dto.title,
            description: dto.description ?? null,
            location: dto.location ?? null,
            startDate: start,
            endDate: end,
            allDay: dto.allDay ?? false,
            isPublic: dto.isPublic ?? true,
            maxAttendees: dto.maxAttendees ?? null,
            createdByUserId: userId,
            recurrenceRule: dto.recurrenceRule ?? null,
            color: dto.color ?? null
        });
        const saved = await this.eventRepo.save(event);

        if (dto.inviteUserIds?.length) {
            await this.inviteUsers(saved.id, userId, dto.inviteUserIds);
        }

        return this.findById(saved.id, userId);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    async update(id: string, userId: string, dto: UpdateCalendarEventDto): Promise<CalendarEventDetailDto> {
        const event = await this.eventRepo.findOneBy({ id });
        if (!event) throw new NotFoundException("Event not found");
        if (event.createdByUserId !== userId) throw new ForbiddenException("Only the creator can edit this event");

        if (dto.startDate !== undefined) event.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) event.endDate = new Date(dto.endDate);
        if (event.endDate < event.startDate) throw new BadRequestException("End date must be after start date");

        Object.assign(event, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.location !== undefined && { location: dto.location }),
            ...(dto.allDay !== undefined && { allDay: dto.allDay }),
            ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
            ...(dto.maxAttendees !== undefined && { maxAttendees: dto.maxAttendees }),
            ...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
            ...(dto.color !== undefined && { color: dto.color })
        });
        await this.eventRepo.save(event);
        return this.findById(id, userId);
    }

    // ─── Admin Update/Delete ──────────────────────────────────────────────────

    async adminUpdate(id: string, dto: UpdateCalendarEventDto): Promise<CalendarEventDetailDto> {
        const event = await this.eventRepo.findOneBy({ id });
        if (!event) throw new NotFoundException("Event not found");
        if (dto.startDate !== undefined) event.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) event.endDate = new Date(dto.endDate);
        Object.assign(event, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.location !== undefined && { location: dto.location }),
            ...(dto.allDay !== undefined && { allDay: dto.allDay }),
            ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
            ...(dto.maxAttendees !== undefined && { maxAttendees: dto.maxAttendees }),
            ...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
            ...(dto.color !== undefined && { color: dto.color })
        });
        await this.eventRepo.save(event);
        return this.findById(id);
    }

    async delete(id: string, userId: string): Promise<void> {
        const event = await this.eventRepo.findOneBy({ id });
        if (!event) throw new NotFoundException("Event not found");
        if (event.createdByUserId !== userId) throw new ForbiddenException("Only the creator can delete this event");
        await this.attendeeRepo.delete({ eventId: id });
        await this.eventRepo.remove(event);
    }

    async adminDelete(id: string): Promise<void> {
        const event = await this.eventRepo.findOneBy({ id });
        if (!event) throw new NotFoundException("Event not found");
        await this.attendeeRepo.delete({ eventId: id });
        await this.eventRepo.remove(event);
    }

    // ─── RSVP ─────────────────────────────────────────────────────────────────

    async respond(eventId: string, userId: string, dto: RespondDto): Promise<void> {
        const event = await this.eventRepo.findOneBy({ id: eventId });
        if (!event) throw new NotFoundException("Event not found");

        let attendee = await this.attendeeRepo.findOneBy({ eventId, userId });
        if (!attendee) {
            attendee = this.attendeeRepo.create({ eventId, userId, status: dto.status, companions: 0 });
        }
        attendee.status = dto.status;
        attendee.companions = dto.companions ?? 0;
        attendee.declineReason = dto.declineReason ?? null;
        attendee.respondedAt = new Date();
        await this.attendeeRepo.save(attendee);
    }

    // ─── Invite ───────────────────────────────────────────────────────────────

    async invite(eventId: string, creatorId: string, userIds: string[]): Promise<void> {
        const event = await this.eventRepo.findOneBy({ id: eventId });
        if (!event) throw new NotFoundException("Event not found");
        if (event.createdByUserId !== creatorId) throw new ForbiddenException("Only the creator can invite attendees");
        await this.inviteUsers(eventId, creatorId, userIds);
    }

    private async inviteUsers(eventId: string, _creatorId: string, userIds: string[]): Promise<void> {
        for (const userId of userIds) {
            const existing = await this.attendeeRepo.findOneBy({ eventId, userId });
            if (!existing) {
                await this.attendeeRepo.save(this.attendeeRepo.create({ eventId, userId, status: "pending" }));
            }
        }
    }

    // ─── iCal Export ──────────────────────────────────────────────────────────

    async generateIcal(eventId: string): Promise<string> {
        const event = await this.eventRepo.findOneBy({ id: eventId });
        if (!event) throw new NotFoundException("Event not found");

        const formatDate = (d: Date, allDay: boolean): string => {
            if (allDay) {
                return d.toISOString().replace(/[-:]/g, "").substring(0, 8);
            }
            return d
                .toISOString()
                .replace(/[-:]/g, "")
                .replace(/\.\d{3}/, "");
        };

        const escape = (s: string | null): string =>
            (s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

        let rrule = "";
        if (event.recurrenceRule) {
            const r = event.recurrenceRule;
            let rule = `FREQ=${r.frequency.toUpperCase()};INTERVAL=${r.interval}`;
            if (r.until) rule += `;UNTIL=${r.until.replace(/-/g, "")}T000000Z`;
            if (r.count) rule += `;COUNT=${r.count}`;
            if (r.byDay?.length) rule += `;BYDAY=${r.byDay.join(",")}`;
            rrule = `RRULE:${rule}\r\n`;
        }

        const dtStartProp = event.allDay ? "DTSTART;VALUE=DATE" : "DTSTART";
        const dtEndProp = event.allDay ? "DTEND;VALUE=DATE" : "DTEND";

        return [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Aniverse//Aniverse Calendar//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `UID:${event.id}@aniverse`,
            `DTSTAMP:${formatDate(new Date(), false)}`,
            `${dtStartProp}:${formatDate(event.startDate, event.allDay)}`,
            `${dtEndProp}:${formatDate(event.endDate, event.allDay)}`,
            `SUMMARY:${escape(event.title)}`,
            ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
            ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
            rrule,
            "STATUS:CONFIRMED",
            "END:VEVENT",
            "END:VCALENDAR"
        ]
            .filter(Boolean)
            .join("\r\n");
    }

    async generateMyIcal(userId: string): Promise<string> {
        const events = await this.findMyEvents(userId);
        const eventEntities = await this.eventRepo.findByIds(events.map((e) => e.id));
        const lines: string[] = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Aniverse//Aniverse Calendar//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:Aniverse Kalender"
        ];

        const escape = (s: string | null): string =>
            (s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

        const formatDate = (d: Date, allDay: boolean): string => {
            if (allDay) return d.toISOString().replace(/[-:]/g, "").substring(0, 8);
            return d
                .toISOString()
                .replace(/[-:]/g, "")
                .replace(/\.\d{3}/, "");
        };

        for (const ev of eventEntities) {
            lines.push(
                "BEGIN:VEVENT",
                `UID:${ev.id}@aniverse`,
                `DTSTAMP:${formatDate(new Date(), false)}`,
                `${ev.allDay ? "DTSTART;VALUE=DATE" : "DTSTART"}:${formatDate(ev.startDate, ev.allDay)}`,
                `${ev.allDay ? "DTEND;VALUE=DATE" : "DTEND"}:${formatDate(ev.endDate, ev.allDay)}`,
                `SUMMARY:${escape(ev.title)}`,
                ...(ev.description ? [`DESCRIPTION:${escape(ev.description)}`] : []),
                ...(ev.location ? [`LOCATION:${escape(ev.location)}`] : []),
                "STATUS:CONFIRMED",
                "END:VEVENT"
            );
        }
        lines.push("END:VCALENDAR");
        return lines.join("\r\n");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async getAttendees(eventId: string): Promise<AttendeeDto[]> {
        const rows = await this.dataSource.query<Record<string, unknown>[]>(
            `SELECT a.*, u.display_name, u.username
               FROM calendar_attendees a
               JOIN users u ON u.id = a.user_id
              WHERE a.event_id = $1
              ORDER BY a.created_at ASC`,
            [eventId]
        );
        return rows.map((r) => ({
            id: r["id"] as string,
            userId: r["user_id"] as string,
            displayName: r["display_name"] as string,
            username: r["username"] as string,
            status: r["status"] as AttendeeStatus,
            companions: Number(r["companions"]),
            declineReason: (r["decline_reason"] as string | null) ?? null,
            respondedAt: r["responded_at"] ? new Date(r["responded_at"] as string).toISOString() : null
        }));
    }

    private readonly toDto = (r: Record<string, unknown>): CalendarEventDto => ({
        id: r["id"] as string,
        title: r["title"] as string,
        description: (r["description"] as string | null) ?? null,
        location: (r["location"] as string | null) ?? null,
        startDate: new Date(r["start_date"] as string).toISOString(),
        endDate: new Date(r["end_date"] as string).toISOString(),
        allDay: r["all_day"] as boolean,
        isPublic: r["is_public"] as boolean,
        maxAttendees: r["max_attendees"] != null ? Number(r["max_attendees"]) : null,
        createdByUserId: r["created_by_user_id"] as string,
        createdByDisplayName: (r["created_by_display_name"] as string) ?? "",
        threadId: (r["thread_id"] as string | null) ?? null,
        recurrenceRule: (r["recurrence_rule"] as RecurrenceRule | null) ?? null,
        color: (r["color"] as string | null) ?? null,
        attendeeCount: Number(r["attendee_count"] ?? 0),
        acceptedCount: Number(r["accepted_count"] ?? 0),
        myStatus: (r["my_status"] as AttendeeStatus | null) ?? null,
        createdAt: new Date(r["created_at"] as string).toISOString(),
        updatedAt: new Date(r["updated_at"] as string).toISOString()
    });
}
