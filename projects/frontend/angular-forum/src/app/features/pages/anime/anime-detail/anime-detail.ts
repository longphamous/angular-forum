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

import { AnimeListEntry, AnimeListEntryPayload, AnimeListStatus } from "../../../../core/models/anime/anime";
import { AnimeFacade } from "../../../../facade/anime/anime-facade";

interface StatusOption {
    icon: string;
    label: string;
    value: AnimeListStatus;
}

const STATUS_OPTION_VALUES: { icon: string; value: AnimeListStatus; key: string }[] = [
    { icon: "pi pi-play", value: "watching", key: "anime.detail.listStatuses.watching" },
    { icon: "pi pi-check", value: "completed", key: "anime.detail.listStatuses.completed" },
    { icon: "pi pi-clock", value: "plan_to_watch", key: "anime.detail.listStatuses.plan_to_watch" },
    { icon: "pi pi-pause", value: "on_hold", key: "anime.detail.listStatuses.on_hold" },
    { icon: "pi pi-times", value: "dropped", key: "anime.detail.listStatuses.dropped" }
];

const STATUS_SEVERITY: Record<AnimeListStatus, "success" | "info" | "warn" | "danger" | "secondary"> = {
    completed: "success",
    dropped: "danger",
    on_hold: "warn",
    plan_to_watch: "info",
    watching: "secondary"
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
    selector: "app-anime-detail",
    templateUrl: "./anime-detail.html"
})
export class AnimeDetail implements OnInit {
    // ① Injections (no dependencies)
    protected readonly facade = inject(AnimeFacade);

    // ② Derived from facade
    protected readonly anime = this.facade.currentAnime;
    protected readonly listEntry = computed(() => {
        const a = this.anime();
        if (!a) return null;
        return this.facade.userList().find((e) => e.animeId === a.id) ?? null;
    });

    // ③ Form – inline inject avoids ordering conflict with private fb
    protected readonly listForm = inject(FormBuilder).group({
        episodesWatched: [null as number | null],
        review: ["", Validators.maxLength(2000)],
        score: [null as number | null],
        status: [null as AnimeListStatus | null, Validators.required]
    });

    // ④ Signals
    protected readonly removing = signal(false);
    protected readonly saveError = signal<string | null>(null);
    protected readonly saveSuccess = signal(false);
    protected readonly saving = signal(false);
    protected readonly showFullSynopsis = signal(false);
    protected statusOptions: StatusOption[] = [];

    // ⑤ Private
    private readonly destroyRef = inject(DestroyRef);
    private readonly location = inject(Location);
    private readonly route = inject(ActivatedRoute);
    private readonly translocoService = inject(TranslocoService);

    constructor() {
        effect(() => {
            const entry = this.listEntry();
            if (entry) {
                this.listForm.patchValue(
                    {
                        episodesWatched: entry.episodesWatched ?? null,
                        review: entry.review ?? "",
                        score: entry.score ?? null,
                        status: entry.status
                    },
                    { emitEvent: false }
                );
            } else {
                this.listForm.reset({
                    episodesWatched: null,
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
        const s = this.anime()?.synopsis ?? "";
        return s.length > 400 ? s.substring(0, 400) + "…" : s;
    }

    protected scoreClass(): string {
        const m = this.anime()?.mean;
        if (!m) return "text-surface-400";
        if (m >= 8) return "text-green-500";
        if (m >= 7) return "text-yellow-500";
        return "text-red-400";
    }

    protected statusTagSeverity(): "success" | "secondary" | "warn" | "info" {
        switch (this.anime()?.status?.toLowerCase()) {
            case "finished airing":
                return "secondary";
            case "currently airing":
                return "success";
            case "not yet aired":
                return "warn";
            default:
                return "info";
        }
    }

    protected listStatusLabel(): string {
        const entry = this.listEntry();
        if (!entry) return "";
        return this.translocoService.translate("anime.detail.listStatuses." + entry.status);
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

    protected formatDate(year?: number, month?: number, day?: number): string {
        if (!year) return "—";
        if (!month) return year.toString();
        if (!day) return `${year}-${String(month).padStart(2, "0")}`;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    protected saveEntry(): void {
        if (this.listForm.invalid || !this.anime()) return;
        this.saving.set(true);
        this.saveSuccess.set(false);
        this.saveError.set(null);

        const payload: AnimeListEntryPayload = {
            animeId: this.anime()!.id,
            episodesWatched: this.listForm.value.episodesWatched ?? undefined,
            review: this.listForm.value.review ?? undefined,
            score: this.listForm.value.score ?? undefined,
            status: this.listForm.value.status!
        };

        this.facade.saveListEntry(payload).subscribe({
            next: (entry: AnimeListEntry) => {
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
        if (!this.anime()) return;
        this.removing.set(true);
        this.facade.removeFromList(this.anime()!.id).subscribe({
            next: () => {
                this.facade.removeFromUserListLocally(this.anime()!.id);
                this.listForm.reset();
                this.removing.set(false);
            },
            error: () => {
                this.removing.set(false);
            }
        });
    }

    protected back(): void {
        this.location.back();
    }
}
