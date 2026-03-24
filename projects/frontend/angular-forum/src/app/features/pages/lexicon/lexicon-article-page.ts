import { KeyValuePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { LexiconComment } from "../../../core/models/lexicon/lexicon";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { LexiconFacade } from "../../../facade/lexicon/lexicon-facade";

@Component({
    selector: "app-lexicon-article-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        ButtonModule,
        ChipModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        KeyValuePipe,
        RouterModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./lexicon-article-page.html"
})
export class LexiconArticlePage implements OnInit {
    readonly facade = inject(LexiconFacade);
    protected readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);

    protected readonly commentContent = signal("");
    protected readonly replyTo = signal<LexiconComment | null>(null);
    protected readonly submittingComment = signal(false);
    protected readonly reportDialogVisible = signal(false);
    protected readonly reportReason = signal("");

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get("slug") ?? "";
        this.facade.loadArticle(slug);
    }

    protected get safeContent(): SafeHtml {
        const content = this.facade.currentArticle()?.content ?? "";
        return this.sanitizer.bypassSecurityTrustHtml(content);
    }

    protected editArticle(): void {
        const article = this.facade.currentArticle();
        if (article) void this.router.navigate(["/lexicon", article.slug, "edit"]);
    }

    protected viewHistory(): void {
        const article = this.facade.currentArticle();
        if (article) void this.router.navigate(["/lexicon", article.slug, "history"]);
    }

    protected goToLinkedArticle(): void {
        const article = this.facade.currentArticle();
        if (article?.linkedArticleSlug) void this.router.navigate(["/lexicon", article.linkedArticleSlug]);
    }

    protected confirmDelete(): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("lexicon.confirmDelete"),
            accept: () => {
                const article = this.facade.currentArticle();
                if (!article) return;
                this.facade.deleteArticle(article.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: "success",
                            summary: "OK",
                            detail: this.translocoService.translate("lexicon.messages.articleDeleted")
                        });
                        void this.router.navigate(["/lexicon"]);
                    }
                });
            }
        });
    }

    protected submitComment(): void {
        const article = this.facade.currentArticle();
        if (!article || !this.commentContent().trim()) return;

        this.submittingComment.set(true);
        const parentId = this.replyTo()?.id;
        this.facade.addComment(article.id, this.commentContent().trim(), parentId).subscribe({
            next: () => {
                this.commentContent.set("");
                this.replyTo.set(null);
                this.submittingComment.set(false);
                this.facade.loadArticle(article.slug);
            },
            error: () => this.submittingComment.set(false)
        });
    }

    protected setReplyTo(comment: LexiconComment): void {
        this.replyTo.set(comment);
    }

    protected cancelReply(): void {
        this.replyTo.set(null);
    }

    protected deleteComment(id: string): void {
        const article = this.facade.currentArticle();
        if (!article) return;
        this.facade.deleteComment(id).subscribe({
            next: () => this.facade.loadArticle(article.slug)
        });
    }

    protected openReportDialog(): void {
        this.reportReason.set("");
        this.reportDialogVisible.set(true);
    }

    protected submitReport(): void {
        const article = this.facade.currentArticle();
        if (!article || !this.reportReason().trim()) return;
        this.facade.reportArticle(article.id, this.reportReason().trim()).subscribe({
            next: () => {
                this.reportDialogVisible.set(false);
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate("lexicon.messages.reportSubmitted")
                });
            }
        });
    }

    protected formatDate(dateStr: string | null): string {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    }

    protected relativeTime(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }

    readonly navHistory = inject(NavigationHistoryService);

    protected goBack(): void {
        this.navHistory.back("/lexicon");
    }
}
