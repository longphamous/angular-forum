import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { EditorModule } from "primeng/editor";
import { MessageModule } from "primeng/message";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { LevelBadge } from "../../../../core/components/level-badge/level-badge";
import { Post } from "../../../../core/models/forum/post";
import { NavigationHistoryService } from "../../../../core/services/navigation-history.service";
import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { ForumFacade } from "../../../../facade/forum/forum-facade";
import { OnlineIndicator } from "../../../../shared/components/online-indicator/online-indicator";

@Component({
    selector: "thread-detail",
    imports: [
        FormsModule,
        ButtonModule,
        DialogModule,
        DividerModule,
        EditorModule,
        LevelBadge,
        OnlineIndicator,
        MessageModule,
        PaginatorModule,
        RouterModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./thread-detail.html",
    styleUrl: "./thread-detail.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadDetail implements OnInit {
    readonly facade = inject(ForumFacade);
    readonly navHistory = inject(NavigationHistoryService);
    readonly route = inject(ActivatedRoute);
    readonly router = inject(Router);
    readonly cd = inject(ChangeDetectorRef);
    private readonly authFacade = inject(AuthFacade);
    private readonly translocoService = inject(TranslocoService);
    readonly pageSize = 20;

    replyContent = "";
    submittingReply = false;
    replyError: string | null = null;

    readonly reportVisible = signal(false);
    readonly reportSuccess = signal(false);
    reportReason = "";

    private threadId = "";
    private currentPage = 1;
    private readonly reactedPostIds = new Set<string>();
    private readonly reactionAdjust = new Map<string, number>();

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.threadId = params["threadId"] as string;
            this.currentPage = 1;
            this.reactedPostIds.clear();
            this.reactionAdjust.clear();
            this.facade.loadThread(this.threadId);
            this.facade.loadPosts(this.threadId, 1, this.pageSize);
            this.loadMyReactions();
        });
    }

    onPostsPageChange(event: PaginatorState): void {
        const page = event.page ?? 0;
        const rows = event.rows ?? this.pageSize;
        this.currentPage = page + 1;
        this.facade.loadPosts(this.threadId, this.currentPage, rows);
    }

    submitReply(): void {
        if (!this.replyContent.trim()) return;
        this.submittingReply = true;
        this.replyError = null;
        this.facade.createPost(this.threadId, this.replyContent).subscribe({
            next: () => {
                this.replyContent = "";
                this.submittingReply = false;
                const lastPage = Math.ceil((this.facade.postTotal() + 1) / this.pageSize);
                this.facade.loadPosts(this.threadId, lastPage, this.pageSize);
                this.cd.markForCheck();
            },
            error: () => {
                this.replyError = this.translocoService.translate("common.saveError");
                this.submittingReply = false;
                this.cd.markForCheck();
            }
        });
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    formatRelative(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "gerade eben";
        if (minutes < 60) return `vor ${minutes} Min.`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `vor ${hours} Std.`;
        const days = Math.floor(hours / 24);
        return `vor ${days} Tag${days !== 1 ? "en" : ""}`;
    }

    authorRoleSeverity(role: string): "danger" | "warn" | "info" | "secondary" {
        if (role === "admin") return "danger";
        if (role === "moderator") return "warn";
        if (role === "member") return "info";
        return "secondary";
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private loadMyReactions(): void {
        if (!this.authFacade.isAuthenticated()) return;
        this.facade.getMyReactions(this.threadId).subscribe({
            next: (ids) => {
                ids.forEach((id) => this.reactedPostIds.add(id));
                this.cd.markForCheck();
            }
        });
    }

    // ── Reactions ─────────────────────────────────────────────────────────────

    hasReacted(postId: string): boolean {
        return this.reactedPostIds.has(postId);
    }

    adjustedReactionCount(post: Post): number {
        return post.reactionCount + (this.reactionAdjust.get(post.id) ?? 0);
    }

    toggleReact(post: Post): void {
        if (this.reactedPostIds.has(post.id)) {
            this.reactedPostIds.delete(post.id);
            this.reactionAdjust.set(post.id, (this.reactionAdjust.get(post.id) ?? 0) - 1);
            this.facade.unreactToPost(post.id).subscribe();
        } else {
            this.reactedPostIds.add(post.id);
            this.reactionAdjust.set(post.id, (this.reactionAdjust.get(post.id) ?? 0) + 1);
            this.facade.reactToPost(post.id).subscribe();
        }
        this.cd.markForCheck();
    }

    // ── Quote ─────────────────────────────────────────────────────────────────

    quotePost(post: Post): void {
        const quote = `<blockquote><strong>${post.authorName} schrieb:</strong><br>${post.content}</blockquote><p><br></p>`;
        this.replyContent = this.replyContent ? this.replyContent + quote : quote;
        const replyEl = document.getElementById("reply-section");
        if (replyEl) replyEl.scrollIntoView({ behavior: "smooth", block: "start" });
        this.cd.markForCheck();
    }

    // ── Author / Best-answer helpers ──────────────────────────────────────────

    isThreadAuthor(): boolean {
        const user = this.authFacade.currentUser();
        const thread = this.facade.currentThread();
        return !!user && !!thread && user.id === thread.authorId;
    }

    isCurrentUser(authorId: string): boolean {
        return this.authFacade.currentUser()?.id === authorId;
    }

    isOpPost(post: Post): boolean {
        const thread = this.facade.currentThread();
        return !!thread && post.authorId === thread.authorId;
    }

    markBestAnswer(post: Post): void {
        this.facade.markBestAnswer(this.threadId, post.id).subscribe({
            next: () => {
                // Reload thread (bestAnswerPostId) and current page of posts
                this.facade.loadThread(this.threadId);
                this.facade.loadPosts(this.threadId, this.currentPage, this.pageSize);
                this.cd.markForCheck();
            }
        });
    }

    // ── Report ────────────────────────────────────────────────────────────────

    openReport(post: Post): void {
        this.reportReason = "";
        this.reportSuccess.set(false);
        this.reportVisible.set(true);
        void post;
    }

    submitReport(): void {
        this.reportSuccess.set(true);
        this.reportReason = "";
    }
}
