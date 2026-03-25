import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal
} from "@angular/core";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { Subscription } from "rxjs";

import { PushAchievementUnlocked, PushLevelUp } from "../../models/push/push-events";
import { PushService } from "../../services/push.service";

interface ToastItem {
    type: "achievement" | "levelup";
    icon: string;
    rarity: string;
    label: string;
    name: string;
    description: string;
    xpReward: number;
}

@Component({
    selector: "app-achievement-toast",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoModule],
    styles: `
        .ach-overlay {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            pointer-events: auto;
        }

        .ach-card {
            position: relative;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 360px;
            max-width: 460px;
            padding: 1.25rem 1.5rem;
            border-radius: 1rem;
            border: 2px solid;
            background: linear-gradient(135deg, rgba(15, 15, 25, 0.97), rgba(25, 25, 45, 0.97));
            backdrop-filter: blur(16px);
            overflow: hidden;
            animation: ach-slide-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .ach-card.ach-leaving {
            animation: ach-slide-out 0.4s ease-in forwards;
        }

        .ach-card::before {
            content: "";
            position: absolute;
            inset: -2px;
            border-radius: 1rem;
            padding: 2px;
            background: var(--ach-gradient);
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            animation: ach-border-glow 2s ease-in-out infinite alternate;
        }

        /* Sparkle particles */
        .ach-card::after {
            content: "";
            position: absolute;
            inset: 0;
            background-image:
                radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 100%),
                radial-gradient(2px 2px at 80% 20%, rgba(255, 255, 255, 0.6) 0%, transparent 100%),
                radial-gradient(2px 2px at 50% 80%, rgba(255, 255, 255, 0.5) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 70% 60%, rgba(255, 255, 255, 0.7) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 30% 70%, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
            animation: ach-sparkle 3s ease-in-out infinite;
            pointer-events: none;
        }

        .ach-icon-wrap {
            position: relative;
            flex-shrink: 0;
            animation: ach-icon-pop 0.8s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .ach-icon-circle {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid;
            position: relative;
            z-index: 1;
        }

        .ach-icon-glow {
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            background: var(--ach-glow-color);
            filter: blur(12px);
            opacity: 0;
            animation: ach-glow-pulse 1.5s 0.5s ease-in-out infinite alternate;
        }

        .ach-ring {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1px solid;
            opacity: 0;
            animation: ach-ring-expand 1s 0.4s ease-out forwards;
        }

        .ach-content {
            flex: 1;
            min-width: 0;
            animation: ach-text-fade 0.5s 0.3s ease-out both;
        }

        .ach-label {
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 0.25rem;
        }

        .ach-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            line-height: 1.3;
        }

        .ach-desc {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 0.25rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .ach-xp {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            margin-top: 0.375rem;
            font-size: 0.75rem;
            font-weight: 700;
            color: #4ade80;
            animation: ach-xp-bounce 0.6s 0.8s ease-out both;
        }

        .ach-close {
            flex-shrink: 0;
            border: none;
            background: transparent;
            color: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            padding: 0.25rem;
            transition: color 0.2s;
            font-size: 0.875rem;
        }
        .ach-close:hover {
            color: white;
        }

        /* Rarity colors */
        .ach-bronze {
            --ach-gradient: linear-gradient(135deg, #cd7f32, #b8860b);
            --ach-glow-color: rgba(205, 127, 50, 0.4);
            --ach-accent: #cd7f32;
        }
        .ach-silver {
            --ach-gradient: linear-gradient(135deg, #c0c0c0, #a8a8a8);
            --ach-glow-color: rgba(192, 192, 192, 0.4);
            --ach-accent: #c0c0c0;
        }
        .ach-gold {
            --ach-gradient: linear-gradient(135deg, #ffd700, #ffaa00, #ffd700);
            --ach-glow-color: rgba(255, 215, 0, 0.5);
            --ach-accent: #ffd700;
        }
        .ach-platinum {
            --ach-gradient: linear-gradient(135deg, #00e5ff, #7c4dff, #00e5ff);
            --ach-glow-color: rgba(0, 229, 255, 0.4);
            --ach-accent: #00e5ff;
        }
        .ach-levelup {
            --ach-gradient: linear-gradient(135deg, #f59e0b, #ef4444, #f59e0b);
            --ach-glow-color: rgba(245, 158, 11, 0.5);
            --ach-accent: #f59e0b;
        }

        @keyframes ach-slide-in {
            0% {
                opacity: 0;
                transform: translateX(100px) scale(0.8);
            }
            60% {
                opacity: 1;
                transform: translateX(-10px) scale(1.02);
            }
            100% {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
        }
        @keyframes ach-slide-out {
            0% {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateX(100px) scale(0.8);
            }
        }
        @keyframes ach-icon-pop {
            0% {
                transform: scale(0) rotate(-30deg);
            }
            60% {
                transform: scale(1.2) rotate(5deg);
            }
            100% {
                transform: scale(1) rotate(0deg);
            }
        }
        @keyframes ach-glow-pulse {
            0% {
                opacity: 0.3;
            }
            100% {
                opacity: 0.7;
            }
        }
        @keyframes ach-ring-expand {
            0% {
                transform: scale(0.5);
                opacity: 0.8;
            }
            100% {
                transform: scale(1.8);
                opacity: 0;
            }
        }
        @keyframes ach-sparkle {
            0%,
            100% {
                opacity: 0;
            }
            50% {
                opacity: 1;
            }
        }
        @keyframes ach-text-fade {
            0% {
                opacity: 0;
                transform: translateX(10px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes ach-xp-bounce {
            0% {
                opacity: 0;
                transform: translateY(8px);
            }
            60% {
                transform: translateY(-3px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes ach-border-glow {
            0% {
                opacity: 0.6;
            }
            100% {
                opacity: 1;
            }
        }

        /* Progress bar animation */
        .ach-progress {
            height: 3px;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }
        .ach-progress-bar {
            height: 100%;
            background: var(--ach-accent);
            animation: ach-progress-shrink var(--ach-duration) linear forwards;
        }
        @keyframes ach-progress-shrink {
            0% {
                width: 100%;
            }
            100% {
                width: 0%;
            }
        }
    `,
    template: `
        @if (current(); as item) {
            <div class="ach-overlay">
                <div
                    class="ach-card"
                    [class.ach-bronze]="item.rarity === 'bronze'"
                    [class.ach-gold]="item.rarity === 'gold'"
                    [class.ach-leaving]="leaving()"
                    [class.ach-levelup]="item.type === 'levelup'"
                    [class.ach-platinum]="item.rarity === 'platinum'"
                    [class.ach-silver]="item.rarity === 'silver'"
                >
                    <!-- Icon with glow -->
                    <div class="ach-icon-wrap">
                        <div class="ach-icon-glow"></div>
                        <div class="ach-ring" [style.border-color]="'var(--ach-accent)'"></div>
                        <div
                            class="ach-icon-circle"
                            [style.background]="'rgba(0,0,0,0.4)'"
                            [style.border-color]="'var(--ach-accent)'"
                        >
                            <i class="pi text-2xl" [class]="item.icon" [style.color]="'var(--ach-accent)'"></i>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="ach-content" *transloco="let t">
                        <div class="ach-label" [style.color]="'var(--ach-accent)'">
                            {{ item.label }}
                        </div>
                        <div class="ach-name">{{ item.name }}</div>
                        @if (item.description) {
                            <div class="ach-desc">{{ item.description }}</div>
                        }
                        @if (item.xpReward > 0) {
                            <div class="ach-xp">
                                <i class="pi pi-star-fill" style="font-size: 0.65rem"></i>
                                +{{ item.xpReward }} XP
                            </div>
                        }
                    </div>

                    <!-- Close button -->
                    <button class="ach-close" (click)="dismiss()" type="button">
                        <i class="pi pi-times"></i>
                    </button>

                    <!-- Auto-dismiss progress bar -->
                    <div class="ach-progress">
                        <div class="ach-progress-bar" [style.--ach-duration]="'7s'"></div>
                    </div>
                </div>
            </div>
        }
    `
})
export class AchievementToast implements OnInit, OnDestroy {
    private readonly pushService = inject(PushService);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly translocoService = inject(TranslocoService);
    private subs: Subscription[] = [];
    private dismissTimer?: ReturnType<typeof setTimeout>;

