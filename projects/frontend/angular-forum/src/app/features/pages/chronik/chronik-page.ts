import { DatePipe, NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import {
    ChronikEntry,
    ChronikEntryType,
    ChronikVisibility,
    CreateChronikEntry
} from "../../../core/models/chronik/chronik";
import { ChronikFacade } from "../../../facade/chronik/chronik-facade";
import { OnlineIndicator } from "../../../shared/components/online-indicator/online-indicator";

@Component({
    selector: "app-chronik-page",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        TranslocoModule,
        NgClass,
        DatePipe,
        ButtonModule,
        AvatarModule,
        TextareaModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        DividerModule,
        BadgeModule,
        OnlineIndicator
    ],
    templateUrl: "./chronik-page.html"
})
export class ChronikPage implements OnInit {
    readonly facade = inject(ChronikFacade);
    private readonly translocoService = inject(TranslocoService);

    readonly feedMode = signal<"all" | "following">("all");
    readonly composerVisible = signal(true);
    readonly formType = signal<ChronikEntryType>("text");
    readonly formVisibility = signal<ChronikVisibility>("public");
    readonly expandedComments = signal<Set<string>>(new Set());
    readonly replyingTo = signal<Map<string, string>>(new Map()); // entryId -> parentCommentId
    readonly saving = signal(false);

    formContent = "";
    formImageUrl = "";
    formLinkUrl = "";
    formLinkTitle = "";
    formLinkDescription = "";
    formLinkImageUrl = "";
    newComments = new Map<string, string>();
    loadedCommentEntries = new Set<string>();

    get visibilityOptions(): { label: string; value: ChronikVisibility }[] {
        return [
            { label: this.translocoService.translate('chronik.visibility.public'), value: "public" as ChronikVisibility },
            { label: this.translocoService.translate('chronik.visibility.followers'), value: "followers" as ChronikVisibility },
            { label: this.translocoService.translate('chronik.visibility.private'), value: "private" as ChronikVisibility }
        ];
    }

    ngOnInit(): void {
        this.facade.loadEntries({ offset: 0 });
    }

    switchFeed(mode: "all" | "following"): void {
        this.feedMode.set(mode);
        this.facade.loadEntries({ feed: mode === "following", offset: 0 });
    }

    setFormType(type: ChronikEntryType): void {
        this.formType.set(type);
    }

    setFormVisibility(value: ChronikVisibility): void {
        this.formVisibility.set(value);
    }

    submitEntry(): void {
        if (!this.formContent.trim()) return;

        const dto: CreateChronikEntry = {
            content: this.formContent.trim(),
            type: this.formType(),
            visibility: this.formVisibility()
        };

        if (this.formType() === "image" && this.formImageUrl.trim()) {
            dto.imageUrl = this.formImageUrl.trim();
        }
        if (this.formType() === "link" && this.formLinkUrl.trim()) {
            dto.linkUrl = this.formLinkUrl.trim();
            if (this.formLinkTitle.trim()) dto.linkTitle = this.formLinkTitle.trim();
            if (this.formLinkDescription.trim()) dto.linkDescription = this.formLinkDescription.trim();
            if (this.formLinkImageUrl.trim()) dto.linkImageUrl = this.formLinkImageUrl.trim();
        }

        this.saving.set(true);
        this.facade.createEntry(dto).subscribe({
            next: () => {
                this.resetForm();
                this.saving.set(false);
            },
            error: () => {
                this.saving.set(false);
            }
        });
    }

    cancelCompose(): void {
        this.resetForm();
    }

    private resetForm(): void {
        this.formContent = "";
        this.formImageUrl = "";
        this.formLinkUrl = "";
        this.formLinkTitle = "";
        this.formLinkDescription = "";
        this.formLinkImageUrl = "";
        this.formType.set("text");
        this.formVisibility.set("public");
    }

    toggleLike(entry: ChronikEntry): void {
        this.facade.toggleLike(entry.id).subscribe();
    }

    hideEntry(entry: ChronikEntry): void {
        this.facade.hideEntry(entry.id).subscribe();
    }

    deleteEntry(entry: ChronikEntry): void {
        if (!confirm("Really delete this post?")) return;
        this.facade.deleteEntry(entry.id).subscribe();
    }

    toggleComments(entryId: string): void {
        const current = this.expandedComments();
        const next = new Set(current);
        if (next.has(entryId)) {
            next.delete(entryId);
            this.expandedComments.set(next);
        } else {
            next.add(entryId);
            this.expandedComments.set(next);
            if (!this.loadedCommentEntries.has(entryId)) {
                this.loadedCommentEntries.add(entryId);
                this.facade.loadComments(entryId).subscribe();
            }
        }
    }

    isCommentsExpanded(entryId: string): boolean {
        return this.expandedComments().has(entryId);
    }

    getComments(entryId: string) {
        return this.facade.comments().get(entryId) ?? [];
    }

    isCommentsLoading(entryId: string): boolean {
        return this.facade.commentsLoading().has(entryId);
    }

    getNewComment(entryId: string): string {
        return this.newComments.get(entryId) ?? "";
    }

    setNewComment(entryId: string, value: string): void {
        this.newComments.set(entryId, value);
    }

    submitComment(entryId: string, parentId?: string): void {
        const text = this.newComments.get(entryId) ?? "";
        if (!text.trim()) return;

        this.facade.createComment(entryId, text.trim(), parentId).subscribe({
            next: () => {
                this.newComments.set(entryId, "");
                if (parentId) {
                    const replyMap = new Map(this.replyingTo());
                    replyMap.delete(entryId);
                    this.replyingTo.set(replyMap);
                }
            }
        });
    }

    submitReply(entryId: string, parentCommentId: string): void {
        const key = `${entryId}-${parentCommentId}`;
        const text = this.newComments.get(key) ?? "";
        if (!text.trim()) return;

        this.facade.createComment(entryId, text.trim(), parentCommentId).subscribe({
            next: () => {
                this.newComments.set(key, "");
                const replyMap = new Map(this.replyingTo());
                replyMap.delete(entryId);
                this.replyingTo.set(replyMap);
            }
        });
    }

    deleteComment(commentId: string, entryId: string): void {
        if (!confirm("Delete this comment?")) return;
        this.facade.deleteComment(commentId, entryId).subscribe();
    }

    toggleCommentLike(commentId: string, entryId: string): void {
        this.facade.toggleCommentLike(commentId, entryId).subscribe();
    }

    setReplyingTo(entryId: string, commentId: string): void {
        const replyMap = new Map(this.replyingTo());
        if (replyMap.get(entryId) === commentId) {
            replyMap.delete(entryId);
        } else {
            replyMap.set(entryId, commentId);
        }
        this.replyingTo.set(replyMap);
    }

    getReplyingTo(entryId: string): string | undefined {
        return this.replyingTo().get(entryId);
    }

    loadMore(): void {
        this.facade.loadMore();
    }

    getAvatarLabel(displayName: string): string {
        return displayName.charAt(0).toUpperCase();
    }

    visibilityIcon(visibility: ChronikVisibility): string {
        if (visibility === "public") return "pi pi-globe";
        if (visibility === "followers") return "pi pi-users";
        return "pi pi-lock";
    }

    visibilitySeverity(visibility: ChronikVisibility): "success" | "info" | "secondary" {
        if (visibility === "public") return "success";
        if (visibility === "followers") return "info";
        return "secondary";
    }
}
