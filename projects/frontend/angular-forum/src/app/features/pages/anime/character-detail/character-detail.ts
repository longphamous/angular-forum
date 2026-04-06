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
import { CharacterAnime, CharacterManga, CharacterVoiceActor } from "../../../../facade/anime/anime-facade";
import { AnimeFacade } from "../../../../facade/anime/anime-facade";

const PREVIEW_LIMIT = 5;

@Component({
    selector: "app-character-detail",
    imports: [ButtonModule, DividerModule, RouterModule, SkeletonModule, TabsModule, TagModule, TranslocoModule],
    templateUrl: "./character-detail.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterDetail implements OnInit {
    protected readonly facade = inject(AnimeFacade);
    protected readonly character = this.facade.characterDetail;
    protected readonly showFullAbout = signal(false);
    protected readonly showAllAnime = signal(false);
    protected readonly showAllManga = signal(false);
    protected readonly showAllVa = signal(false);
    protected readonly activeTab = signal("anime");
    protected readonly navHistory = inject(NavigationHistoryService);

    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);

    protected readonly displayedAnime = computed((): CharacterAnime[] => {
        const items = this.character()?.animeography ?? [];
        return this.showAllAnime() ? items : items.slice(0, PREVIEW_LIMIT);
    });

    protected readonly displayedManga = computed((): CharacterManga[] => {
        const items = this.character()?.mangaography ?? [];
        return this.showAllManga() ? items : items.slice(0, PREVIEW_LIMIT);
    });

    protected readonly displayedVa = computed((): CharacterVoiceActor[] => {
        const items = this.character()?.voiceActors ?? [];
        return this.showAllVa() ? items : items.slice(0, PREVIEW_LIMIT);
    });

    protected readonly tabCount = computed(() => {
        const c = this.character();
        if (!c) return 0;
        let count = 0;
        if (c.animeography?.length) count++;
        if (c.mangaography?.length) count++;
        if (c.voiceActors?.length) count++;
        return count;
    });

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = Number(params.get("id"));
            this.showFullAbout.set(false);
            this.showAllAnime.set(false);
            this.showAllManga.set(false);
            this.showAllVa.set(false);
            this.activeTab.set("anime");
            this.facade.loadCharacterById(id);
        });
    }

    protected truncatedAbout(): string {
        const s = this.character()?.about ?? "";
        return s.length > 400 ? s.substring(0, 400) + "…" : s;
    }

    protected back(): void {
        this.navHistory.back("/anime/characters");
    }
}
