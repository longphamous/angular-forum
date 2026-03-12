import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { ForumFacade } from "../../../../facade/forum/forum-facade";

@Component({
    selector: "thread-list",
    imports: [
        RouterModule,
        ButtonModule,
        TagModule,
        SkeletonModule,
        MessageModule,
        TableModule,
        TooltipModule,
        PaginatorModule
    ],
    templateUrl: "./thread-list.html",
    styleUrl: "./thread-list.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadList implements OnInit {
    readonly facade = inject(ForumFacade);
    readonly route = inject(ActivatedRoute);
    readonly router = inject(Router);
    readonly pageSize = 20;

    private forumId = "";

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.forumId = params["forumId"] as string;
            this.facade.loadForum(this.forumId);
            this.facade.loadThreads(this.forumId, 1, this.pageSize);
        });
    }

    onPageChange(event: PaginatorState): void {
        const page = event.page ?? 0;
        const rows = event.rows ?? this.pageSize;
        this.facade.loadThreads(this.forumId, page + 1, rows);
    }

    goToThread(threadId: string): void {
        this.router.navigate(["/forum/threads", threadId]);
    }

    createThread(): void {
        this.router.navigate(["/forum/forums", this.forumId, "create"]);
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
