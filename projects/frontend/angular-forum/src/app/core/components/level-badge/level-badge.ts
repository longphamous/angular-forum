import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
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
    imports: [TooltipModule, TranslocoModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-1.5" *transloco="let t">
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
                <span class="text-surface-400 text-xs">{{
                    t("levelBadge.xpToNextLevel", { xp: xpToNextLevel() })
                }}</span>
            } @else {
                <span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">{{
                    t("levelBadge.maxLevel")
                }}</span>
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

/* ── Gradient pairs for the orb ring & glow ─────────────────────────── */
const ORB_GRADIENTS: Record<number, { from: string; to: string; glow: string }> = {
    1: { from: "#9ca3af", to: "#6b7280", glow: "rgba(156,163,175,0.45)" },
    2: { from: "#34d399", to: "#059669", glow: "rgba(52,211,153,0.45)" },
    3: { from: "#2dd4bf", to: "#0d9488", glow: "rgba(45,212,191,0.45)" },
    4: { from: "#60a5fa", to: "#2563eb", glow: "rgba(96,165,250,0.45)" },
    5: { from: "#818cf8", to: "#4f46e5", glow: "rgba(129,140,248,0.45)" },
    6: { from: "#a78bfa", to: "#7c3aed", glow: "rgba(167,139,250,0.45)" },
    7: { from: "#c084fc", to: "#9333ea", glow: "rgba(192,132,252,0.45)" },
    8: { from: "#fb923c", to: "#ea580c", glow: "rgba(251,146,60,0.45)" },
    9: { from: "#f87171", to: "#dc2626", glow: "rgba(248,113,113,0.45)" },
    10: { from: "#fbbf24", to: "#d97706", glow: "rgba(251,191,36,0.5)" }
};

@Component({
    selector: "level-orb",
    imports: [TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        :host {
            display: block;
        }

        .level-orb {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-weight: 800;
            line-height: 1;
            user-select: none;
            cursor: default;
            transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;
        }

        .level-orb:hover {
            transform: scale(1.12);
        }

        /* shiny highlight on upper-left */
        .level-orb::before {
            content: "";
            position: absolute;
            top: 10%;
            left: 14%;
            width: 35%;
            height: 30%;
            border-radius: 50%;
            background: radial-gradient(ellipse, rgba(255, 255, 255, 0.55), transparent 70%);
            pointer-events: none;
        }

        @keyframes orb-pulse {
            0%,
            100% {
                box-shadow: var(--orb-shadow-base);
            }
            50% {
                box-shadow: var(--orb-shadow-pulse);
            }
        }

        .level-orb--max {
            animation: orb-pulse 2.5s ease-in-out infinite;
        }
    `,
    template: `
        <div
            class="level-orb"
            [class.level-orb--max]="level() >= 10"
            [pTooltip]="levelName()"
            [style]="orbStyle()"
            tooltipPosition="top"
        >
            {{ level() }}
        </div>
    `
})
export class LevelOrb {
    readonly level = input.required<number>();
    readonly levelName = input.required<string>();
    readonly size = input<"sm" | "md" | "lg">("md");

    protected readonly orbStyle = computed(() => {
        const l = this.level();
        const s = this.size();
        const g = ORB_GRADIENTS[l] ?? ORB_GRADIENTS[1];

        const dims: Record<string, { px: number; font: string; border: number }> = {
            sm: { px: 22, font: "0.6rem", border: 2 },
            md: { px: 28, font: "0.7rem", border: 2 },
            lg: { px: 34, font: "0.85rem", border: 3 }
        };
        const d = dims[s];

        const shadowBase = `0 0 6px ${g.glow}, inset 0 1px 2px rgba(255,255,255,0.25)`;
        const shadowPulse = `0 0 14px ${g.glow}, 0 0 4px ${g.glow}, inset 0 1px 2px rgba(255,255,255,0.25)`;

        return {
            "width": `${d.px}px`,
            "height": `${d.px}px`,
            "fontSize": d.font,
            "border": `${d.border}px solid rgba(255,255,255,0.25)`,
            "background": `linear-gradient(135deg, ${g.from}, ${g.to})`,
            "color": "white",
            "textShadow": "0 1px 3px rgba(0,0,0,0.4)",
            "boxShadow": shadowBase,
            "--orb-shadow-base": shadowBase,
            "--orb-shadow-pulse": shadowPulse
        };
    });
}
