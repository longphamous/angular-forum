import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";

import { MODERATION_ROUTES } from "../../../core/api/moderation.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    APPROVAL_TYPE_LABELS,
    ApprovalStatus,
    ModerationStats,
    ProfileApproval
} from "../../../core/models/moderation/moderation";

@Component({
    selector: "admin-moderation",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        BadgeModule,
        ButtonModule,
        DialogModule,
        FormsModule,
        InputTextModule,
        RouterModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        TranslocoModule
    ],
    templateUrl: "./admin-moderation.html"
})
export class AdminModeration implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    protected readonly loading = signal(true);
    protected readonly pending = signal<ProfileApproval[]>([]);
    protected readonly history = signal<ProfileApproval[]>([]);
    protected readonly stats = signal<ModerationStats | null>(null);
    protected readonly activeTab = signal<"pending" | "history">("pending");

    protected readonly reviewDialogVisible = signal(false);
    protected readonly reviewItem = signal<ProfileApproval | null>(null);
    protected reviewNote = "";
    protected readonly processing = signal(false);

    protected readonly typeLabels = APPROVAL_TYPE_LABELS;

    ngOnInit(): void {
        this.loadPending();
        this.loadStats();
    }

    private loadPending(): void {
        this.loading.set(true);
        this.http.get<ProfileApproval[]>(`${this.config.baseUrl}${MODERATION_ROUTES.pending()}`).subscribe({
            next: (data) => {
                this.pending.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private loadStats(): void {
        this.http.get<ModerationStats>(`${this.config.baseUrl}${MODERATION_ROUTES.stats()}`).subscribe({
            next: (s) => this.stats.set(s)
        });
    }

    loadHistory(): void {
        this.http.get<ProfileApproval[]>(`${this.config.baseUrl}${MODERATION_ROUTES.history()}`).subscribe({
            next: (data) => this.history.set(data)
        });
    }

    openReview(item: ProfileApproval): void {
        this.reviewItem.set(item);
        this.reviewNote = "";
        this.reviewDialogVisible.set(true);
    }

    approve(): void {
        const item = this.reviewItem();
        if (!item) return;
        this.processing.set(true);
        this.http
            .post(`${this.config.baseUrl}${MODERATION_ROUTES.approve(item.id)}`, { note: this.reviewNote || undefined })
            .subscribe({
                next: () => {
                    this.processing.set(false);
                    this.reviewDialogVisible.set(false);
                    this.loadPending();
                    this.loadStats();
                },
                error: () => this.processing.set(false)
            });
    }

    reject(): void {
        const item = this.reviewItem();
        if (!item) return;
        this.processing.set(true);
        this.http
            .post(`${this.config.baseUrl}${MODERATION_ROUTES.reject(item.id)}`, { note: this.reviewNote || undefined })
            .subscribe({
                next: () => {
                    this.processing.set(false);
                    this.reviewDialogVisible.set(false);
                    this.loadPending();
                    this.loadStats();
                },
                error: () => this.processing.set(false)
            });
    }

    onTabChange(tab: "pending" | "history"): void {
        this.activeTab.set(tab);
        if (tab === "history" && this.history().length === 0) this.loadHistory();
    }

    statusSeverity(status: ApprovalStatus): "warn" | "success" | "danger" {
        if (status === "approved") return "success";
        if (status === "rejected") return "danger";
        return "warn";
    }

    formatDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    isImageType(type: string): boolean {
        return type === "avatar" || type === "avatar_url" || type === "cover";
    }
}
