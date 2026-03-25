import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Request,
    UseGuards
} from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
    ArticleQueryDto,
    CreateArticleDto,
    CreateCategoryDto,
    CreateCommentDto,
    ModerateArticleDto,
    ReportArticleDto,
    ResolveReportDto,
    UpdateArticleDto,
    UpdateTermsDto
} from "./dto/lexicon.dto";
import { LexiconArticleStatus } from "./entities/lexicon-article.entity";
import { LexiconService } from "./lexicon.service";

@Controller("lexicon")
@UseGuards(JwtAuthGuard)
export class LexiconController {
    constructor(private readonly lexiconService: LexiconService) {}

    // ── Categories ──────────────────────────────────────────────

    @Public()
    @Get("categories")
    getCategories() {
        return this.lexiconService.getCategories();
    }

    @Public()
    @Get("categories/:id")
    getCategory(@Param("id") id: string) {
        return this.lexiconService.getCategoryById(id);
    }

    @Post("categories")
    createCategory(@Request() req: { user: { role: string } }, @Body() dto: CreateCategoryDto) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.createCategory(dto);
    }

    @Put("categories/:id")
    updateCategory(
        @Param("id") id: string,
        @Request() req: { user: { role: string } },
        @Body() dto: Partial<CreateCategoryDto>
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.updateCategory(id, dto);
    }

    @Delete("categories/:id")
    deleteCategory(@Param("id") id: string, @Request() req: { user: { role: string } }) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.deleteCategory(id);
    }

    // ── Articles ────────────────────────────────────────────────

    @Public()
    @Get("articles")
    getArticles(
        @Request() req: { user?: { userId: string; role: string } },
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @Query("search") search?: string,
        @Query("categoryId") categoryId?: string,
        @Query("language") language?: string,
        @Query("status") status?: LexiconArticleStatus,
        @Query("tag") tag?: string,
        @Query("authorId") authorId?: string
    ) {
        const query: ArticleQueryDto = {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
            categoryId,
            language,
            status,
            tag,
            authorId
        };
        return this.lexiconService.getArticles(query, req.user?.userId ?? "", req.user?.role === "admin");
    }

    @Public()
    @Get("articles/:slug")
    getArticle(@Param("slug") slug: string, @Request() req: { user?: { userId: string; role: string } }) {
        return this.lexiconService.getArticleBySlug(slug, req.user?.userId ?? "", req.user?.role === "admin");
    }

    @Post("articles")
    createArticle(@Request() req: { user: { userId: string } }, @Body() dto: CreateArticleDto) {
        return this.lexiconService.createArticle(req.user.userId, dto);
    }

    @Patch("articles/:id")
    updateArticle(
        @Param("id") id: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() dto: UpdateArticleDto
    ) {
        return this.lexiconService.updateArticle(id, req.user.userId, req.user.role === "admin", dto);
    }

    @Delete("articles/:id")
    deleteArticle(@Param("id") id: string, @Request() req: { user: { userId: string; role: string } }) {
        return this.lexiconService.deleteArticle(id, req.user.userId, req.user.role === "admin");
    }

    @Patch("articles/:id/lock")
    toggleLock(@Param("id") id: string, @Request() req: { user: { role: string } }) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.toggleLock(id);
    }

    // ── Versions ────────────────────────────────────────────────

    @Get("articles/:id/versions")
    getVersions(@Param("id") id: string) {
        return this.lexiconService.getVersions(id);
    }

    @Get("articles/:id/versions/:versionNumber")
    getVersion(@Param("id") id: string, @Param("versionNumber", ParseIntPipe) versionNumber: number) {
        return this.lexiconService.getVersion(id, versionNumber);
    }

    @Post("articles/:id/restore/:versionNumber")
    restoreVersion(
        @Param("id") id: string,
        @Param("versionNumber", ParseIntPipe) versionNumber: number,
        @Request() req: { user: { userId: string; role: string } }
    ) {
        return this.lexiconService.restoreVersion(id, versionNumber, req.user.userId, req.user.role === "admin");
    }

    @Patch("articles/:id/versions/:versionNumber/protect")
    protectVersion(
        @Param("id") id: string,
        @Param("versionNumber", ParseIntPipe) versionNumber: number,
        @Request() req: { user: { role: string } }
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.protectVersion(id, versionNumber);
    }

    // ── Comments ────────────────────────────────────────────────

    @Get("articles/:id/comments")
    getComments(@Param("id") id: string) {
        return this.lexiconService.getComments(id);
    }

    @Post("articles/:id/comments")
    addComment(@Param("id") id: string, @Request() req: { user: { userId: string } }, @Body() dto: CreateCommentDto) {
        return this.lexiconService.addComment(id, req.user.userId, dto);
    }

    @Patch("comments/:id")
    updateComment(
        @Param("id") id: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() body: { content: string }
    ) {
        return this.lexiconService.updateComment(id, req.user.userId, req.user.role === "admin", body.content);
    }

    @Delete("comments/:id")
    deleteComment(@Param("id") id: string, @Request() req: { user: { userId: string; role: string } }) {
        return this.lexiconService.deleteComment(id, req.user.userId, req.user.role === "admin");
    }

    // ── Moderation ──────────────────────────────────────────────

    @Get("moderation/pending")
    getPending(
        @Request() req: { user: { role: string } },
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @Query("categoryId") categoryId?: string,
        @Query("language") language?: string
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.getPendingArticles({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            categoryId,
            language
        });
    }

    @Patch("moderation/:id/approve")
    approveArticle(@Param("id") id: string, @Request() req: { user: { userId: string; role: string } }) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.approveArticle(id, req.user.userId);
    }

    @Patch("moderation/:id/reject")
    rejectArticle(
        @Param("id") id: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() dto: ModerateArticleDto
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.rejectArticle(id, req.user.userId, dto);
    }

    @Post("articles/:id/report")
    reportArticle(
        @Param("id") id: string,
        @Request() req: { user: { userId: string } },
        @Body() dto: ReportArticleDto
    ) {
        return this.lexiconService.reportArticle(id, req.user.userId, dto.reason);
    }

    @Get("moderation/reports")
    getReports(@Request() req: { user: { role: string } }) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.getReports();
    }

    @Patch("moderation/reports/:id")
    resolveReport(
        @Param("id") id: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() dto: ResolveReportDto
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.resolveReport(id, req.user.userId, dto);
    }

    // ── Terms of Use ────────────────────────────────────────────

    @Public()
    @Get("terms/:language")
    getTerms(@Param("language") language: string) {
        return this.lexiconService.getTerms(language);
    }

    @Put("terms/:language")
    updateTerms(
        @Param("language") language: string,
        @Request() req: { user: { userId: string; role: string } },
        @Body() dto: UpdateTermsDto
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.lexiconService.updateTerms(language, dto, req.user.userId);
    }

    // ── System-wide Linking ─────────────────────────────────────

    @Post("detect-terms")
    detectTerms(@Body() body: { text: string }) {
        return this.lexiconService.detectTerms(body.text);
    }

    // ── Search ──────────────────────────────────────────────────

    @Public()
    @Get("search")
    search(
        @Request() req: { user?: { userId: string; role: string } },
        @Query("q") q: string,
        @Query("language") language?: string
    ) {
        return this.lexiconService.search(q ?? "", language, req.user?.userId ?? "", req.user?.role === "admin");
    }
}
