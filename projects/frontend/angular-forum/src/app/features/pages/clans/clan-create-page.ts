import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import type { ClanJoinType } from "../../../core/models/clan/clan";
import { ClanFacade } from "../../../facade/clan/clan-facade";

@Component({
    selector: "clan-create-page",
    standalone: true,
    imports: [
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TextareaModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: "./clan-create-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanCreatePage implements OnInit {
    readonly facade = inject(ClanFacade);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);

    readonly name = signal("");
    readonly tag = signal("");
    readonly tagColor = signal("#6366f1");
    readonly description = signal("");
    readonly categoryId = signal<string | null>(null);
    readonly joinType = signal<ClanJoinType>("open");
    readonly saving = signal(false);

    readonly joinTypeOptions = computed(() => [
        { label: this.t.translate("clans.joinTypes.open"), value: "open" },
        { label: this.t.translate("clans.joinTypes.invite"), value: "invite" },
        { label: this.t.translate("clans.joinTypes.application"), value: "application" },
        { label: this.t.translate("clans.joinTypes.moderated"), value: "moderated" }
    ]);

    ngOnInit(): void {
        this.facade.loadCategories();
    }

    submit(): void {
        if (!this.name() || !this.description()) return;
        this.saving.set(true);

        this.facade
            .createClan({
                name: this.name(),
                description: this.description(),
                tag: this.tag() || undefined,
                tagColor: this.tagColor() || undefined,
                categoryId: this.categoryId() ?? undefined,
                joinType: this.joinType()
            })
            .subscribe({
                next: (clan) => {
                    this.saving.set(false);
                    this.messageService.add({ severity: "success", summary: this.t.translate("clans.created") });
                    this.router.navigate(["/clans", clan.id]);
                },
                error: () => this.saving.set(false)
            });
    }
}
