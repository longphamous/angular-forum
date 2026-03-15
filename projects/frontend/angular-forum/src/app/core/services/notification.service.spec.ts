import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";

import { API_CONFIG } from "../config/api.config";
import { AppNotification } from "../models/notifications/notification";
import { NotificationService } from "./notification.service";

const BASE = "http://test-api";

function makeNotification(id: string, isRead: boolean): AppNotification {
    return {
        id,
        userId: "user-1",
        type: "system",
        title: "Test",
        body: "Body",
        link: null,
        isRead,
        createdAt: new Date().toISOString()
    };
}

describe("NotificationService", () => {
    let service: NotificationService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NotificationService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: API_CONFIG, useValue: { baseUrl: BASE } }
            ]
        });

        service = TestBed.inject(NotificationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        service.stopPolling();
        httpMock.verify();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    // ─── Initial signal state ──────────────────────────────────────────────────

    describe("initial state", () => {
        it("should have unreadCount of 0", () => {
            expect(service.unreadCount()).toBe(0);
        });

        it("should have empty notifications array", () => {
            expect(service.notifications()).toEqual([]);
        });

        it("should not be loading", () => {
            expect(service.loading()).toBeFalse();
        });
    });

    // ─── loadNotifications ────────────────────────────────────────────────────

    describe("loadNotifications", () => {
        it("should set notifications and compute unreadCount", () => {
            const notifs = [makeNotification("n1", false), makeNotification("n2", true), makeNotification("n3", false)];

            service.loadNotifications();

            const req = httpMock.expectOne(`${BASE}/notifications`);
            req.flush(notifs);

            expect(service.notifications()).toHaveSize(3);
            expect(service.unreadCount()).toBe(2);
            expect(service.loading()).toBeFalse();
        });

        it("should set loading to false on error", () => {
            service.loadNotifications();

            const req = httpMock.expectOne(`${BASE}/notifications`);
            req.flush("Error", { status: 500, statusText: "Server Error" });

            expect(service.loading()).toBeFalse();
        });
    });

    // ─── markAsRead ───────────────────────────────────────────────────────────

    describe("markAsRead", () => {
        beforeEach(() => {
            // Seed two unread notifications
            service.loadNotifications();
            httpMock
                .expectOne(`${BASE}/notifications`)
                .flush([makeNotification("n1", false), makeNotification("n2", false)]);
        });

        it("should mark a notification as read and decrement unreadCount", () => {
            service.markAsRead("n1");

            const req = httpMock.expectOne(`${BASE}/notifications/n1/read`);
            expect(req.request.method).toBe("PATCH");
            req.flush({});

            const n1 = service.notifications().find((n) => n.id === "n1");
            expect(n1?.isRead).toBeTrue();
            expect(service.unreadCount()).toBe(1);
        });

        it("should not send a request for an already-read notification", () => {
            // First mark as read
            service.markAsRead("n1");
            httpMock.expectOne(`${BASE}/notifications/n1/read`).flush({});

            // Attempt to mark again — no new request expected
            service.markAsRead("n1");
            httpMock.expectNone(`${BASE}/notifications/n1/read`);
        });

        it("should not send a request for a non-existent notification id", () => {
            service.markAsRead("does-not-exist");
            httpMock.expectNone(`${BASE}/notifications/does-not-exist/read`);
        });

        it("should not allow unreadCount to go below 0", () => {
            // Force unreadCount to 0
            service.loadNotifications();
            httpMock.expectOne(`${BASE}/notifications`).flush([makeNotification("n3", true)]);

            // n3 is already read, so markAsRead should no-op
            service.markAsRead("n3");
            expect(service.unreadCount()).toBe(0);
        });
    });

    // ─── markAllAsRead ────────────────────────────────────────────────────────

    describe("markAllAsRead", () => {
        it("should mark all notifications as read and reset unreadCount to 0", () => {
            service.loadNotifications();
            httpMock
                .expectOne(`${BASE}/notifications`)
                .flush([makeNotification("n1", false), makeNotification("n2", false)]);

            service.markAllAsRead();

            const req = httpMock.expectOne(`${BASE}/notifications/read-all`);
            expect(req.request.method).toBe("PATCH");
            req.flush({});

            expect(service.unreadCount()).toBe(0);
            expect(service.notifications().every((n) => n.isRead)).toBeTrue();
        });
    });

    // ─── deleteNotification ───────────────────────────────────────────────────

    describe("deleteNotification", () => {
        it("should remove the notification from the list", () => {
            service.loadNotifications();
            httpMock
                .expectOne(`${BASE}/notifications`)
                .flush([makeNotification("n1", false), makeNotification("n2", true)]);

            service.deleteNotification("n1");

            const req = httpMock.expectOne(`${BASE}/notifications/n1`);
            expect(req.request.method).toBe("DELETE");
            req.flush({});

            expect(service.notifications()).toHaveSize(1);
            expect(service.notifications()[0].id).toBe("n2");
        });

        it("should decrement unreadCount when deleting an unread notification", () => {
            service.loadNotifications();
            httpMock
                .expectOne(`${BASE}/notifications`)
                .flush([makeNotification("n1", false)]);

            service.deleteNotification("n1");
            httpMock.expectOne(`${BASE}/notifications/n1`).flush({});

            expect(service.unreadCount()).toBe(0);
        });

        it("should not change unreadCount when deleting a read notification", () => {
            service.loadNotifications();
            httpMock
                .expectOne(`${BASE}/notifications`)
                .flush([makeNotification("n1", false), makeNotification("n2", true)]);

            service.deleteNotification("n2");
            httpMock.expectOne(`${BASE}/notifications/n2`).flush({});

            expect(service.unreadCount()).toBe(1);
        });
    });

    // ─── Polling ──────────────────────────────────────────────────────────────

    describe("startPolling / stopPolling", () => {
        it("should fetch unread count immediately on startPolling", fakeAsync(() => {
            service.startPolling();

            const req = httpMock.expectOne(`${BASE}/notifications/unread-count`);
            req.flush({ count: 7 });

            expect(service.unreadCount()).toBe(7);

            service.stopPolling();
            tick(30_000); // exhaust timer
        }));

        it("should poll again after 30 seconds", fakeAsync(() => {
            service.startPolling();

            // Initial poll
            httpMock.expectOne(`${BASE}/notifications/unread-count`).flush({ count: 2 });

            tick(30_000);

            // Second poll
            httpMock.expectOne(`${BASE}/notifications/unread-count`).flush({ count: 5 });
            expect(service.unreadCount()).toBe(5);

            service.stopPolling();
        }));

        it("should not start a second interval if startPolling is called twice", fakeAsync(() => {
            service.startPolling();
            httpMock.expectOne(`${BASE}/notifications/unread-count`).flush({ count: 1 });

            // Second call fetches immediately again but does NOT create a new interval
            service.startPolling();
            httpMock.expectOne(`${BASE}/notifications/unread-count`).flush({ count: 2 });

            // After 30s there should be exactly one poll (from the single interval)
            tick(30_000);
            httpMock.expectOne(`${BASE}/notifications/unread-count`).flush({ count: 3 });

            service.stopPolling();
        }));

        it("should stop polling after stopPolling is called", fakeAsync(() => {
            service.startPolling();
            httpMock.expectOne(`${BASE}/notifications/unread-count`).flush({ count: 1 });

            service.stopPolling();

            tick(60_000);
            httpMock.expectNone(`${BASE}/notifications/unread-count`);
        }));
    });
});
