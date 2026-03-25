import { DatePipe, DecimalPipe, NgClass } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { ACHIEVEMENT_ROUTES } from "../../../core/api/achievement.routes";
import { BLOG_ROUTES } from "../../../core/api/blog.routes";
import { CLIPS_ROUTES } from "../../../core/api/clips.routes";
import { FRIENDS_ROUTES } from "../../../core/api/friends.routes";
import { GALLERY_ROUTES } from "../../../core/api/gallery.routes";
import { GAMIFICATION_ROUTES } from "../../../core/api/gamification.routes";
import { LEXICON_ROUTES } from "../../../core/api/lexicon.routes";
import { RECIPES_ROUTES } from "../../../core/api/recipes.routes";
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
import { Clip, PaginatedClips } from "../../../core/models/clips/clips";
import { FriendshipStatusResult, FriendUser } from "../../../core/models/friends/friends";
import { UserAchievement } from "../../../core/models/gamification/achievement";
import { MediaAsset } from "../../../core/models/media/media";
import { UserProfile, UserRole } from "../../../core/models/user/user";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { TabPersistenceService } from "../../../core/services/tab-persistence.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { ChronikFacade } from "../../../facade/chronik/chronik-facade";
import { FriendsFacade } from "../../../facade/friends/friends-facade";
import { ClipThumbnail } from "../../../shared/components/clip-thumbnail/clip-thumbnail";
import { MediaUpload } from "../../../shared/components/media-upload/media-upload";
import { OnlineIndicator } from "../../../shared/components/online-indicator/online-indicator";

