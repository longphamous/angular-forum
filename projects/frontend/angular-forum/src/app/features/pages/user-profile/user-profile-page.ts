import { DatePipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { ACHIEVEMENT_ROUTES } from "../../../core/api/achievement.routes";
import { USER_ROUTES } from "../../../core/api/user.routes";
import { AchievementBadge } from "../../../core/components/achievement-badge/achievement-badge";
import { LevelProgress } from "../../../core/components/level-badge/level-badge";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    ChronikEntry,
    ChronikEntryType,
    ChronikVisibility,
    CreateChronikEntry
} from "../../../core/models/chronik/chronik";
import { UserAchievement } from "../../../core/models/gamification/achievement";
import { UserProfile, UserRole } from "../../../core/models/user/user";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { ChronikFacade } from "../../../facade/chronik/chronik-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AchievementBadge,
        AvatarModule,
        ButtonModule,
        CardModule,
        DatePipe,
        DividerModule,
        FormsModule,
        InputTextModule,
        LevelProgress,
        RouterModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-user-profile-page",
    templateUrl: "./user-profile-page.html"
})
export class UserProfilePage implements OnInit {
    protected readonly isOwnProfile = computed(() => {
        const uid = this.profileUserId();
        return !!uid && uid === this.authFacade.currentUser()?.id;
    });
    protected readonly loading = signal(true);
    protected readonly profile = signal<UserProfile | null>(null);
    protected readonly achievements = signal<UserAchievement[]>([]);
    protected readonly activeTab = signal<"info" | "chronik">("info");

    // Chronik on profile
    readonly chronikFacade = inject(ChronikFacade);
    protected readonly chronikLoaded = signal(false);
    protected readonly profileStats = computed(() => this.chronikFacade.profileStats());

    // Chronik composer (own profile)
    protected readonly formType = signal<ChronikEntryType>("text");
    protected readonly formVisibility = signal<ChronikVisibility>("public");
    protected readonly saving = signal(false);
    protected formContent = "";
    protected formImageUrl = "";
    protected formLinkUrl = "";
    protected formLinkTitle = "";
    protected formLinkDescription = "";
    protected formLinkImageUrl = "";

    // Comments inline
    protected readonly expandedComments = signal<Set<string>>(new Set());
    protected newComments = new Map<string, string>();
    protected loadedCommentEntries = new Set<string>();
    protected readonly replyingTo = signal<Map<string, string>>(new Map());

    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly authFacade = inject(AuthFacade);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly http = inject(HttpClient);
    private readonly profileUserId = signal<string | null>(null);
    private readonly route = inject(ActivatedRoute);
    private readonly translocoService = inject(TranslocoService);

    readonly visibilityOptions = [
        { label: "Öffentlich", value: "public" as ChronikVisibility },
        { label: "Gefolgte", value: "followers" as ChronikVisibility },
        { label: "Privat", value: "private" as ChronikVisibility }
    ];

