import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { LexiconArticleVersion } from "../../../core/models/lexicon/lexicon";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { LexiconFacade } from "../../../facade/lexicon/lexicon-facade";

@Component({
    selector: "app-lexicon-history-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        SkeletonModule,
        TableModule,
        TagModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./lexicon-history-page.html"
})
export class LexiconHistoryPage implements OnInit {
    readonly facade = inject(LexiconFacade);
    protected readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);

    protected readonly articleSlug = signal("");
    protected readonly articleId = signal("");
    protected readonly articleTitle = signal("");
    protected readonly versionDialogVisible = signal(false);
    protected readonly compareMode = signal(false);
    protected readonly compareLeft = signal<LexiconArticleVersion | null>(null);
    protected readonly compareRight = signal<LexiconArticleVersion | null>(null);

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get("slug") ?? "";
        this.articleSlug.set(slug);
        this.facade.loadArticle(slug);

        const interval = setInterval(() => {
            const article = this.facade.currentArticle();
            if (article) {
                clearInterval(interval);
                this.articleId.set(article.id);
                this.articleTitle.set(article.title);
                this.facade.loadVersions(article.id);
            }
        }, 200);
        setTimeout(() => clearInterval(interval), 5000);
    }

    protected viewVersion(version: LexiconArticleVersion): void {
        this.facade.loadVersion(this.articleId(), version.versionNumber);
        this.versionDialogVisible.set(true);
    }

    protected get versionContent(): SafeHtml {
        const content = this.facade.currentVersion()?.content ?? "";
        return this.sanitizer.bypassSecurityTrustHtml(content);
    }

    protected restoreVersion(version: LexiconArticleVersion): void {
        this.confirmationService.confirm({
            message: this.translocoService.translate("lexicon.confirmRestore"),
            accept: () => {
                this.facade.restoreVersion(this.articleId(), version.versionNumber).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: "success",
                            summary: "OK",
                            detail: this.translocoService.translate("lexicon.messages.versionRestored")
                        });
                        this.facade.loadVersions(this.articleId());
                    }
                });
            }
        });
    }

    protected protectVersion(version: LexiconArticleVersion): void {
        this.facade.protectVersion(this.articleId(), version.versionNumber).subscribe({
            next: () => {
                this.messageService.add({
                    severity: "success",
                    summary: "OK",
                    detail: this.translocoService.translate(
                        version.isProtected ? "lexicon.messages.protectionRemoved" : "lexicon.messages.versionProtected"
                    )
                });
                this.facade.loadVersions(this.articleId());
            }
        });
    }

    protected toggleCompareMode(): void {
        this.compareMode.update((v) => !v);
        this.compareLeft.set(null);
        this.compareRight.set(null);
    }

    protected selectForCompare(version: LexiconArticleVersion): void {
        if (!this.compareLeft()) {
            this.compareLeft.set(version);
            this.facade.loadVersion(this.articleId(), version.versionNumber);
        } else if (!this.compareRight()) {
            this.compareRight.set(version);
            this.facade.loadVersion(this.articleId(), version.versionNumber);
        }
    }

    protected get leftContent(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.compareLeft()?.content ?? "");
    }

    protected get rightContent(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.compareRight()?.content ?? "");
    }

    protected formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    protected goBack(): void {
        void this.router.navigate(["/lexicon", this.articleSlug()]);
    }

    protected goToArticle(): void {
        void this.router.navigate(["/lexicon", this.articleSlug()]);
    }
}
