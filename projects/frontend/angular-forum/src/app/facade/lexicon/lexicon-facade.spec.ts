import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { API_CONFIG } from "../../core/config/api.config";
import { LexiconFacade } from "./lexicon-facade";

const BASE = "http://test-api";

const mockArticle = {
    id: "article-1",
    title: "Test Article",
    slug: "test-article",
    excerpt: null,
    content: "<p>Content</p>",
    language: "de",
    categoryId: "cat-1",
    categoryName: "General",
    authorId: "user-1",
    authorName: "Author",
    authorAvatar: null,
    status: "published",
    tags: ["test"],
    customFieldValues: {},
    coverImageUrl: null,
    viewCount: 10,
    commentCount: 2,
    versionCount: 3,
    isLocked: false,
    allowComments: true,
    linkedArticleId: null,
    isOwner: true,
    contributors: [
        { id: "user-1", displayName: "Author", avatarUrl: null, versionCount: 3 },
        { id: "user-2", displayName: "Editor", avatarUrl: null, versionCount: 1 }
    ],
    publishedAt: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
};

const mockCategory = {
    id: "cat-1",
    name: "General",
    slug: "general",
    description: "General articles",
    articleCount: 5
};

const mockVersion = {
    id: "v-1",
    articleId: "article-1",
    versionNumber: 1,
    title: "Test Article",
    content: "<p>Content</p>",
    changeNote: "Initial version",
    authorId: "user-1",
    authorName: "Author",
    isProtected: false,
    createdAt: "2026-01-01T00:00:00Z"
};

