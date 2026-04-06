import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";

import { NavigationHistoryService } from "../../../../core/services/navigation-history.service";
import { AnimeFacade, PersonStaffRole, PersonVoiceActingRole } from "../../../../facade/anime/anime-facade";

const PREVIEW_LIMIT = 5;

@Component({
    selector: "app-person-detail",
    imports: [ButtonModule, DatePipe, DividerModule, RouterModule, SkeletonModule, TabsModule, TagModule, TranslocoModule],
    templateUrl: "./person-detail.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonDetail implements OnInit {
    protected readonly facade = inject(AnimeFacade);
    protected readonly person = this.facade.personDetail;
    protected readonly showFullAbout = signal(false);
    protected readonly showAllStaff = signal(false);
    protected readonly showAllVa = signal(false);
    protected readonly activeTab = signal("staff");
    protected readonly navHistory = inject(NavigationHistoryService);

    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);

    protected readonly displayedStaff = computed((): PersonStaffRole[] => {
        const items = this.person()?.staffRoles ?? [];
        return this.showAllStaff() ? items : items.slice(0, PREVIEW_LIMIT);
    });

    protected readonly displayedVa = computed((): PersonVoiceActingRole[] => {
        const items = this.person()?.voiceActingRoles ?? [];
        return this.showAllVa() ? items : items.slice(0, PREVIEW_LIMIT);
    });

    protected readonly tabCount = computed(() => {
        const p = this.person();
        if (!p) return 0;
        let count = 0;
        if (p.staffRoles?.length) count++;
        if (p.voiceActingRoles?.length) count++;
        return count;
    });

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = Number(params.get("id"));
            this.showFullAbout.set(false);
            this.showAllStaff.set(false);
            this.showAllVa.set(false);
            this.facade.loadPersonById(id);

            // Auto-select first available tab
            const p = this.person();
            if (p?.staffRoles?.length) {
                this.activeTab.set("staff");
            } else {
                this.activeTab.set("va");
            }
        });
    }

    protected truncatedAbout(): string {
        const s = this.person()?.about ?? "";
        return s.length > 400 ? s.substring(0, 400) + "…" : s;
    }

    protected back(): void {
        this.navHistory.back("/anime/people");
    }
}