    ngOnInit(): void {
        const userId = this.route.snapshot.paramMap.get("userId")!;
        this.profileUserId.set(userId);
        this.http.get<UserProfile>(`${this.apiConfig.baseUrl}${USER_ROUTES.publicProfile(userId)}`).subscribe({
            next: (p) => {
                this.profile.set(p);
                this.loading.set(false);
                this.cd.markForCheck();
            },
            error: () => {
                this.loading.set(false);
                this.cd.markForCheck();
            }
        });
        this.http.get<UserAchievement[]>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.user(userId)}`).subscribe({
            next: (data) => {
                this.achievements.set(data);
                this.cd.markForCheck();
            },
            error: () => undefined
        });
    }

    protected switchTab(tab: "info" | "chronik"): void {
        this.activeTab.set(tab);
        if (tab === "chronik" && !this.chronikLoaded()) {
            const userId = this.profileUserId()!;
            this.chronikFacade.loadProfileEntries(userId);
            this.chronikFacade.loadProfileStats(userId);
            this.chronikLoaded.set(true);
        }
    }

    protected loadMoreChronik(): void {
        const userId = this.profileUserId()!;
        this.chronikFacade.loadProfileEntries(userId, this.chronikFacade.profileEntries().length);
    }

    protected submitEntry(): void {
        if (!this.formContent.trim()) return;

        const dto: CreateChronikEntry = {
            content: this.formContent.trim(),
            type: this.formType(),
            visibility: this.formVisibility()
        };
        if (this.formType() === "image" && this.formImageUrl.trim()) dto.imageUrl = this.formImageUrl.trim();
        if (this.formType() === "link" && this.formLinkUrl.trim()) {
            dto.linkUrl = this.formLinkUrl.trim();
            if (this.formLinkTitle.trim()) dto.linkTitle = this.formLinkTitle.trim();
            if (this.formLinkDescription.trim()) dto.linkDescription = this.formLinkDescription.trim();
            if (this.formLinkImageUrl.trim()) dto.linkImageUrl = this.formLinkImageUrl.trim();
        }

        this.saving.set(true);
        this.chronikFacade.createEntry(dto).subscribe({
            next: (entry) => {
                this.chronikFacade.profileEntries.update((prev) => [entry, ...prev]);
                this.chronikFacade.profileTotal.update((t) => t + 1);
                this.resetForm();
                this.saving.set(false);
                this.cd.markForCheck();
            },
            error: () => {
                this.saving.set(false);
                this.cd.markForCheck();
            }
        });
    }

    protected toggleLike(entry: ChronikEntry): void {
        this.chronikFacade.toggleLike(entry.id).subscribe({
            next: (res) => {
                this.chronikFacade.profileEntries.update((prev) =>
                    prev.map((e) => (e.id === entry.id ? { ...e, isLiked: res.liked, likeCount: res.likeCount } : e))
                );
                this.cd.markForCheck();
            }
        });
    }

    protected deleteEntry(entry: ChronikEntry): void {
        if (!confirm("Beitrag wirklich löschen?")) return;
        this.chronikFacade.deleteEntry(entry.id).subscribe({
            next: () => {
                this.chronikFacade.profileEntries.update((prev) => prev.filter((e) => e.id !== entry.id));
                this.chronikFacade.profileTotal.update((t) => Math.max(0, t - 1));
                this.cd.markForCheck();
            }
        });
    }

    protected toggleFollow(): void {
        const userId = this.profileUserId();
        if (!userId) return;
        this.chronikFacade.toggleFollow(userId).subscribe({
            next: () => {
                this.chronikFacade.loadProfileStats(userId);
                this.cd.markForCheck();
            }
        });
    }

    protected toggleComments(entryId: string): void {
        const current = this.expandedComments();
        const next = new Set(current);
        if (next.has(entryId)) {
            next.delete(entryId);
        } else {
            next.add(entryId);
            if (!this.loadedCommentEntries.has(entryId)) {
                this.loadedCommentEntries.add(entryId);
                this.chronikFacade.loadComments(entryId).subscribe({ next: () => this.cd.markForCheck() });
            }
        }
        this.expandedComments.set(next);
    }

    protected isCommentsExpanded(entryId: string): boolean {
        return this.expandedComments().has(entryId);
    }

    protected getComments(entryId: string) {
        return this.chronikFacade.comments().get(entryId) ?? [];
    }

    protected getNewComment(entryId: string): string {
        return this.newComments.get(entryId) ?? "";
    }

    protected setNewComment(entryId: string, value: string): void {
        this.newComments.set(entryId, value);
    }

    protected submitComment(entryId: string, parentId?: string): void {
        const text = parentId
            ? (this.newComments.get(`${entryId}-${parentId}`) ?? "")
            : (this.newComments.get(entryId) ?? "");
        if (!text.trim()) return;
        this.chronikFacade.createComment(entryId, text.trim(), parentId).subscribe({
            next: () => {
                if (parentId) {
                    this.newComments.set(`${entryId}-${parentId}`, "");
                    const m = new Map(this.replyingTo());
                    m.delete(entryId);
                    this.replyingTo.set(m);
                } else {
                    this.newComments.set(entryId, "");
                }
                this.chronikFacade.profileEntries.update((prev) =>
                    prev.map((e) => (e.id === entryId ? { ...e, commentCount: e.commentCount + 1 } : e))
                );
                this.cd.markForCheck();
            }
        });
    }

    protected deleteComment(commentId: string, entryId: string): void {
        if (!confirm("Kommentar löschen?")) return;
        this.chronikFacade.deleteComment(commentId, entryId).subscribe({
            next: () => {
                this.chronikFacade.profileEntries.update((prev) =>
                    prev.map((e) => (e.id === entryId ? { ...e, commentCount: Math.max(0, e.commentCount - 1) } : e))
                );
                this.cd.markForCheck();
            }
        });
    }

    protected toggleCommentLike(commentId: string, entryId: string): void {
        this.chronikFacade.toggleCommentLike(commentId, entryId).subscribe({ next: () => this.cd.markForCheck() });
    }

    protected setReplyingTo(entryId: string, commentId: string): void {
        const m = new Map(this.replyingTo());
        m.get(entryId) === commentId ? m.delete(entryId) : m.set(entryId, commentId);
        this.replyingTo.set(m);
    }

    protected getReplyingTo(entryId: string): string | undefined {
        return this.replyingTo().get(entryId);
    }

    protected getAvatarLabel(displayName: string): string {
        return displayName.charAt(0).toUpperCase();
    }

    protected visibilityIcon(v: ChronikVisibility): string {
        if (v === "public") return "pi pi-globe";
        if (v === "followers") return "pi pi-users";
        return "pi pi-lock";
    }

    protected formatDate(dateStr?: string | null, format: "month-year" | "full" = "month-year"): string {
        if (!dateStr) return "—";
        const opts =
            format === "full"
                ? { day: "2-digit" as const, month: "long" as const, year: "numeric" as const }
                : { month: "long" as const, year: "numeric" as const };
        return new Date(dateStr).toLocaleDateString("de-DE", opts);
    }

    protected genderLabel(gender?: string): string {
        if (!gender) return "—";
        return this.translocoService.translate("userProfile.genders." + gender) ?? gender;
    }

    protected roleLabel(role: UserRole): string {
        return this.translocoService.translate("userProfile.roles." + role);
    }

    protected roleSeverity(role: UserRole): "danger" | "warn" | "info" | "secondary" {
        if (role === "admin") return "danger";
        if (role === "moderator") return "warn";
        if (role === "member") return "info";
        return "secondary";
    }

    protected initial(profile: UserProfile): string {
        return (profile.displayName || profile.username).charAt(0).toUpperCase();
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
}
