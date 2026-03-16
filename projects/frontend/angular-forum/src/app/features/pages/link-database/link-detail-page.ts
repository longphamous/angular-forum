import { KeyValuePipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { DividerModule } from "primeng/divider";
import { RatingModule } from "primeng/rating";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { LinkComment } from "../../../core/models/link-database/link-database";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { LinkDatabaseFacade } from "../../../facade/link-database/link-database-facade";

@Component({
    selector: "app-link-detail-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MessageService],
    imports: [
        ButtonModule,
        ChipModule,
        DividerModule,
        FormsModule,
        KeyValuePipe,
        RatingModule,
        RouterModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./link-detail-page.html"
})
export class LinkDetailPage implements OnInit {
    readonly facade = inject(LinkDatabaseFacade);
    protected readonly authFacade = inject(AuthFacade);
    protected readonly navHistory = inject(NavigationHistoryService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly messageService = inject(MessageService);

    protected readonly newComment = signal("");
    protected readonly submittingComment = signal(false);
    protected readonly userRating = signal(0);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("id") ?? "";
        this.facade.loadLink(id);
        this.facade.loadComments(id);
    }

    protected submitComment(): void {
        const link = this.facade.selectedLink();
        const content = this.newComment().trim();
        if (!link || !content) return;
        this.submittingComment.set(true);
        this.facade.addComment(link.id, content).subscribe({
            next: (c: LinkComment) => {
                this.facade.comments.update((list) => [...list, c]);
                this.newComment.set("");
                this.submittingComment.set(false);
                this.cd.markForCheck();
            },
            error: () => {
                this.submittingComment.set(false);
                this.cd.markForCheck();
            }
        });
    }

    protected deleteComment(id: string): void {
        this.facade.deleteComment(id).subscribe({
            next: () => this.facade.comments.update((list) => list.filter((c) => c.id !== id))
        });
    }

    protected submitRating(score: number): void {
        const link = this.facade.selectedLink();
        if (!link) return;
        this.facade.rateLink(link.id, score).subscribe({
            next: () => {
                this.facade.selectedLink.update((l) => (l ? { ...l, userRating: score } : l));
                this.cd.markForCheck();
            }
        });
    }

    protected openExternal(): void {
        const link = this.facade.selectedLink();
        if (link) window.open(link.url, "_blank", "noopener,noreferrer");
    }

    protected openMaps(): void {
        const link = this.facade.selectedLink();
        if (link?.latitude && link?.longitude) {
            window.open(`https://maps.google.com/?q=${link.latitude},${link.longitude}`, "_blank");
        }
    }

    protected formatDate(d: string): string {
        return new Date(d).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    protected getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    protected isCurrentUser(authorId: string): boolean {
        return this.authFacade.currentUser()?.id === authorId;
    }
}
