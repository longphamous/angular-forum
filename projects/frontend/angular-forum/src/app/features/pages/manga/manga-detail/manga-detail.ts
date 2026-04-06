import { Location } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    OnInit,
    signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { PanelModule } from "primeng/panel";
import { RatingModule } from "primeng/rating";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { MangaListEntry, MangaListEntryPayload, MangaListStatus } from "../../../../core/models/manga/manga";
import { NavigationHistoryService } from "../../../../core/services/navigation-history.service";
import { MangaFacade } from "../../../../facade/manga/manga-facade";

interface StatusOption {
    icon: string;
    label: string;
    value: MangaListStatus;
}

const STATUS_OPTION_VALUES: { icon: string; value: MangaListStatus; key: string }[] = [
    { icon: "pi pi-book", value: "reading", key: "manga.detail.listStatuses.reading" },
    { icon: "pi pi-check", value: "completed", key: "manga.detail.listStatuses.completed" },
    { icon: "pi pi-clock", value: "plan_to_read", key: "manga.detail.listStatuses.plan_to_read" },
    { icon: "pi pi-pause", value: "on_hold", key: "manga.detail.listStatuses.on_hold" },
    { icon: "pi pi-times", value: "dropped", key: "manga.detail.listStatuses.dropped" }
];

const STATUS_SEVERITY: Record<MangaListStatus, "success" | "info" | "warn" | "danger" | "secondary"> = {
    completed: "success",
    dropped: "danger",
    on_hold: "warn",
    plan_to_read: "info",
    reading: "secondary"
};

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CardModule,
        DividerModule,
        InputNumberModule,
        MessageModule,
        PanelModule,
        RatingModule,
        ReactiveFormsModule,
        RouterModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-manga-detail",
    templateUrl: "./manga-detail.html"
})
export class MangaDetail implements OnInit {
    protected readonly facade = inject(MangaFacade);
    protected readonly manga = this.facade.currentManga;
    protected readonly listEntry = computed(() => {
        const m = this.manga();
        if (!m) return null;
        return this.facade.userList().find((e) => e.mangaId === m.id) ?? null;
    });

    protected readonly listForm = inject(FormBuilder).group({
        chaptersRead: [null as number | null],
        volumesRead: [null as number | null],
        review: ["", Validators.maxLength(2000)],
        score: [null as number | null],
        status: [null as MangaListStatus | null, Validators.required]
    });

    protected readonly removing = signal(false);
    protected readonly saveError = signal<string | null>(null);
    protected readonly saveSuccess = signal(false);
    protected readonly saving = signal(false);
    protected readonly showFullSynopsis = signal(false);
    protected statusOptions: StatusOption[] = [];

    private readonly destroyRef = inject(DestroyRef);
    private readonly location = inject(Location);
    protected readonly navHistory = inject(NavigationHistoryService);
    private readonly route = inject(ActivatedRoute);
    private readonly translocoService = inject(TranslocoService);

    constructor() {
        effect(() => {
            const entry = this.listEntry();
            if (entry) {
                this.listForm.patchValue(
                    {
                        chaptersRead: entry.chaptersRead ?? null,
                        volumesRead: entry.volumesRead ?? null,
                        review: entry.review ?? "",
                        score: entry.score ?? null,
                        status: entry.status
                    },
                    { emitEvent: false }
                );
            } else {
                this.listForm.reset({
                    chaptersRead: null,
                    volumesRead: null,
                    review: "",
                    score: null,
                    status: null
                });
            }
        });
    }

    ngOnInit(): void {
        this.buildStatusOptions();
        this.translocoService.langChanges$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.buildStatusOptions());
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = Number(params.get("id"));
            this.showFullSynopsis.set(false);
            this.facade.loadById(id);
        });
        this.facade.loadUserList();
    }

    protected truncatedSynopsis(): string {
        const s = this.manga()?.synopsis ?? "";
        return s.length > 400 ? s.substring(0, 400) + "…" : s;
    }

    protected scoreClass(): string {
        const m = this.manga()?.score;
        if (!m) return "text-surface-400";
        if (m >= 8) return "text-green-500";
        if (m >= 7) return "text-yellow-500";
        return "text-red-400";
    }

    protected statusTagSeverity(): "success" | "secondary" | "warn" | "info" {
        switch (this.manga()?.status?.toLowerCase()) {
            case "finished":
                return "secondary";
            case "publishing":
                return "success";
            case "on hiatus":
                return "warn";
            default:
                return "info";
        }
    }

    protected listStatusLabel(): string {
        const entry = this.listEntry();
        if (!entry) return "";
        return this.translocoService.translate("manga.detail.listStatuses." + entry.status);
    }

    private buildStatusOptions(): void {
        this.statusOptions = STATUS_OPTION_VALUES.map((opt) => ({
            icon: opt.icon,
            label: this.translocoService.translate(opt.key),
            value: opt.value
        }));
    }

    protected listStatusSeverity(): "success" | "info" | "warn" | "danger" | "secondary" {
        const entry = this.listEntry();
        if (!entry) return "secondary";
        return STATUS_SEVERITY[entry.status];
    }

    protected saveEntry(): void {
        if (this.listForm.invalid || !this.manga()) return;
        this.saving.set(true);
        this.saveSuccess.set(false);
        this.saveError.set(null);

        const payload: MangaListEntryPayload = {
            mangaId: this.manga()!.id,
            chaptersRead: this.listForm.value.chaptersRead ?? undefined,
            volumesRead: this.listForm.value.volumesRead ?? undefined,
            review: this.listForm.value.review ?? undefined,
            score: this.listForm.value.score ?? undefined,
            status: this.listForm.value.status!
        };

        this.facade.saveListEntry(payload).subscribe({
            next: (entry: MangaListEntry) => {
                this.facade.updateUserListLocally(entry);
                this.saveSuccess.set(true);
                this.saving.set(false);
                setTimeout(() => this.saveSuccess.set(false), 3000);
            },
            error: () => {
                this.saveError.set(this.translocoService.translate("common.saveError"));
                this.saving.set(false);
            }
        });
    }

    protected removeEntry(): void {
        if (!this.manga()) return;
        this.removing.set(true);
        this.facade.removeFromList(this.manga()!.id).subscribe({
            next: () => {
                this.facade.removeFromUserListLocally(this.manga()!.id);
                this.listForm.reset();
                this.removing.set(false);
            },
            error: () => {
                this.removing.set(false);
            }
        });
    }

    protected back(): void {
        this.navHistory.back("/manga-database");
    }
}
