import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { EditorModule } from "primeng/editor";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { Subscription } from "rxjs";

import { ForumBreadcrumb } from "../../../../core/components/forum-breadcrumb/forum-breadcrumb";
import { LevelBadge } from "../../../../core/components/level-badge/level-badge";
import { Post, PostEditHistoryEntry } from "../../../../core/models/forum/post";
import { PushThreadNewPost } from "../../../../core/models/push/push-events";
import { NavigationHistoryService } from "../../../../core/services/navigation-history.service";
import { PushService } from "../../../../core/services/push.service";
import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { ForumFacade } from "../../../../facade/forum/forum-facade";
import { OnlineIndicator } from "../../../../shared/components/online-indicator/online-indicator";
import { RichContent } from "../../../../shared/components/rich-content/rich-content";
import { RichEmbed } from "../../../../shared/components/rich-embed/rich-embed";
import { UserPopoverDirective } from "../../../../shared/directives/user-popover.directive";

@Component({
    selector: "thread-detail",
    imports: [
        FormsModule,
        ButtonModule,
        CheckboxModule,
        DialogModule,
        DividerModule,
        EditorModule,
        ForumBreadcrumb,
        InputTextModule,
        LevelBadge,
        OnlineIndicator,
        RichContent,
        RichEmbed,
        MessageModule,
        PaginatorModule,
        RouterModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule,
        UserPopoverDirective
    ],
    templateUrl: "./thread-detail.html",
    styleUrl: "./thread-detail.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadDetail implements OnInit, OnDestroy {
    readonly facade = inject(ForumFacade);
    readonly navHistory = inject(NavigationHistoryService);
    readonly route = inject(ActivatedRoute);
    readonly router = inject(Router);
    readonly cd = inject(ChangeDetectorRef);
    readonly authFacade = inject(AuthFacade);
    private readonly translocoService = inject(TranslocoService);
    private readonly pushService = inject(PushService);
    readonly pageSize = 20;

    replyContent = "";
    replyKnowledgeSource = "";
    submittingReply = false;
    replyError: string | null = null;
    readonly replyEmbedUrls = signal<string[]>([]);
    private embedDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    readonly reportVisible = signal(false);
    readonly reportSuccess = signal(false);
    readonly newPostHint = signal<PushThreadNewPost | null>(null);
    readonly moveDialogVisible = signal(false);
    readonly deleteDialogVisible = signal(false);
    readonly editDialogVisible = signal(false);
    readonly titleEditDialogVisible = signal(false);
    editTitleValue = "";
    readonly historyDialogVisible = signal(false);
    readonly availableForums = signal<{ id: string; name: string }[]>([]);
    readonly editHistory = signal<PostEditHistoryEntry[]>([]);
    moveTargetForumId = "";
    reportReason = "";
    editPostId = "";
    editContent = "";
    editReason = "";
    editSubmitting = false;

    // Poll
    readonly showPollParticipants = signal(false);

    // Poll edit
    readonly pollEditDialogVisible = signal(false);
    pollEditNewOptions: { text: string; imageUrl: string }[] = [];
    pollEditQuestion = "";
    pollEditIsAnonymous = false;
    pollEditShowVoterNames = false;
    pollEditAllowVoteChange = true;
    pollEditVoteChangeDeadline = "";
    pollEditClosesAt = "";
    pollEditIsClosed = false;
    pollEditSubmitting = false;

    private threadId = "";
    private currentPage = 1;
    private readonly reactedPostIds = new Set<string>();
    private readonly reactionAdjust = new Map<string, number>();
    private pushSub: Subscription | null = null;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            // Leave previous thread room
            if (this.threadId) {
                this.pushService.leaveThread(this.threadId);
            }

            this.threadId = params["threadId"] as string;
            this.currentPage = 1;
            this.reactedPostIds.clear();
            this.reactionAdjust.clear();
            this.newPostHint.set(null);
            this.facade.loadThread(this.threadId);
            this.facade.loadPosts(this.threadId, 1, this.pageSize);
            this.facade.loadPoll(this.threadId);
            this.loadMyReactions();

            // Join thread room for real-time updates
            this.pushService.joinThread(this.threadId);
            this.pushSub?.unsubscribe();
            this.pushSub = this.pushService.on<PushThreadNewPost>("thread:newPost").subscribe((ev) => {
                // Skip if it's our own post
                if (ev.authorId === this.authFacade.currentUser()?.id) return;
                this.newPostHint.set(ev);
                this.cd.markForCheck();
            });
        });
    }

    ngOnDestroy(): void {
        if (this.threadId) {
            this.pushService.leaveThread(this.threadId);
        }
        this.pushSub?.unsubscribe();
    }

    /** Reload posts after a push notification about a new post. */
    loadNewPosts(): void {
        this.newPostHint.set(null);
        const lastPage = Math.ceil((this.facade.postTotal() + 1) / this.pageSize);
        this.facade.loadPosts(this.threadId, lastPage, this.pageSize);
    }

    onPostsPageChange(event: PaginatorState): void {
        const page = event.page ?? 0;
        const rows = event.rows ?? this.pageSize;
        this.currentPage = page + 1;
        this.facade.loadPosts(this.threadId, this.currentPage, rows);
    }

    /** Check if HTML content from Quill editor has actual visible text. */
    hasContent(html: string): boolean {
        const text = html
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();
        return text.length > 0;
    }

    submitReply(): void {
        if (!this.hasContent(this.replyContent)) return;
        this.submittingReply = true;
        this.replyError = null;
        this.facade.createPost(this.threadId, this.replyContent, this.replyKnowledgeSource || undefined).subscribe({
            next: () => {
                this.replyContent = "";
                this.replyKnowledgeSource = "";
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
        // Strip nested blockquotes, HTML tags, and empty lines for a clean inline quote
        const cleanContent = post.content
            .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "")
            .replace(/<\/?p>/gi, " ")
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
        const quote = `<blockquote>${post.authorName}: ${cleanContent}</blockquote><p><br></p>`;
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

    // ── Poll ──────────────────────────────────────────────────────────────────

    pollHasImages(): boolean {
        const poll = this.facade.currentPoll();
        return !!poll && poll.options.some((o) => !!o.imageUrl);
    }

    votePoll(optionIndex: number): void {
        const poll = this.facade.currentPoll();
        if (!poll || poll.isClosed) return;
        // Allow vote if: hasn't voted yet, OR can change vote
        if (poll.myVote !== null && !poll.canChangeVote) return;
        if (poll.myVote === optionIndex) return; // same option
        this.facade.votePoll(this.threadId, optionIndex).subscribe({
            next: () => {
                this.facade.loadPoll(this.threadId);
                this.cd.markForCheck();
            }
        });
    }

    // ── Poll editing ─────────────────────────────────────────────────────────

    canEditPoll(): boolean {
        const poll = this.facade.currentPoll();
        const user = this.authFacade.currentUser();
        if (!poll || !user) return false;
        return user.id === poll.authorId || user.role === "admin" || user.role === "moderator";
    }

    openPollEditDialog(): void {
        const poll = this.facade.currentPoll();
        if (!poll) return;
        this.pollEditQuestion = poll.question;
        this.pollEditIsAnonymous = poll.isAnonymous;
        this.pollEditShowVoterNames = poll.showVoterNames;
        this.pollEditAllowVoteChange = poll.allowVoteChange;
        this.pollEditVoteChangeDeadline = poll.voteChangeDeadline?.slice(0, 16) ?? "";
        this.pollEditClosesAt = poll.closesAt?.slice(0, 16) ?? "";
        this.pollEditIsClosed = poll.isClosed;
        this.pollEditNewOptions = [{ text: "", imageUrl: "" }];
        this.pollEditDialogVisible.set(true);
    }

    addPollEditOption(): void {
        this.pollEditNewOptions = [...this.pollEditNewOptions, { text: "", imageUrl: "" }];
    }

    removePollEditOption(index: number): void {
        this.pollEditNewOptions = this.pollEditNewOptions.filter((_, i) => i !== index);
    }

    submitPollEdit(): void {
        const validNew = this.pollEditNewOptions
            .filter((o) => o.text.trim())
            .map((o) => ({ text: o.text.trim(), ...(o.imageUrl.trim() ? { imageUrl: o.imageUrl.trim() } : {}) }));

        const payload: Record<string, unknown> = {
            question: this.pollEditQuestion.trim(),
            isAnonymous: this.pollEditIsAnonymous,
            showVoterNames: this.pollEditShowVoterNames,
            allowVoteChange: this.pollEditAllowVoteChange,
            voteChangeDeadline: this.pollEditVoteChangeDeadline || null,
            closesAt: this.pollEditClosesAt || null,
            isClosed: this.pollEditIsClosed
        };

        if (validNew.length > 0) {
            payload["addOptions"] = validNew;
        }

        this.pollEditSubmitting = true;
        this.facade.updatePoll(this.threadId, payload).subscribe({
            next: () => {
                this.pollEditDialogVisible.set(false);
                this.pollEditSubmitting = false;
                this.facade.loadPoll(this.threadId);
                this.cd.markForCheck();
            },
            error: () => {
                this.pollEditSubmitting = false;
                this.cd.markForCheck();
            }
        });
    }

    // ── Post editing ──────────────────────────────────────────────────────────

    canEditPost(post: Post): boolean {
        const user = this.authFacade.currentUser();
        if (!user) return false;
        return user.id === post.authorId || user.role === "admin" || user.role === "moderator";
    }

    openEditDialog(post: Post): void {
        this.editPostId = post.id;
        this.editContent = post.content;
        this.editReason = "";
        this.editDialogVisible.set(true);
    }

    submitEdit(): void {
        if (!this.hasContent(this.editContent)) return;
        this.editSubmitting = true;
        this.facade.updatePost(this.editPostId, this.editContent, this.editReason || undefined).subscribe({
            next: () => {
                this.editDialogVisible.set(false);
                this.editSubmitting = false;
                this.facade.loadPosts(this.threadId, this.currentPage, this.pageSize);
                this.cd.markForCheck();
            },
            error: () => {
                this.editSubmitting = false;
                this.cd.markForCheck();
            }
        });
    }

    openHistoryDialog(post: Post): void {
        this.editHistory.set(post.editHistory ?? []);
        this.historyDialogVisible.set(true);
    }

    // ── Title editing ─────────────────────────────────────────────────────────

    openTitleEdit(): void {
        const thread = this.facade.currentThread();
        if (!thread) return;
        this.editTitleValue = thread.title;
        this.titleEditDialogVisible.set(true);
    }

    saveTitleEdit(): void {
        const title = this.editTitleValue.trim();
        if (!title) return;
        this.facade.updateThread(this.threadId, { title }).subscribe({
            next: () => {
                this.titleEditDialogVisible.set(false);
                this.facade.loadThread(this.threadId);
                this.cd.markForCheck();
            }
        });
    }

    // ── Moderation ─────────────────────────────────────────────────────────────

    togglePin(): void {
        const thread = this.facade.currentThread();
        if (!thread) return;
        this.facade.togglePin(this.threadId, !thread.isPinned).subscribe({
            next: () => this.facade.loadThread(this.threadId)
        });
    }

    toggleSticky(): void {
        const thread = this.facade.currentThread();
        if (!thread) return;
        this.facade.toggleSticky(this.threadId, !thread.isSticky).subscribe({
            next: () => this.facade.loadThread(this.threadId)
        });
    }

    toggleLock(): void {
        const thread = this.facade.currentThread();
        if (!thread) return;
        this.facade.toggleLock(this.threadId, !thread.isLocked).subscribe({
            next: () => this.facade.loadThread(this.threadId)
        });
    }

    openMoveDialog(): void {
        this.moveTargetForumId = "";
        this.facade.loadForumsList().subscribe({
            next: (forums) => {
                this.availableForums.set(forums);
                this.moveDialogVisible.set(true);
                this.cd.markForCheck();
            }
        });
    }

    moveThread(): void {
        if (!this.moveTargetForumId) return;
        this.facade.moveThread(this.threadId, this.moveTargetForumId).subscribe({
            next: () => {
                this.moveDialogVisible.set(false);
                this.facade.loadThread(this.threadId);
                this.cd.markForCheck();
            }
        });
    }

    confirmDelete(): void {
        this.deleteDialogVisible.set(true);
    }

    deleteThread(): void {
        this.facade.deleteThread(this.threadId).subscribe({
            next: () => {
                this.deleteDialogVisible.set(false);
                const thread = this.facade.currentThread();
                this.router.navigate(["/forum", thread?.forumId ?? ""]);
            }
        });
    }

    // ── Highlight ──────────────────────────────────────────────────────────────

    toggleHighlight(post: Post): void {
        this.facade.toggleHighlight(post.id).subscribe({
            next: () => {
                this.facade.loadPosts(this.threadId, this.currentPage, this.pageSize);
                this.cd.markForCheck();
            }
        });
    }

    onReplyContentChange(): void {
        if (this.embedDebounceTimer) clearTimeout(this.embedDebounceTimer);
        this.embedDebounceTimer = setTimeout(() => {
            const urls: string[] = [];

            // 1. Extract href values from <a> tags
            const hrefRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/gi;
            let match: RegExpExecArray | null;
            while ((match = hrefRegex.exec(this.replyContent)) !== null) {
                if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
            }

            // 2. Also extract URLs from visible text (Quill may not auto-link yet)
            const plainText = this.replyContent.replace(/<[^>]+>/g, " ");
            const textUrlRegex = /https?:\/\/[^\s<>"']+/gi;
            let textMatch: RegExpExecArray | null;
            while ((textMatch = textUrlRegex.exec(plainText)) !== null) {
                if (!urls.includes(textMatch[0])) urls.push(textMatch[0]);
            }

            const current = this.replyEmbedUrls();
            if (urls.length !== current.length || urls.some((u, i) => u !== current[i])) {
                this.replyEmbedUrls.set(urls);
                this.cd.markForCheck();
            }
        }, 500);
    }

    toggleOfficial(post: Post): void {
        this.facade.toggleOfficial(post.id).subscribe({
            next: () => {
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