describe("LexiconFacade", () => {
    let facade: LexiconFacade;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LexiconFacade,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: API_CONFIG, useValue: { baseUrl: BASE } }
            ]
        });

        facade = TestBed.inject(LexiconFacade);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should be created", () => {
        expect(facade).toBeTruthy();
    });

    // ─── loadCategories ─────────────────────────────────────────────────────────

    describe("loadCategories", () => {
        it("should set categories signal on success", () => {
            const mockCategories = [mockCategory];

            facade.loadCategories();

            const req = httpMock.expectOne(`${BASE}/lexicon/categories`);
            expect(req.request.method).toBe("GET");
            req.flush(mockCategories);

            expect(facade.categories()).toEqual(mockCategories);
        });
    });

    // ─── loadArticle ────────────────────────────────────────────────────────────

    describe("loadArticle", () => {
        it("should set currentArticle signal on success", () => {
            facade.loadArticle("test-article");

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/test-article`);
            expect(req.request.method).toBe("GET");
            req.flush(mockArticle);

            expect(facade.currentArticle()).toEqual(mockArticle);
            expect(facade.loading()).toBe(false);
        });

        it("should populate contributors on the loaded article", () => {
            facade.loadArticle("test-article");

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/test-article`);
            req.flush(mockArticle);

            const article = facade.currentArticle();
            expect(article?.contributors).toHaveLength(2);
            expect(article?.contributors[0].displayName).toBe("Author");
            expect(article?.contributors[1].displayName).toBe("Editor");
        });

        it("should set loading to true before request completes", () => {
            facade.loadArticle("test-article");
            expect(facade.loading()).toBe(true);

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/test-article`);
            req.flush(mockArticle);

            expect(facade.loading()).toBe(false);
        });

        it("should set loading to false on error", () => {
            facade.loadArticle("nonexistent");

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/nonexistent`);
            req.flush("Not found", { status: 404, statusText: "Not Found" });

            expect(facade.loading()).toBe(false);
        });
    });

    // ─── loadArticles ───────────────────────────────────────────────────────────

    describe("loadArticles", () => {
        it("should set articles and articleTotal signals on success", () => {
            const mockResponse = { data: [mockArticle], total: 1 };

            facade.loadArticles();

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/articles`));
            expect(req.request.method).toBe("GET");
            req.flush(mockResponse);

            expect(facade.articles()).toEqual([mockArticle]);
            expect(facade.articleTotal()).toBe(1);
            expect(facade.loading()).toBe(false);
        });

        it("should pass query parameters correctly", () => {
            facade.loadArticles({ categoryId: "cat-1", language: "de", limit: 10, page: 2 });

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/articles`));
            expect(req.request.url).toContain("categoryId=cat-1");
            expect(req.request.url).toContain("language=de");
            expect(req.request.url).toContain("limit=10");
            expect(req.request.url).toContain("page=2");
            req.flush({ data: [], total: 0 });
        });

        it("should set loading to false on error", () => {
            facade.loadArticles();

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/articles`));
            req.flush("Error", { status: 500, statusText: "Internal Server Error" });

            expect(facade.loading()).toBe(false);
        });
    });

    // ─── loadVersions ───────────────────────────────────────────────────────────

    describe("loadVersions", () => {
        it("should set versions signal on success", () => {
            const mockVersions = [mockVersion];

            facade.loadVersions("article-1");

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/article-1/versions`);
            expect(req.request.method).toBe("GET");
            req.flush(mockVersions);

            expect(facade.versions()).toEqual(mockVersions);
        });
    });

    // ─── addComment ─────────────────────────────────────────────────────────────

    describe("addComment", () => {
        it("should POST to the correct comments URL", () => {
            const mockComment = {
                id: "comment-1",
                articleId: "article-1",
                authorId: "user-1",
                authorName: "Author",
                content: "Great article!",
                createdAt: "2026-01-02T00:00:00Z"
            };

            facade.addComment("article-1", "Great article!").subscribe();

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/article-1/comments`);
            expect(req.request.method).toBe("POST");
            expect(req.request.body).toEqual({ content: "Great article!", parentId: undefined });
            req.flush(mockComment);
        });

        it("should include parentId when replying to a comment", () => {
            facade.addComment("article-1", "Reply text", "parent-1").subscribe();

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/article-1/comments`);
            expect(req.request.body).toEqual({ content: "Reply text", parentId: "parent-1" });
            req.flush({});
        });
    });

    // ─── deleteArticle ──────────────────────────────────────────────────────────

    describe("deleteArticle", () => {
        it("should DELETE to the correct article URL", () => {
            facade.deleteArticle("article-1").subscribe();

            const req = httpMock.expectOne(`${BASE}/lexicon/articles/article-1`);
            expect(req.request.method).toBe("DELETE");
            req.flush(null);
        });
    });

    // ─── searchArticles ─────────────────────────────────────────────────────────

    describe("searchArticles", () => {
        it("should set articles signal with search results", () => {
            const searchResults = [mockArticle];

            facade.searchArticles("test");

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/search`));
            expect(req.request.method).toBe("GET");
            expect(req.request.url).toContain("q=test");
            req.flush(searchResults);

            expect(facade.articles()).toEqual(searchResults);
            expect(facade.loading()).toBe(false);
        });

        it("should include language parameter when provided", () => {
            facade.searchArticles("test", "de");

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/search`));
            expect(req.request.url).toContain("language=de");
            req.flush([]);
        });

        it("should set loading to false on error", () => {
            facade.searchArticles("test");

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/search`));
            req.flush("Error", { status: 500, statusText: "Internal Server Error" });

            expect(facade.loading()).toBe(false);
        });
    });

    // ─── loadPending ────────────────────────────────────────────────────────────

    describe("loadPending", () => {
        it("should set pendingArticles and pendingTotal signals on success", () => {
            const mockResponse = { data: [mockArticle], total: 1 };

            facade.loadPending();

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/moderation/pending`));
            expect(req.request.method).toBe("GET");
            req.flush(mockResponse);

            expect(facade.pendingArticles()).toEqual([mockArticle]);
            expect(facade.pendingTotal()).toBe(1);
        });

        it("should pass query parameters correctly", () => {
            facade.loadPending({ categoryId: "cat-1", language: "de", limit: 5, page: 1 });

            const req = httpMock.expectOne((r) => r.url.startsWith(`${BASE}/lexicon/moderation/pending`));
            expect(req.request.url).toContain("categoryId=cat-1");
            expect(req.request.url).toContain("language=de");
            expect(req.request.url).toContain("limit=5");
            expect(req.request.url).toContain("page=1");
            req.flush({ data: [], total: 0 });
        });
    });
});