interface BlogPostSummary {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    coverImageUrl?: string;
    viewCount: number;
    createdAt: string;
}
interface LexiconArticleSummary {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    status: string;
    createdAt: string;
}
interface GalleryAlbumSummary {
    id: string;
    title: string;
    coverUrl?: string;
    mediaCount: number;
    createdAt: string;
}
interface RecipeSummary {
    id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    avgRating: number;
    createdAt: string;
}
interface XpHistoryEvent {
    id: string;
    eventType: string;
    xpGained: number;
    referenceId: string | null;
    createdAt: string;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AchievementBadge,
        AvatarModule,
        ButtonModule,
        CardModule,
        ClipThumbnail,
        DatePipe,
        DecimalPipe,
        DialogModule,
        DividerModule,
        NgClass,
        FormsModule,
        InputTextModule,
        LevelProgress,
        RouterModule,
        SelectModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule,
        MediaUpload,
        OnlineIndicator
    ],
    selector: "app-user-profile-page",
    styleUrl: "./user-profile-page.css",
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
    protected readonly friends = signal<FriendUser[]>([]);

    // Friend status
    protected readonly friendStatus = signal<FriendshipStatusResult | null>(null);
    private readonly friendsFacade = inject(FriendsFacade);

    // Cover photo editing
    protected readonly coverEditing = signal(false);
    protected coverUrlDraft = "";

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

    // Content tabs
    protected readonly activeTab = signal("chronik");
    protected readonly userClips = signal<Clip[]>([]);
    protected readonly userBlogPosts = signal<BlogPostSummary[]>([]);
    protected readonly userLexiconArticles = signal<LexiconArticleSummary[]>([]);
    protected readonly userGalleryAlbums = signal<GalleryAlbumSummary[]>([]);
    protected readonly userRecipes = signal<RecipeSummary[]>([]);
    protected readonly userXpHistory = signal<XpHistoryEvent[]>([]);
    protected readonly userXpHistoryTotal = signal(0);
    private readonly loadedTabs = new Set<string>();

    // Comments inline
    protected readonly expandedComments = signal<Set<string>>(new Set());
    protected newComments = new Map<string, string>();
    protected loadedCommentEntries = new Set<string>();
    protected readonly replyingTo = signal<Map<string, string>>(new Map());

    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    readonly authFacade = inject(AuthFacade);
    readonly navHistory = inject(NavigationHistoryService);
    private readonly tabService = inject(TabPersistenceService);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly http = inject(HttpClient);
    private readonly profileUserId = signal<string | null>(null);
    private readonly route = inject(ActivatedRoute);
    private readonly translocoService = inject(TranslocoService);

    readonly visibilityOptions = computed(() => [
        { label: this.translocoService.translate("chronik.visibility.public"), value: "public" as ChronikVisibility },
        {
            label: this.translocoService.translate("chronik.visibility.followers"),
            value: "followers" as ChronikVisibility
        },
        { label: this.translocoService.translate("chronik.visibility.private"), value: "private" as ChronikVisibility }
    ]);

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const userId = params["userId"] as string;
            this.loadProfile(userId);
        });

        // Restore tab when navigating back (query param changes without route param change)
        this.route.queryParams.subscribe((qp) => {
            const tab = qp["tab"] as string | undefined;
            if (tab && tab !== this.activeTab()) {
                this.activeTab.set(tab);
                this.onTabChange(tab);
            }
        });
    }

    private loadProfile(userId: string): void {
        this.profileUserId.set(userId);
        this.loading.set(true);
        this.profile.set(null);
        this.achievements.set([]);
        this.friends.set([]);
        this.friendStatus.set(null);
        this.loadedTabs.clear();
        this.userClips.set([]);
        this.userBlogPosts.set([]);
        this.userLexiconArticles.set([]);
        this.userGalleryAlbums.set([]);
        this.userRecipes.set([]);
        this.userXpHistory.set([]);
        this.userXpHistoryTotal.set(0);

        // Restore tab from URL query param or default to "chronik"
        const restoredTab = this.tabService.get("chronik");
        this.activeTab.set(restoredTab);
        if (restoredTab !== "chronik") {
            this.onTabChange(restoredTab);
        }

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

        // Load friends list
        this.http.get<FriendUser[]>(`${this.apiConfig.baseUrl}${FRIENDS_ROUTES.list()}?userId=${userId}`).subscribe({
            next: (data) => {
                this.friends.set(data);
                this.cd.markForCheck();
            },
            error: () => undefined
        });

        // Auto-load chronik data
        this.chronikFacade.loadProfileEntries(userId);
        this.chronikFacade.loadProfileStats(userId);
        this.chronikLoaded.set(true);

        // Load friend status (only for other users' profiles)
        if (userId !== this.authFacade.currentUser()?.id) {
            this.friendsFacade.getFriendshipStatus(userId).subscribe({
                next: (status) => {
                    this.friendStatus.set(status);
                    this.cd.markForCheck();
                },
                error: () => undefined
            });
        }
    }

    protected saveCover(): void {
        this.authFacade.updateProfile({ coverUrl: this.coverUrlDraft }).subscribe({
            next: () => {
                this.profile.update((p) => (p ? { ...p, coverUrl: this.coverUrlDraft } : p));
                this.coverEditing.set(false);
                this.cd.markForCheck();
            }
        });
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
        if (!confirm(this.translocoService.translate("chronik.confirmDeleteEntry"))) return;
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
        if (!confirm(this.translocoService.translate("chronik.confirmDeleteComment"))) return;
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

    protected sendFriendRequest(): void {
        const userId = this.profileUserId();
        if (!userId) return;
        this.friendsFacade.sendRequest(userId).subscribe({
            next: () => {
                this.friendStatus.set({ status: "pending_sent", friendshipId: null });
                this.cd.markForCheck();
            }
        });
    }

    protected acceptFriendRequest(): void {
        const status = this.friendStatus();
        if (!status?.friendshipId) return;
        this.friendsFacade.acceptRequest(status.friendshipId).subscribe({
            next: () => {
                this.friendStatus.set({ status: "friends", friendshipId: status.friendshipId });
                this.cd.markForCheck();
            }
        });
    }

    protected declineFriendRequest(): void {
        const status = this.friendStatus();
        if (!status?.friendshipId) return;
        this.friendsFacade.declineRequest(status.friendshipId).subscribe({
            next: () => {
                this.friendStatus.set({ status: "none", friendshipId: null });
                this.cd.markForCheck();
            }
        });
    }

    protected removeFriend(): void {
        const status = this.friendStatus();
        if (!status?.friendshipId) return;
        this.friendsFacade.removeFriend(status.friendshipId).subscribe({
            next: () => {
                this.friendStatus.set({ status: "none", friendshipId: null });
                this.cd.markForCheck();
            }
        });
    }

    protected cancelFriendRequest(): void {
        const status = this.friendStatus();
        if (!status?.friendshipId) return;
        this.friendsFacade.cancelRequest(status.friendshipId).subscribe({
            next: () => {
                this.friendStatus.set({ status: "none", friendshipId: null });
                this.cd.markForCheck();
            }
        });
    }

    protected onCoverUploaded(asset: MediaAsset): void {
        this.coverUrlDraft = asset.url;
        this.cd.markForCheck();
    }

    protected onChronikImageUploaded(asset: MediaAsset): void {
        this.formImageUrl = asset.url;
        this.cd.markForCheck();
    }

    protected onTabChange(tabValue: string | number | undefined): void {
        if (tabValue == null) return;
        const tab = String(tabValue);
        this.activeTab.set(tab);
        this.tabService.set(tab);
        const userId = this.profileUserId();
        if (!userId || this.loadedTabs.has(tab)) return;
        this.loadedTabs.add(tab);

        switch (tab) {
            case "clips":
                this.http
                    .get<
                        PaginatedClips | Clip[]
                    >(`${this.apiConfig.baseUrl}${CLIPS_ROUTES.userClips(userId)}`, { params: { page: 1, limit: 50 } })
                    .subscribe({
                        next: (res) => {
                            this.userClips.set(Array.isArray(res) ? res : (res.data ?? []));
                            this.cd.markForCheck();
                        }
                    });
                break;
            case "blog":
                this.http
                    .get<
                        BlogPostSummary[] | { data: BlogPostSummary[] }
                    >(`${this.apiConfig.baseUrl}${BLOG_ROUTES.posts()}`, { params: { authorId: userId, limit: 50 } })
                    .subscribe({
                        next: (res) => {
                            this.userBlogPosts.set(Array.isArray(res) ? res : (res.data ?? []));
                            this.cd.markForCheck();
                        }
                    });
                break;
            case "lexicon":
                this.http
                    .get<
                        LexiconArticleSummary[] | { data: LexiconArticleSummary[] }
                    >(`${this.apiConfig.baseUrl}${LEXICON_ROUTES.articles()}`, { params: { authorId: userId, limit: 50 } })
                    .subscribe({
                        next: (res) => {
                            this.userLexiconArticles.set(Array.isArray(res) ? res : (res.data ?? []));
                            this.cd.markForCheck();
                        }
                    });
                break;
            case "gallery":
                this.http
                    .get<
                        GalleryAlbumSummary[] | { data: GalleryAlbumSummary[] }
                    >(`${this.apiConfig.baseUrl}${GALLERY_ROUTES.albums()}`, { params: { ownerId: userId } })
                    .subscribe({
                        next: (res) => {
                            this.userGalleryAlbums.set(Array.isArray(res) ? res : (res.data ?? []));
                            this.cd.markForCheck();
                        }
                    });
                break;
            case "recipes":
                this.http
                    .get<
                        RecipeSummary[] | { data: RecipeSummary[] }
                    >(`${this.apiConfig.baseUrl}${RECIPES_ROUTES.list()}`, { params: { authorId: userId, limit: 50 } })
                    .subscribe({
                        next: (res) => {
                            this.userRecipes.set(Array.isArray(res) ? res : (res.data ?? []));
                            this.cd.markForCheck();
                        }
                    });
                break;
            case "xp-history":
                this.http
                    .get<{
                        events: XpHistoryEvent[];
                        total: number;
                    }>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.userHistory(userId)}`, {
                        params: { limit: 100 }
                    })
                    .subscribe({
                        next: (res) => {
                            this.userXpHistory.set(res.events);
                            this.userXpHistoryTotal.set(res.total);
                            this.cd.markForCheck();
                        }
                    });
                break;
        }
    }

    protected xpEventLabel(eventType: string): { icon: string; label: string; color: string } {
        const map: Record<string, { icon: string; translationKey: string; color: string }> = {
            create_thread: { icon: "pi pi-comments", translationKey: "xpHistory.createThread", color: "text-blue-500" },
            create_post: { icon: "pi pi-comment", translationKey: "xpHistory.createPost", color: "text-blue-400" },
            receive_reaction: {
                icon: "pi pi-heart-fill",
                translationKey: "xpHistory.receiveReaction",
                color: "text-pink-500"
            },
            give_reaction: { icon: "pi pi-heart", translationKey: "xpHistory.giveReaction", color: "text-pink-400" },
            create_clip: { icon: "pi pi-video", translationKey: "xpHistory.createClip", color: "text-purple-500" },
            create_blog_post: {
                icon: "pi pi-pencil",
                translationKey: "xpHistory.createBlogPost",
                color: "text-green-500"
            },
            upload_gallery: { icon: "pi pi-image", translationKey: "xpHistory.uploadGallery", color: "text-cyan-500" },
            create_lexicon_article: {
                icon: "pi pi-book",
                translationKey: "xpHistory.createLexiconArticle",
                color: "text-indigo-500"
            },
            create_recipe: {
                icon: "pi pi-clipboard",
                translationKey: "xpHistory.createRecipe",
                color: "text-orange-500"
            },
            buy_lotto_ticket: {
                icon: "pi pi-ticket",
                translationKey: "xpHistory.buyLottoTicket",
                color: "text-yellow-500"
            }
        };
        const entry = map[eventType];
        if (entry) {
            return {
                icon: entry.icon,
                label: this.translocoService.translate(entry.translationKey),
                color: entry.color
            };
        }
        return { icon: "pi pi-star", label: eventType, color: "text-surface-500" };
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
