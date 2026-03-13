import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TooltipModule } from "primeng/tooltip";

const LEVEL_COLORS: Record<number, string> = {
    1: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    2: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    3: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
    4: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    5: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
    6: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    7: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    8: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    9: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    10: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
};

const PROGRESS_COLORS: Record<number, string> = {
    1: "bg-gray-400",
    2: "bg-green-500",
    3: "bg-teal-500",
    4: "bg-blue-500",
    5: "bg-indigo-500",
    6: "bg-violet-500",
    7: "bg-purple-500",
    8: "bg-orange-500",
    9: "bg-red-500",
    10: "bg-yellow-500"
};

@Component({
    selector: "level-badge",
    imports: [TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
            [class]="colorClass()"
            [pTooltip]="levelName()"
            tooltipPosition="top"
        >
            <i class="pi pi-star-fill text-[10px]"></i>
            Lv. {{ level() }}
        </span>
    `
})
export class LevelBadge {
    readonly level = input.required<number>();
    readonly levelName = input.required<string>();

    protected colorClass(): string {
        return LEVEL_COLORS[this.level()] ?? LEVEL_COLORS[1];
    }
}

@Component({
    selector: "level-progress",
    imports: [TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
                <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                    [class]="colorClass()"
                >
                    <i class="pi pi-star-fill text-[10px]"></i>
                    Level {{ level() }} – {{ levelName() }}
                </span>
                <span class="text-surface-500 text-xs">{{ xp() }} XP</span>
            </div>
            <div class="bg-surface-200 dark:bg-surface-700 h-2 w-full overflow-hidden rounded-full">
                <div
                    class="h-full rounded-full transition-all duration-500"
                    [class]="progressColorClass()"
                    [style.width.%]="xpProgressPercent()"
                ></div>
            </div>
            @if (xpToNextLevel() > 0) {
                <span class="text-surface-400 text-xs">{{ xpToNextLevel() }} XP bis nächstes Level</span>
            } @else {
                <span class="text-yellow-600 dark:text-yellow-400 text-xs font-medium">Maximales Level erreicht!</span>
            }
        </div>
    `
})
export class LevelProgress {
    readonly level = input.required<number>();
    readonly levelName = input.required<string>();
    readonly xp = input.required<number>();
    readonly xpToNextLevel = input.required<number>();
    readonly xpProgressPercent = input.required<number>();

    protected colorClass(): string {
        return LEVEL_COLORS[this.level()] ?? LEVEL_COLORS[1];
    }

    protected progressColorClass(): string {
        return PROGRESS_COLORS[this.level()] ?? PROGRESS_COLORS[1];
    }
}
