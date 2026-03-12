import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { EditorModule } from "primeng/editor";
import { MessageModule } from "primeng/message";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { ForumFacade } from "../../../../facade/forum/forum-facade";

@Component({
    selector: "thread-detail",
    imports: [
        FormsModule,
        ButtonModule,
        EditorModule,
        TagModule,
        SkeletonModule,
        MessageModule,
        RouterModule,
        DividerModule,
        PaginatorModule
    ],
    templateUrl: "./thread-detail.html",
    styleUrl: "./thread-detail.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadDetail implements OnInit {
    readonly facade = inject(ForumFacade);
    readonly route = inject(ActivatedRoute);
    readonly router = inject(Router);
    readonly cd = inject(ChangeDetectorRef);
    readonly pageSize = 20;

    replyContent = "";
    submittingReply = false;
    replyError: string | null = null;

    private threadId = "";

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.threadId = params["threadId"] as string;
            this.facade.loadThread(this.threadId);
            this.facade.loadPosts(this.threadId, 1, this.pageSize);
        });
    }

    onPostsPageChange(event: PaginatorState): void {
        const page = event.page ?? 0;
        const rows = event.rows ?? this.pageSize;
        this.facade.loadPosts(this.threadId, page + 1, rows);
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
                this.replyError = "Fehler beim Senden der Antwort.";
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
}
