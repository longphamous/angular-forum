import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { MESSAGES_ROUTES } from "../../../core/api/messages.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    ComposePayload,
    Conversation,
    ConversationDetail,
    Draft,
    Message,
    SaveDraftPayload
} from "../../../core/models/messages/messages";
import { TabPersistenceService } from "../../../core/services/tab-persistence.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";

type ActiveTab = "inbox" | "starred" | "drafts" | "important" | "sent" | "archive" | "trash";

const PAGE_SIZE = 15;

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        BadgeModule,
        ButtonModule,
        CheckboxModule,
        DialogModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SkeletonModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService],
    selector: "app-messages-page",
    templateUrl: "./messages-page.html"
})
export class MessagesPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly tabService = inject(TabPersistenceService);
    protected readonly authFacade = inject(AuthFacade);
    protected readonly messageService = inject(MessageService);

    // ─── State ────────────────────────────────────────────────────────────────
    protected readonly loading = signal(true);
    protected readonly conversations = signal<Conversation[]>([]);
    protected readonly drafts = signal<Draft[]>([]);
    protected readonly selectedDetail = signal<ConversationDetail | null>(null);
    protected readonly activeTab = signal<ActiveTab>((this.tabService.get("inbox") as ActiveTab) || "inbox");
    protected readonly loadingDetail = signal(false);
    protected readonly sending = signal(false);

    // ─── Search & pagination ──────────────────────────────────────────────────
    protected readonly searchQuery = signal("");
    protected readonly currentPage = signal(0);

    // ─── Selection & starring ─────────────────────────────────────────────────
    protected readonly selectedIds = signal<Set<string>>(new Set());
    protected readonly starredIds = signal<Set<string>>(new Set());

    // ─── Compose dialog ───────────────────────────────────────────────────────
    protected readonly composeVisible = signal(false);
    protected composeRecipient = signal("");
    protected composeSubject = signal("");
    protected composeContent = signal("");

    // ─── Reply ────────────────────────────────────────────────────────────────
    protected replyContent = signal("");

    // ─── Computed ─────────────────────────────────────────────────────────────
    protected readonly currentUserId = computed(() => this.authFacade.currentUser()?.id ?? "");

    protected readonly unreadTotal = computed(() =>
        this.conversations().reduce((sum, c) => sum + c.unreadCount, 0)
    );

    protected readonly filteredConversations = computed(() => {
        const tab = this.activeTab();
        let list = this.conversations();

        if (tab === "sent") {
            list = list.filter((c) => c.initiatedByUserId === this.currentUserId());
        } else if (tab === "starred") {
            const starred = this.starredIds();
            list = list.filter((c) => starred.has(c.id));
        }

        const query = this.searchQuery().trim().toLowerCase();
        if (query) {
            list = list.filter((c) => {
                const other = this.getOtherParticipant(c);
                return (
                    other.displayName.toLowerCase().includes(query) ||
                    (c.subject?.toLowerCase().includes(query) ?? false) ||
                    c.lastMessage.toLowerCase().includes(query)
                );
            });
        }

        return list;
    });

    protected readonly totalPages = computed(() =>
        Math.max(1, Math.ceil(this.filteredConversations().length / PAGE_SIZE))
    );

    protected readonly paginatedConversations = computed(() => {
        const start = this.currentPage() * PAGE_SIZE;
        return this.filteredConversations().slice(start, start + PAGE_SIZE);
    });

    protected readonly allSelected = computed(() => {
        const page = this.paginatedConversations();
        if (page.length === 0) return false;
        const ids = this.selectedIds();
        return page.every((c) => ids.has(c.id));
    });

    protected readonly canCompose = computed(
        () => this.composeRecipient().trim().length > 0 && this.composeContent().trim().length > 0
    );

    protected readonly canReply = computed(() => this.replyContent().trim().length > 0 && !this.sending());

    ngOnInit(): void {
        this.loadAll();
    }

    private loadAll(): void {
        this.loading.set(true);
        const base = this.apiConfig.baseUrl;

        this.http.get<Conversation[]>(`${base}${MESSAGES_ROUTES.conversations()}`).subscribe({
            next: (list) => this.conversations.set(list)
        });

        this.http.get<Draft[]>(`${base}${MESSAGES_ROUTES.drafts()}`).subscribe({
            next: (list) => {
                this.drafts.set(list);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    // ─── Tab navigation ───────────────────────────────────────────────────────

    protected setActiveTab(tab: ActiveTab): void {
        this.activeTab.set(tab);
        this.tabService.set(tab);
        this.currentPage.set(0);
        this.selectedIds.set(new Set());
        this.selectedDetail.set(null);
    }

    // ─── Selection ────────────────────────────────────────────────────────────

    protected toggleSelection(id: string): void {
        this.selectedIds.update((set) => {
            const next = new Set(set);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    protected toggleSelectAll(checked: boolean): void {
        if (checked) {
            const ids = new Set(this.paginatedConversations().map((c) => c.id));
            this.selectedIds.set(ids);
        } else {
            this.selectedIds.set(new Set());
        }
    }

    // ─── Starring ─────────────────────────────────────────────────────────────

    protected toggleStar(id: string): void {
        this.starredIds.update((set) => {
            const next = new Set(set);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    // ─── Pagination ───────────────────────────────────────────────────────────

    protected prevPage(): void {
        this.currentPage.update((p) => Math.max(0, p - 1));
    }

    protected nextPage(): void {
        this.currentPage.update((p) => Math.min(this.totalPages() - 1, p + 1));
    }

    // ─── Conversation actions ─────────────────────────────────────────────────

    protected selectConversation(conv: Conversation): void {
        this.loadingDetail.set(true);
        this.replyContent.set("");
        const base = this.apiConfig.baseUrl;

        this.http.get<ConversationDetail>(`${base}${MESSAGES_ROUTES.conversation(conv.id)}`).subscribe({
            next: (detail) => {
                this.selectedDetail.set(detail);
                this.conversations.set(
                    this.conversations().map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                );
                this.loadingDetail.set(false);
            },
            error: () => this.loadingDetail.set(false)
        });
    }

    protected closeDetail(): void {
        this.selectedDetail.set(null);
    }

    protected sendReply(): void {
        const detail = this.selectedDetail();
        if (!detail || !this.canReply()) return;
        this.sending.set(true);
        const base = this.apiConfig.baseUrl;
        const content = this.replyContent().trim();

        this.http
            .post<Message>(`${base}${MESSAGES_ROUTES.sendMessage(detail.conversation.id)}`, { content })
            .subscribe({
                next: (msg) => {
                    this.selectedDetail.set({
                        ...detail,
                        messages: [...detail.messages, msg]
                    });
                    this.replyContent.set("");
                    this.sending.set(false);
                    this.messageService.add({ severity: "success", summary: "Nachricht gesendet", life: 2000 });
                },
                error: () => {
                    this.sending.set(false);
                    this.messageService.add({ severity: "error", summary: "Fehler beim Senden", life: 3000 });
                }
            });
    }

    // ─── Compose ──────────────────────────────────────────────────────────────

    protected openCompose(): void {
        this.composeRecipient.set("");
        this.composeSubject.set("");
        this.composeContent.set("");
        this.composeVisible.set(true);
    }

    protected sendNewMessage(): void {
        if (!this.canCompose()) return;
        this.sending.set(true);
        const base = this.apiConfig.baseUrl;

        const payload: ComposePayload = {
            recipientId: this.composeRecipient().trim(),
            subject: this.composeSubject().trim() || undefined,
            content: this.composeContent().trim()
        };

        this.http.post<Conversation>(`${base}${MESSAGES_ROUTES.conversations()}`, payload).subscribe({
            next: (conv) => {
                this.conversations.set([conv, ...this.conversations()]);
                this.composeVisible.set(false);
                this.sending.set(false);
                this.selectConversation(conv);
                this.messageService.add({ severity: "success", summary: "Nachricht gesendet", life: 2000 });
            },
            error: () => {
                this.sending.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler beim Senden", life: 3000 });
            }
        });
    }

    protected saveDraft(): void {
        const base = this.apiConfig.baseUrl;
        const payload: SaveDraftPayload = {
            recipientId: this.composeRecipient().trim() || undefined,
            subject: this.composeSubject().trim() || undefined,
            content: this.composeContent().trim()
        };

        if (!payload.content) return;

        this.http.post<Draft>(`${base}${MESSAGES_ROUTES.drafts()}`, payload).subscribe({
            next: (draft) => {
                this.drafts.set([draft, ...this.drafts()]);
                this.composeVisible.set(false);
                this.messageService.add({ severity: "info", summary: "Entwurf gespeichert", life: 2000 });
            }
        });
    }

    protected deleteDraft(draftId: string): void {
        const base = this.apiConfig.baseUrl;
        this.http.delete(`${base}${MESSAGES_ROUTES.draft(draftId)}`).subscribe({
            next: () => {
                this.drafts.set(this.drafts().filter((d) => d.id !== draftId));
                this.messageService.add({ severity: "success", summary: "Entwurf gelöscht", life: 2000 });
            }
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    protected getOtherParticipant(conv: Conversation): { displayName: string; avatarUrl?: string } {
        const other = conv.participants.find((p) => p.userId !== this.currentUserId());
        return other ?? { displayName: "Unbekannt" };
    }

    protected formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 1) return "Gerade eben";
        if (diffMin < 60) return `${diffMin} Min.`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH} Std.`;
        return date.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
    }

    protected formatDateTime(dateStr: string): string {
        return new Date(dateStr).toLocaleString("de-DE", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    protected avatarLabel(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
}