    protected readonly current = signal<ToastItem | null>(null);
    protected readonly leaving = signal(false);
    private readonly queue: ToastItem[] = [];

    ngOnInit(): void {
        this.subs.push(
            this.pushService.on<PushAchievementUnlocked>("achievement:unlocked").subscribe((ev) => {
                this.enqueue({
                    type: "achievement",
                    icon: ev.icon,
                    rarity: ev.rarity,
                    label: this.translocoService.translate("achievements.unlocked"),
                    name: ev.name,
                    description: ev.description,
                    xpReward: ev.xpReward
                });
            }),
            this.pushService.on<PushLevelUp>("level:up").subscribe((ev) => {
                this.enqueue({
                    type: "levelup",
                    icon: "pi pi-arrow-up",
                    rarity: "levelup",
                    label: this.translocoService.translate("achievements.levelUp"),
                    name: `Level ${ev.newLevel} — ${ev.levelName}`,
                    description: this.translocoService.translate("achievements.xpCollected", {
                        xp: ev.totalXp.toLocaleString()
                    }),
                    xpReward: 0
                });
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.forEach((s) => s.unsubscribe());
        if (this.dismissTimer) clearTimeout(this.dismissTimer);
    }

    private enqueue(item: ToastItem): void {
        this.queue.push(item);
        if (!this.current()) this.showNext();
        this.cd.markForCheck();
    }

    protected dismiss(): void {
        if (this.dismissTimer) clearTimeout(this.dismissTimer);
        this.leaving.set(true);
        this.cd.markForCheck();
        setTimeout(() => {
            this.leaving.set(false);
            this.current.set(null);
            this.cd.markForCheck();
            setTimeout(() => this.showNext(), 300);
        }, 400);
    }

    private showNext(): void {
        const next = this.queue.shift();
        if (next) {
            this.current.set(next);
            this.cd.markForCheck();
            this.dismissTimer = setTimeout(() => this.dismiss(), 7000);
        }
    }
}
