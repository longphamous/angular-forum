import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import {
    QUEST_TYPE_CONFIG,
    REWARD_TYPE_CONFIG,
    type QuestBoard,
    type QuestReward,
    type QuestType,
    type UserQuest
} from "../../../../core/models/rpg/quest";
import { QuestFacade } from "../../../../facade/rpg/quest-facade";

@Component({
    selector: "quest-page",
    standalone: true,
    imports: [DatePipe, RouterLink, TranslocoModule, ButtonModule, SkeletonModule, TagModule, TooltipModule],
    templateUrl: "./quest-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        .quest-card {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            border-radius: 0.75rem;
            background: var(--glass-bg-subtle);
            border: 1px solid var(--glass-border);
            transition:
                background 0.2s,
                transform 0.15s;
        }
        .quest-card:hover {
            background: var(--glass-bg);
            transform: translateX(2px);
        }
        .quest-card-completed {
            background: color-mix(in srgb, var(--primary-color) 6%, transparent);
            border-color: color-mix(in srgb, var(--primary-color) 20%, transparent);
        }
        .quest-card-claimed {
            opacity: 0.5;
        }

        .quest-icon {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.625rem;
            font-size: 1.1rem;
            flex-shrink: 0;
        }

        .quest-progress-track {
            height: 0.375rem;
            background: rgba(0, 0, 0, 0.06);
            border-radius: 999px;
            overflow: hidden;
        }
        :host-context(.app-dark) .quest-progress-track {
            background: rgba(255, 255, 255, 0.08);
        }
        .quest-progress-fill {
            height: 100%;
            border-radius: 999px;
            background: var(--accent-gradient);
            transition: width 0.5s ease;
        }
        .quest-progress-complete .quest-progress-fill {
            background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .reward-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.125rem 0.5rem;
            border-radius: 999px;
            font-size: 0.6875rem;
            font-weight: 600;
            background: var(--glass-bg-subtle);
            border: 1px solid var(--glass-border);
        }

        .event-banner {
            position: relative;
            border-radius: var(--glass-radius);
            background: linear-gradient(135deg, #dc2626, #f97316, #eab308);
        }
        .event-banner > img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .event-banner-overlay {
            position: relative;
            background: linear-gradient(to right, rgba(0, 0, 0, 0.75) 60%, rgba(0, 0, 0, 0.3));
            display: flex;
            align-items: flex-start;
            padding: 1.25rem 1.5rem;
            gap: 1rem;
        }

        .glory-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.875rem;
            border-radius: 999px;
            background: linear-gradient(135deg, #a855f7, #7c3aed);
            color: white;
            font-weight: 700;
            font-size: 0.875rem;
            box-shadow: 0 2px 12px rgba(168, 85, 247, 0.3);
        }

        .quest-tab {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            border-radius: 999px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid var(--glass-border);
            background: var(--glass-bg-subtle);
            color: var(--text-color-secondary);
            transition: all 0.2s;
        }
        .quest-tab:hover {
            background: var(--glass-bg);
        }
        .quest-tab-active {
            background: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            color: white !important;
        }
    `
})
export class QuestPage implements OnInit {
    readonly facade = inject(QuestFacade);
    readonly questTypeConfig = QUEST_TYPE_CONFIG;
    readonly rewardTypeConfig = REWARD_TYPE_CONFIG;
    readonly activeTab = signal<"active" | "completed">("active");

    ngOnInit(): void {
        this.facade.loadBoard();
    }

    switchTab(tab: "active" | "completed"): void {
        this.activeTab.set(tab);
        if (tab === "completed") {
            this.facade.loadCompleted();
        }
    }

    questSections(board: QuestBoard): { type: QuestType; quests: UserQuest[] }[] {
        return [
            { type: "daily", quests: board.daily },
            { type: "weekly", quests: board.weekly },
            { type: "monthly", quests: board.monthly },
            { type: "story", quests: board.story }
        ];
    }

    progressPercent(uq: UserQuest): number {
        if (uq.quest.requiredCount <= 0) return 100;
        return Math.min(100, Math.round((uq.progress / uq.quest.requiredCount) * 100));
    }

    claimReward(uq: UserQuest): void {
        this.facade.claimReward(uq.id).subscribe();
    }

    rewardLabel(reward: QuestReward): string {
        switch (reward.type) {
            case "xp":
                return `+${reward.amount} XP`;
            case "coins":
                return `+${reward.amount} Coins`;
            case "glory":
                return `+${reward.amount} Ruhm`;
            case "item":
                return `×${reward.amount} Item`;
        }
    }

    questTypeLabel(type: QuestType): string {
        return this.questTypeConfig[type]?.labelKey ?? type;
    }

    hasActiveEvents(): boolean {
        return (this.facade.board()?.events.length ?? 0) > 0;
    }

    formatTimeLeft(dateStr: string | null): string {
        if (!dateStr) return "";
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return "";
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    }
}
