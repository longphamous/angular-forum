import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { CalendarAttendeeEntity } from "./entities/calendar-attendee.entity";
import { CalendarEventEntity } from "./entities/calendar-event.entity";
import { CalendarService } from "./calendar.service";

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    findByIds: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn()
});

describe("CalendarService", () => {
    let service: CalendarService;
    let eventRepo: ReturnType<typeof createMockRepo<CalendarEventEntity>>;
    let attendeeRepo: ReturnType<typeof createMockRepo<CalendarAttendeeEntity>>;
    let dataSource: { query: jest.Mock };

    const now = new Date("2026-03-01T10:00:00Z");

    const makeEventRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
        id: "event-1",
        title: "Test Event",
        description: "A description",
        location: "Berlin",
        start_date: "2026-04-01T10:00:00Z",
        end_date: "2026-04-01T12:00:00Z",
        all_day: false,
        is_public: true,
        max_attendees: null,
        created_by_user_id: "user-1",
        created_by_display_name: "Test User",
        thread_id: null,
        recurrence_rule: null,
        color: null,
        attendee_count: "0",
        accepted_count: "0",
        my_status: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        ...overrides
    });

    const makeEventEntity = (overrides: Partial<CalendarEventEntity> = {}): Partial<CalendarEventEntity> => ({
        id: "event-1",
        title: "Test Event",
        description: "A description",
        location: "Berlin",
        startDate: new Date("2026-04-01T10:00:00Z"),
        endDate: new Date("2026-04-01T12:00:00Z"),
        allDay: false,
        isPublic: true,
        maxAttendees: null,
        createdByUserId: "user-1",
        recurrenceRule: null,
        color: null,
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        eventRepo = createMockRepo<CalendarEventEntity>();
        attendeeRepo = createMockRepo<CalendarAttendeeEntity>();
        dataSource = { query: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalendarService,
                { provide: getRepositoryToken(CalendarEventEntity), useValue: eventRepo },
                { provide: getRepositoryToken(CalendarAttendeeEntity), useValue: attendeeRepo },
                { provide: getDataSourceToken(), useValue: dataSource }
            ]
        }).compile();

        service = module.get<CalendarService>(CalendarService);
    });

    describe("findEvents", () => {
        it("should return events within date range", async () => {
            dataSource.query.mockResolvedValue([makeEventRow()]);

            const result = await service.findEvents({
                from: "2026-04-01",
                to: "2026-04-30",
                userId: "user-1"
            });

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Test Event");
            expect(dataSource.query).toHaveBeenCalled();
        });

        it("should use placeholder user id when no user provided", async () => {
            dataSource.query.mockResolvedValue([]);

            await service.findEvents({ from: "2026-04-01", to: "2026-04-30" });

            expect(dataSource.query).toHaveBeenCalledWith(
                expect.any(String),
                ["00000000-0000-0000-0000-000000000000", "2026-04-01", "2026-04-30"]
            );
        });
    });

    describe("findById", () => {
        it("should return event detail with attendees", async () => {
            dataSource.query
                .mockResolvedValueOnce([makeEventRow()])
                .mockResolvedValueOnce([]);

            const result = await service.findById("event-1", "user-1");

            expect(result.title).toBe("Test Event");
            expect(result.attendees).toEqual([]);
        });

        it("should throw NotFoundException when event not found", async () => {
            dataSource.query.mockResolvedValue([]);

            await expect(service.findById("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("create", () => {
        it("should create a new event", async () => {
            const entity = makeEventEntity();
            eventRepo.create!.mockReturnValue(entity);
            eventRepo.save!.mockResolvedValue(entity);
            dataSource.query
                .mockResolvedValueOnce([makeEventRow()])
                .mockResolvedValueOnce([]);

            const result = await service.create("user-1", {
                title: "Test Event",
                startDate: "2026-04-01T10:00:00Z",
                endDate: "2026-04-01T12:00:00Z"
            });

            expect(eventRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ title: "Test Event", createdByUserId: "user-1" })
            );
            expect(result.title).toBe("Test Event");
        });

        it("should throw BadRequestException when end is before start", async () => {
            await expect(
                service.create("user-1", {
                    title: "Bad Event",
                    startDate: "2026-04-02T10:00:00Z",
                    endDate: "2026-04-01T10:00:00Z"
                })
            ).rejects.toThrow(BadRequestException);
        });

        it("should invite users when inviteUserIds provided", async () => {
            const entity = makeEventEntity();
            eventRepo.create!.mockReturnValue(entity);
            eventRepo.save!.mockResolvedValue(entity);
            attendeeRepo.findOneBy!.mockResolvedValue(null);
            attendeeRepo.create!.mockReturnValue({});
            attendeeRepo.save!.mockResolvedValue({});
            dataSource.query
                .mockResolvedValueOnce([makeEventRow()])
                .mockResolvedValueOnce([]);

            await service.create("user-1", {
                title: "Party",
                startDate: "2026-04-01T10:00:00Z",
                endDate: "2026-04-01T12:00:00Z",
                inviteUserIds: ["user-2"]
            });

            expect(attendeeRepo.save).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update event when creator edits", async () => {
            const entity = makeEventEntity({ createdByUserId: "user-1" });
            eventRepo.findOneBy!.mockResolvedValue(entity);
            eventRepo.save!.mockResolvedValue(entity);
            dataSource.query
                .mockResolvedValueOnce([makeEventRow()])
                .mockResolvedValueOnce([]);

            const result = await service.update("event-1", "user-1", { title: "Updated" });

            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when event not found", async () => {
            eventRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.update("missing", "user-1", { title: "X" })).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-creator edits", async () => {
            eventRepo.findOneBy!.mockResolvedValue(makeEventEntity({ createdByUserId: "user-1" }));

            await expect(service.update("event-1", "user-2", { title: "X" })).rejects.toThrow(ForbiddenException);
        });
    });

    describe("delete", () => {
        it("should delete event when creator deletes", async () => {
            const entity = makeEventEntity({ createdByUserId: "user-1" });
            eventRepo.findOneBy!.mockResolvedValue(entity);
            attendeeRepo.delete!.mockResolvedValue({ affected: 0 });
            eventRepo.remove!.mockResolvedValue(entity);

            await service.delete("event-1", "user-1");

            expect(attendeeRepo.delete).toHaveBeenCalledWith({ eventId: "event-1" });
            expect(eventRepo.remove).toHaveBeenCalledWith(entity);
        });

        it("should throw NotFoundException when event not found", async () => {
            eventRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.delete("missing", "user-1")).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-creator deletes", async () => {
            eventRepo.findOneBy!.mockResolvedValue(makeEventEntity({ createdByUserId: "user-1" }));

            await expect(service.delete("event-1", "user-2")).rejects.toThrow(ForbiddenException);
        });
    });

    describe("adminDelete", () => {
        it("should delete any event", async () => {
            const entity = makeEventEntity();
            eventRepo.findOneBy!.mockResolvedValue(entity);
            attendeeRepo.delete!.mockResolvedValue({ affected: 0 });
            eventRepo.remove!.mockResolvedValue(entity);

            await service.adminDelete("event-1");

            expect(eventRepo.remove).toHaveBeenCalledWith(entity);
        });

        it("should throw NotFoundException when event not found", async () => {
            eventRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.adminDelete("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("respond", () => {
        it("should create new attendee when responding", async () => {
            eventRepo.findOneBy!.mockResolvedValue(makeEventEntity());
            attendeeRepo.findOneBy!.mockResolvedValue(null);
            const attendee = { eventId: "event-1", userId: "user-1", status: "accepted", companions: 0 };
            attendeeRepo.create!.mockReturnValue(attendee);
            attendeeRepo.save!.mockResolvedValue(attendee);

            await service.respond("event-1", "user-1", { status: "accepted" });

            expect(attendeeRepo.save).toHaveBeenCalled();
        });

        it("should update existing attendee", async () => {
            eventRepo.findOneBy!.mockResolvedValue(makeEventEntity());
            const existing = { eventId: "event-1", userId: "user-1", status: "pending", companions: 0 };
            attendeeRepo.findOneBy!.mockResolvedValue(existing);
            attendeeRepo.save!.mockResolvedValue({ ...existing, status: "accepted" });

            await service.respond("event-1", "user-1", { status: "accepted" });

            expect(existing.status).toBe("accepted");
        });

        it("should throw NotFoundException when event not found", async () => {
            eventRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.respond("missing", "user-1", { status: "accepted" })).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe("invite", () => {
        it("should throw ForbiddenException when non-creator invites", async () => {
            eventRepo.findOneBy!.mockResolvedValue(makeEventEntity({ createdByUserId: "user-1" }));

            await expect(service.invite("event-1", "user-2", ["user-3"])).rejects.toThrow(ForbiddenException);
        });

        it("should throw NotFoundException when event not found", async () => {
            eventRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.invite("missing", "user-1", ["user-2"])).rejects.toThrow(NotFoundException);
        });
    });

    describe("generateIcal", () => {
        it("should generate valid iCal string", async () => {
            eventRepo.findOneBy!.mockResolvedValue(makeEventEntity());

            const result = await service.generateIcal("event-1");

            expect(result).toContain("BEGIN:VCALENDAR");
            expect(result).toContain("SUMMARY:Test Event");
            expect(result).toContain("END:VCALENDAR");
        });

        it("should throw NotFoundException when event not found", async () => {
            eventRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.generateIcal("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("findMyEvents", () => {
        it("should return events for user", async () => {
            dataSource.query.mockResolvedValue([makeEventRow()]);

            const result = await service.findMyEvents("user-1");

            expect(result).toHaveLength(1);
        });
    });
});
