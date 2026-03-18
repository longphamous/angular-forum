import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { TooltipModule } from "primeng/tooltip";

import { AchievementRarity, UserAchievement } from "../../models/gamification/achievement";

const RARITY_STYLES: Record<AchievementRarity, { badge: string; glow: string; labelKey: string }> = {
    bronze: {
        badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
        glow: "shadow-amber-200 dark:shadow-amber-900",
        labelKey: "adminAchievements.rarities.bronze"
    },
    silver: {
        badge: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600",
        glow: "shadow-slate-200 dark:shadow-slate-800",
        labelKey: "adminAchievements.rarities.silver"
    },
    gold: {
        badge: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
        glow: "shadow-yellow-200 dark:shadow-yellow-900",
        labelKey: "adminAchievements.rarities.gold"
    },
    platinum: {
        badge: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700",
        glow: "shadow-cyan-200 dark:shadow-cyan-900",
        labelKey: "adminAchievements.rarities.platinum"
    }
};

@Component({
    selector: "achievement-badge",
    imports: [TooltipModule, TranslocoModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div
            class="flex flex-col items-center gap-2 rounded-xl border p-3 text-center shadow-sm transition-transform hover:scale-105"
            [class]="rarityStyles().badge"
            [pTooltip]="tooltipText()"
            tooltipPosition="top"
        >
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 dark:bg-black/20">
                <i class="text-xl" [class]="achievement().icon"></i>
            </div>
            <div class="w-full min-w-0">
                <div class="truncate text-xs leading-tight font-semibold">{{ achievement().name }}</div>
                <div class="mt-0.5 text-[10px] font-medium opacity-70">{{ rarityLabel() }}</div>
            </div>
        </div>
    `
})
export class AchievementBadge {
    readonly achievement = input.required<UserAchievement>();
    private readonly translocoService = inject(TranslocoService);

    protected rarityStyles() {
        return RARITY_STYLES[this.achievement().rarity] ?? RARITY_STYLES["bronze"];
    }

    protected rarityLabel(): string {
        return this.translocoService.translate(this.rarityStyles().labelKey);
    }

    protected tooltipText(): string {
        const a = this.achievement();
        const parts = [a.name];
        if (a.description) parts.push(a.description);
        const locale = this.translocoService.getActiveLang() === "de" ? "de-DE" : "en-US";
        const date = new Date(a.earnedAt).toLocaleDateString(locale);
        parts.push(this.translocoService.translate("adminAchievements.earnedAt", { date }));
        return parts.join("\n");
    }
}

@Component({
    selector: "achievement-card",
    imports: [TooltipModule, TranslocoModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex items-center gap-3 rounded-xl border p-3 shadow-sm" [class]="rarityStyles().badge">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 dark:bg-black/20">
                <i class="text-xl" [class]="achievement().icon"></i>
            </div>
            <div class="min-w-0 flex-1">
                <div class="text-sm leading-tight font-semibold">{{ achievement().name }}</div>
                @if (achievement().description) {
                    <div class="mt-0.5 text-xs leading-snug opacity-75">{{ achievement().description }}</div>
                }
                <div class="mt-1 text-[10px] opacity-60">{{ rarityLabel() }} · {{ earnedDate() }}</div>
            </div>
        </div>
    `
})
export class AchievementCard {
    readonly achievement = input.required<UserAchievement>();
    private readonly translocoService = inject(TranslocoService);

    protected rarityStyles() {
        return RARITY_STYLES[this.achievement().rarity] ?? RARITY_STYLES["bronze"];
    }

    protected rarityLabel(): string {
        return this.translocoService.translate(this.rarityStyles().labelKey);
    }

    protected earnedDate(): string {
        const locale = this.translocoService.getActiveLang() === "de" ? "de-DE" : "en-US";
        return new Date(this.achievement().earnedAt).toLocaleDateString(locale);
    }
}
