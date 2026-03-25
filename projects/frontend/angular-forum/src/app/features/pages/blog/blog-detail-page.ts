import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import { BLOG_ROUTES } from "../../../core/api/blog.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { BlogComment, BlogPostDetail, BlogType } from "../../../core/models/blog/blog";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-blog-detail-page",
    imports: [
        AvatarModule,
        ButtonModule,
        ChipModule,
        FormsModule,
        RouterModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: "./blog-detail-page.html"
})
export class BlogDetailPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    protected readonly navHistory = inject(NavigationHistoryService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);
    protected readonly authFacade = inject(AuthFacade);

    protected readonly loading = signal(true);
    protected readonly post = signal<BlogPostDetail | null>(null);
    protected readonly commentContent = signal("");
    protected readonly replyTo = signal<BlogComment | null>(null);
    protected readonly submittingComment = signal(false);
    protected readonly deletingPost = signal(false);

    private get apiBase(): string {
        return this.config.baseUrl;
    }

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get("slug") ?? "";
        this.loadPost(slug);
    }

    private loadPost(slug: string): void {
        this.loading.set(true);
        this.http.get<BlogPostDetail>(`${this.apiBase}${BLOG_ROUTES.post(slug)}`).subscribe({
            next: (post) => {
                this.post.set(post);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                void this.router.navigate(["/blog"]);
            }
        });
    }

    protected get safeContent(): SafeHtml {
        const content = this.post()?.content ?? "";
        return this.sanitizer.bypassSecurityTrustHtml(content);
    }

    protected typeBadgeSeverity(type: BlogType): "info" | "success" | "warn" | "secondary" {
        switch (type) {
            case "editorial":
                return "info";
            case "news":
                return "success";
            case "diary":
                return "warn";
            default:
                return "secondary";
        }
    }

    protected formatDate(dateStr: string | null): string {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    }

    protected formatTime(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const min = Math.floor(diff / 60_000);
        if (min < 1) return "Gerade eben";
        if (min < 60) return `${min} Min.`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h} Std.`;
        const d = Math.floor(h / 24);
        return `${d} Tag${d > 1 ? "e" : ""}`;
    }

    protected userInitial(name: string): string {
        return name.charAt(0).toUpperCase();
    }

    protected setReplyTo(comment: BlogComment | null): void {
        this.replyTo.set(comment);
        this.commentContent.set("");
    }

    protected submitComment(): void {
        const content = this.commentContent().trim();
        const post = this.post();
        if (!content || !post) return;

        const payload: { content: string; parentId?: string } = { content };
        const reply = this.replyTo();
        if (reply) payload.parentId = reply.id;

        this.submittingComment.set(true);
        this.http.post<BlogComment>(`${this.apiBase}${BLOG_ROUTES.postComments(post.id)}`, payload).subscribe({
            next: (comment) => {
                this.post.update((p) => {
                    if (!p) return p;
                    if (comment.parentId) {
                        const comments = p.comments.map((c) =>
                            c.id === comment.parentId ? { ...c, replies: [...(c.replies ?? []), comment] } : c
                        );
                        return { ...p, comments, commentCount: p.commentCount + 1 };
                    }
                    return {
                        ...p,
                        comments: [...p.comments, { ...comment, replies: [] }],
                        commentCount: p.commentCount + 1
                    };
                });
                this.commentContent.set("");
                this.replyTo.set(null);
                this.submittingComment.set(false);
            },
            error: () => this.submittingComment.set(false)
        });
    }

    protected deleteComment(commentId: string, parentId: string | null): void {
        this.http.delete(`${this.apiBase}${BLOG_ROUTES.deleteComment(commentId)}`).subscribe({
            next: () => {
                this.post.update((p) => {
                    if (!p) return p;
                    let comments: BlogComment[];
                    if (parentId) {
                        comments = p.comments.map((c) =>
                            c.id === parentId
                                ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }
                                : c
                        );
                    } else {
                        comments = p.comments.filter((c) => c.id !== commentId);
                    }
                    return { ...p, comments, commentCount: Math.max(0, p.commentCount - 1) };
                });
            }
        });
    }

    protected editPost(): void {
        const post = this.post();
        if (post) void this.router.navigate(["/blog", post.slug, "edit"]);
    }

    protected deletePost(): void {
        const post = this.post();
        if (!post || !confirm(this.translocoService.translate('blog.confirmDelete'))) return;
        this.deletingPost.set(true);
        this.http.delete(`${this.apiBase}${BLOG_ROUTES.deletePost(post.id)}`).subscribe({
            next: () => void this.router.navigate(["/blog"]),
            error: () => this.deletingPost.set(false)
        });
    }

    protected goBack(): void {
        this.navHistory.back("/blog");
    }

    protected setCommentContent(value: string): void {
        this.commentContent.set(value);
    }

    protected canModify(authorId: string): boolean {
        return this.authFacade.isAdmin() || this.authFacade.currentUser()?.id === authorId;
    }
}
