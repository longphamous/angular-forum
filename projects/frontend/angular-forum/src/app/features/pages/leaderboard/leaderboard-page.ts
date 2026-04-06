import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";

import { LEVEL_CONFIG } from "../../../core/config/level.config";
import type { LeaderboardEntry } from "../../../core/models/gamification/leaderboard";
import { LeaderboardFacade } from "../../../facade/gamification/leaderboard-facade";

@Component({
    selector: "leaderboard-page",
    standalone: true,
    imports: [DecimalPipe, RouterLink, TranslocoModule, SkeletonModule, TooltipModule],
    templateUrl: "./leaderboard-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        /* ── Podium cards ───────────────────────────────────────────── */
        .podium-card {
            transition:
                transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s ease;
        }
        .podium-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }
        :host-context(.app-dark) .podium-card:hover {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        /* ── Crown / medal shimmer ──────────────────────────────────── */
        .medal-icon {
            filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
        }

        /* ── XP bar ─────────────────────────────────────────────────── */
        .xp-bar-track {
            background: rgba(0, 0, 0, 0.06);
            border-radius: 999px;
            overflow: hidden;
        }
        :host-context(.app-dark) .xp-bar-track {
            background: rgba(255, 255, 255, 0.08);
        }
        .xp-bar-fill {
            background: var(--accent-gradient);
            border-radius: 999px;
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4px;
        }

        /* ── Row hover ──────────────────────────────────────────────── */
        .lb-row {
            transition:
                background 0.2s ease,
                transform 0.2s ease;
        }
        .lb-row:hover {
            background: var(--glass-accent-soft);
            transform: translateX(4px);
        }

        /* ── Level badge ────────────────────────────────────────────── */
        .level-badge {
            background: var(--accent-gradient);
            color: white;
            font-weight: 700;
            font-size: 0.7rem;
            min-width: 1.75rem;
            height: 1.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent);
        }

        /* ── Rank number styling ────────────────────────────────────── */
        .rank-num {
            font-variant-numeric: tabular-nums;
        }

        /* ── Avatar ring ────────────────────────────────────────────── */
        .avatar-ring {
            padding: 2px;
            border-radius: 9999px;
        }
        .avatar-ring-gold {
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
        }
        .avatar-ring-silver {
            background: linear-gradient(135deg, #9ca3af, #d1d5db);
        }
        .avatar-ring-bronze {
            background: linear-gradient(135deg, #d97706, #f59e0b);
        }

        /* ── Skeleton shimmer ───────────────────────────────────────── */
        .skeleton-glass {
            background: var(--glass-bg);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
    `
})
export class LeaderboardPage implements OnInit {
    readonly facade = inject(LeaderboardFacade);
    readonly levelConfig = LEVEL_CONFIG;

    readonly topThree = computed(() => this.facade.entries().slice(0, 3));
    readonly rest = computed(() => this.facade.entries().slice(3));

    ngOnInit(): void {
        this.facade.loadLeaderboard();
    }

    medalIcon(rank: number): string {
        switch (rank) {
            case 1:
                return "pi pi-crown";
            case 2:
                return "pi pi-star-fill";
            case 3:
                return "pi pi-star";
            default:
                return "";
        }
    }

    medalColor(rank: number): string {
        switch (rank) {
            case 1:
                return "text-amber-400";
            case 2:
                return "text-gray-400";
            case 3:
                return "text-orange-500";
            default:
                return "";
        }
    }

    ringClass(rank: number): string {
        switch (rank) {
            case 1:
                return "avatar-ring avatar-ring-gold";
            case 2:
                return "avatar-ring avatar-ring-silver";
            case 3:
                return "avatar-ring avatar-ring-bronze";
            default:
                return "";
        }
    }

    podiumOrder(entries: LeaderboardEntry[]): LeaderboardEntry[] {
        if (entries.length < 3) return entries;
        return [entries[1], entries[0], entries[2]];
    }

    podiumHeight(rank: number): string {
        switch (rank) {
            case 1:
                return "pt-0";
            case 2:
                return "pt-8";
            case 3:
                return "pt-12";
            default:
                return "";
        }
    }

    avatarSize(rank: number): string {
        return rank === 1 ? "w-20 h-20" : "w-16 h-16";
    }

    initials(name: string): string {
        return name
            .split(" ")
            .map((p) => p.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();
    }
}
