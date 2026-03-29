import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { Subscription } from "rxjs";

import type { ClanJoinType } from "../../../core/models/clan/clan";
import { ClanFacade } from "../../../facade/clan/clan-facade";

@Component({
    selector: "clan-settings-page",
    standalone: true,
    imports: [
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        InputTextModule,
        SelectModule,
        TextareaModule,
        ToastModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./clan-settings-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanSettingsPage implements OnInit, OnDestroy {
    readonly facade = inject(ClanFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly name = signal("");
    readonly tag = signal("");
    readonly tagColor = signal("#6366f1");
    readonly description = signal("");
    readonly joinType = signal<ClanJoinType>("open");
    readonly showActivity = signal(true);
    readonly showMembers = signal(true);
    readonly showComments = signal(true);
    readonly applicationTemplate = signal("");
    readonly saving = signal(false);

    private routeSub?: Subscription;
    private clanId = "";

    readonly joinTypeOptions = computed(() => [
        { label: this.t.translate("clans.joinTypes.open"), value: "open" },
        { label: this.t.translate("clans.joinTypes.invite"), value: "invite" },
        { label: this.t.translate("clans.joinTypes.application"), value: "application" },
        { label: this.t.translate("clans.joinTypes.moderated"), value: "moderated" }
    ]);

    ngOnInit(): void {
        this.routeSub = this.route.params.subscribe((params) => {
            this.clanId = params["id"] as string;
            this.facade.loadClan(this.clanId);
        });

        // Populate form when clan data arrives - use a simple interval check
        const check = setInterval(() => {
            const clan = this.facade.currentClan();
            if (clan) {
                this.name.set(clan.name);
                this.tag.set(clan.tag ?? "");
                this.tagColor.set(clan.tagColor ?? "#6366f1");
                this.description.set(clan.description ?? "");
                this.joinType.set(clan.joinType);
                this.showActivity.set(clan.showActivity);
                this.showMembers.set(clan.showMembers);
                this.showComments.set(clan.showComments);
                this.applicationTemplate.set(clan.applicationTemplate ?? "");
                clearInterval(check);
            }
        }, 100);
        setTimeout(() => clearInterval(check), 5000);
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
    }

    save(): void {
        this.saving.set(true);
        this.facade
            .updateClan(this.clanId, {
                name: this.name(),
                description: this.description(),
                tag: this.tag() || undefined,
                tagColor: this.tagColor() || undefined,
                joinType: this.joinType(),
                showActivity: this.showActivity(),
                showMembers: this.showMembers(),
                showComments: this.showComments(),
                applicationTemplate: this.applicationTemplate() || undefined
            })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.messageService.add({ severity: "success", summary: this.t.translate("clans.saved") });
                },
                error: () => this.saving.set(false)
            });
    }

    disbandClan(): void {
        this.confirmationService.confirm({
            message: this.t.translate("clans.disbandConfirm"),
            accept: () => {
                this.facade.deleteClan(this.clanId).subscribe({
                    next: () => {
                        this.router.navigate(["/clans"]);
                    }
                });
            }
        });
    }
}
