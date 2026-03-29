import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { Subscription } from "rxjs";

import type { ClanMemberRole } from "../../../core/models/clan/clan";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { ClanFacade } from "../../../facade/clan/clan-facade";

@Component({
    selector: "clan-detail-page",
    standalone: true,
    imports: [
        DatePipe,
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        ConfirmDialogModule,
        InputTextModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./clan-detail-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanDetailPage implements OnInit, OnDestroy {
    readonly facade = inject(ClanFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly activeTab = signal("0");
    readonly commentText = signal("");

    private routeSub?: Subscription;
    private clanId = "";

    readonly currentMember = computed(() => {
        const userId = this.authFacade.currentUser()?.id;
        if (!userId) return null;
        return this.facade.members().find((m) => m.userId === userId) ?? null;
    });

    readonly isOwnerOrAdmin = computed(() => {
        const member = this.currentMember();
        return member?.role === "owner" || member?.role === "admin";
    });

    readonly isMember = computed(() => this.currentMember() !== null);

    ngOnInit(): void {
        this.routeSub = this.route.params.subscribe((params) => {
            this.clanId = params["id"] as string;
            this.facade.loadClan(this.clanId);
            this.facade.loadMembers(this.clanId);
            this.facade.loadPages(this.clanId);
            this.facade.loadComments(this.clanId);
        });
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
        this.facade.clearCurrentClan();
    }

    onTabChange(value: string | number | undefined): void {
        const tab = String(value ?? "0");
        this.activeTab.set(tab);
        if (tab === "3" && this.isOwnerOrAdmin()) {
            this.facade.loadApplications(this.clanId);
        }
    }

    joinClan(): void {
        this.facade.joinClan(this.clanId).subscribe({
            next: () => {
                this.messageService.add({ severity: "success", summary: this.t.translate("clans.joined") });
                this.facade.loadClan(this.clanId);
                this.facade.loadMembers(this.clanId);
            }
        });
    }

    leaveClan(): void {
        this.confirmationService.confirm({
            message: this.t.translate("clans.leaveClan") + "?",
            accept: () => {
                this.facade.leaveClan(this.clanId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: "info", summary: this.t.translate("clans.left") });
                        this.facade.loadClan(this.clanId);
                        this.facade.loadMembers(this.clanId);
                    }
                });
            }
        });
    }

    submitComment(): void {
        const content = this.commentText().trim();
        if (!content) return;
        this.facade.addComment(this.clanId, content).subscribe({
            next: () => this.commentText.set("")
        });
    }

    acceptApplication(appId: string): void {
        this.facade.acceptApplication(this.clanId, appId).subscribe({
            next: () => {
                this.messageService.add({ severity: "success", summary: this.t.translate("clans.accepted") });
                this.facade.loadApplications(this.clanId);
                this.facade.loadMembers(this.clanId);
            }
        });
    }

    declineApplication(appId: string): void {
        this.facade.declineApplication(this.clanId, appId).subscribe({
            next: () => {
                this.messageService.add({ severity: "info", summary: this.t.translate("clans.declined") });
                this.facade.loadApplications(this.clanId);
            }
        });
    }

    kickMember(memberId: string): void {
        this.confirmationService.confirm({
            message: this.t.translate("clans.kick") + "?",
            accept: () => {
                this.facade.removeMember(this.clanId, memberId).subscribe({
                    next: () => {
                        this.messageService.add({ severity: "warn", summary: this.t.translate("clans.kicked") });
                        this.facade.loadMembers(this.clanId);
                    }
                });
            }
        });
    }

    promoteMember(memberId: string, newRole: ClanMemberRole): void {
        this.facade.updateMember(this.clanId, memberId, { role: newRole }).subscribe({
            next: () => {
                this.facade.loadMembers(this.clanId);
            }
        });
    }

    roleSeverity(role: ClanMemberRole): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            owner: "danger",
            admin: "warn",
            moderator: "info",
            member: "secondary"
        };
        return map[role] ?? "secondary";
    }

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            active: "success",
            inactive: "warn",
            disbanded: "danger"
        };
        return map[status] ?? "info";
    }
}
