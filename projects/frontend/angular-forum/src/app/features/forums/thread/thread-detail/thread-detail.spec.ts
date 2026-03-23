import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { provideRouter } from "@angular/router";
import { TranslocoTestingModule } from "@jsverse/transloco";
import { EMPTY } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_CONFIG } from "../../../../core/config/api.config";
import { Post } from "../../../../core/models/forum/post";
import { PushService } from "../../../../core/services/push.service";
import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { ForumFacade } from "../../../../facade/forum/forum-facade";
import { ThreadDetail } from "./thread-detail";

const BASE = "http://test-api";

describe("ThreadDetail", () => {
    let component: ThreadDetail;
    let fixture: ComponentFixture<ThreadDetail>;
    let authFacade: AuthFacade;

    const mockPushService = {
        joinThread: vi.fn(),
        leaveThread: vi.fn(),
        on: vi.fn(() => EMPTY)
    };

    const mockActivatedRoute = {
        params: EMPTY,
        snapshot: {
            paramMap: {
                get: () => "test-thread"
            }
        }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ThreadDetail,
                TranslocoTestingModule.forRoot({
                    langs: { en: {} },
                    translocoConfig: {
                        availableLangs: ["en"],
                        defaultLang: "en"
                    }
                })
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: PushService, useValue: mockPushService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: API_CONFIG, useValue: { baseUrl: BASE } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ThreadDetail);
        component = fixture.componentInstance;
        authFacade = TestBed.inject(AuthFacade);
    });

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    describe("authorRoleSeverity", () => {
        it("should return 'danger' for admin role", () => {
            expect(component.authorRoleSeverity("admin")).toBe("danger");
        });

        it("should return 'warn' for moderator role", () => {
            expect(component.authorRoleSeverity("moderator")).toBe("warn");
        });

        it("should return 'info' for member role", () => {
            expect(component.authorRoleSeverity("member")).toBe("info");
        });

        it("should return 'secondary' for unknown role", () => {
            expect(component.authorRoleSeverity("guest")).toBe("secondary");
        });

        it("should return 'secondary' for empty string", () => {
            expect(component.authorRoleSeverity("")).toBe("secondary");
        });
    });

    describe("formatDate", () => {
        it("should format a date string in de-DE locale", () => {
            const result = component.formatDate("2025-06-15T14:30:00Z");
            // de-DE format: DD.MM.YYYY, HH:MM
            expect(result).toContain("15");
            expect(result).toContain("06");
            expect(result).toContain("2025");
        });

        it("should handle ISO date strings", () => {
            const result = component.formatDate("2024-01-01T00:00:00Z");
            expect(result).toContain("01");
            expect(result).toContain("2024");
        });
    });

    describe("formatRelative", () => {
        it("should return 'gerade eben' for dates less than a minute ago", () => {
            const now = new Date().toISOString();
            expect(component.formatRelative(now)).toBe("gerade eben");
        });

        it("should return minutes for dates less than an hour ago", () => {
            const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(component.formatRelative(date)).toBe("vor 5 Min.");
        });

        it("should return hours for dates less than a day ago", () => {
            const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
            expect(component.formatRelative(date)).toBe("vor 3 Std.");
        });

        it("should return days for dates more than a day ago", () => {
            const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
            expect(component.formatRelative(date)).toBe("vor 2 Tagen");
        });

        it("should use singular 'Tag' for exactly one day", () => {
            const date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
            expect(component.formatRelative(date)).toBe("vor 1 Tag");
        });
    });

    describe("isCurrentUser", () => {
        it("should return true when authorId matches current user", () => {
            vi.spyOn(authFacade, "currentUser").mockReturnValue({
                id: "user-123",
                username: "testuser",
                email: "test@example.com",
                role: "member"
            } as ReturnType<typeof authFacade.currentUser>);
            expect(component.isCurrentUser("user-123")).toBe(true);
        });

        it("should return false when authorId does not match current user", () => {
            vi.spyOn(authFacade, "currentUser").mockReturnValue({
                id: "user-123",
                username: "testuser",
                email: "test@example.com",
                role: "member"
            } as ReturnType<typeof authFacade.currentUser>);
            expect(component.isCurrentUser("user-456")).toBe(false);
        });

        it("should return false when no user is logged in", () => {
            vi.spyOn(authFacade, "currentUser").mockReturnValue(null);
            expect(component.isCurrentUser("user-123")).toBe(false);
        });
    });

    describe("quotePost", () => {
        const mockPost: Post = {
            id: "post-1",
            threadId: "thread-1",
            authorId: "author-1",
            authorName: "TestAuthor",
            authorRole: "member",
            authorPostCount: 10,
            authorLevel: 1,
            authorLevelName: "Newbie",
            content: "<p>This is a test post content</p>",
            isFirstPost: false,
            isBestAnswer: false,
            isHighlighted: false,
            isEdited: false,
            editCount: 0,
            reactionCount: 0,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z"
        };

        it("should set replyContent with quoted post", () => {
            component.replyContent = "";
            component.quotePost(mockPost);
            expect(component.replyContent).toContain("<blockquote>");
            expect(component.replyContent).toContain("TestAuthor");
            expect(component.replyContent).toContain("This is a test post content");
        });

        it("should append to existing replyContent", () => {
            component.replyContent = "<p>Existing content</p>";
            component.quotePost(mockPost);
            expect(component.replyContent).toContain("<p>Existing content</p>");
            expect(component.replyContent).toContain("<blockquote>");
        });

        it("should strip nested blockquotes from quoted content", () => {
            const postWithQuote: Post = {
                ...mockPost,
                content: "<blockquote>nested quote</blockquote><p>Actual reply</p>"
            };
            component.replyContent = "";
            component.quotePost(postWithQuote);
            expect(component.replyContent).not.toContain("nested quote");
            expect(component.replyContent).toContain("Actual reply");
        });
    });

    describe("initial signal state", () => {
        it("should have reportVisible set to false", () => {
            expect(component.reportVisible()).toBe(false);
        });

        it("should have reportSuccess set to false", () => {
            expect(component.reportSuccess()).toBe(false);
        });

        it("should have newPostHint set to null", () => {
            expect(component.newPostHint()).toBeNull();
        });

        it("should have moveDialogVisible set to false", () => {
            expect(component.moveDialogVisible()).toBe(false);
        });

        it("should have deleteDialogVisible set to false", () => {
            expect(component.deleteDialogVisible()).toBe(false);
        });

        it("should have editDialogVisible set to false", () => {
            expect(component.editDialogVisible()).toBe(false);
        });

        it("should have titleEditDialogVisible set to false", () => {
            expect(component.titleEditDialogVisible()).toBe(false);
        });

        it("should have historyDialogVisible set to false", () => {
            expect(component.historyDialogVisible()).toBe(false);
        });

        it("should have availableForums set to empty array", () => {
            expect(component.availableForums()).toEqual([]);
        });

        it("should have editHistory set to empty array", () => {
            expect(component.editHistory()).toEqual([]);
        });

        it("should have pollEditDialogVisible set to false", () => {
            expect(component.pollEditDialogVisible()).toBe(false);
        });
    });
});
