import { animate, keyframes, style, transition, trigger } from "@angular/animations";
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { Subscription } from "rxjs";

import { PushAchievementUnlocked } from "../../models/push/push-events";
import { PushService } from "../../services/push.service";

const RARITY_GLOW: Record<string, string> = {
    bronze: "shadow-orange-500/40",
    silver: "shadow-gray-400/40",
    gold: "shadow-yellow-500/50",
    platinum: "shadow-cyan-400/50"
};

const RARITY_BORDER: Record<string, string> = {
    bronze: "border-orange-400",
    silver: "border-gray-400",
    gold: "border-yellow-400",
    platinum: "border-cyan-400"
};

const RARITY_ICON_COLOR: Record<string, string> = {
    bronze: "text-orange-500",
    silver: "text-gray-400",
    gold: "text-yellow-500",
    platinum: "text-cyan-400"
};

@Component({
    selector: "app-achievement-toast",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoModule],
    animations: [
        trigger("toastAnim", [
            transition(":enter", [
                animate(
                    "800ms ease-out",
                    keyframes([
                        style({ opacity: 0, transform: "translateY(-40px) scale(0.8)", offset: 0 }),
                        style({ opacity: 1, transform: "translateY(8px) scale(1.05)", offset: 0.5 }),
                        style({ opacity: 1, transform: "translateY(0) scale(1)", offset: 1 })
                    ])
                )
            ]),
            transition(":leave", [
                animate("400ms ease-in", style({ opacity: 0, transform: "translateY(-30px) scale(0.9)" }))
            ])
        ]),
        trigger("iconPop", [
            transition(":enter", [
                animate(
                    "600ms 300ms ease-out",
                    keyframes([
                        style({ transform: "scale(0) rotate(-30deg)", opacity: 0, offset: 0 }),
                        style({ transform: "scale(1.3) rotate(10deg)", opacity: 1, offset: 0.6 }),
                        style({ transform: "scale(1) rotate(0deg)", opacity: 1, offset: 1 })
                    ])
                )
            ])
        ]),
        trigger("shine", [
            transition(":enter", [
                style({ opacity: 0 }),
                animate("400ms 500ms ease-out", style({ opacity: 1 }))
            ])
        ])
    ],
    template: `
        @if (current(); as ach) {
            <div class="fixed top-6 right-6 z-[9999]" @toastAnim>
                <div
                    class="flex items-center gap-4 rounded-2xl border-2 bg-surface-900 px-6 py-4 shadow-2xl backdrop-blur-sm"
                    [class]="rarityBorder(ach.rarity) + ' ' + rarityGlow(ach.rarity)"
                    style="min-width: 320px; max-width: 420px"
                >
                    <!-- Animated icon -->
                    <div class="relative" @iconPop>
                        <div
                            class="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-surface-800"
                            [class]="rarityBorder(ach.rarity)"
                        >
                            <i class="pi text-2xl" [class]="ach.icon + ' ' + rarityIconColor(ach.rarity)"></i>
                        </div>
                        <!-- Shine effect -->
                        <div
                            class="absolute inset-0 rounded-full"
                            @shine
                            style="background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); pointer-events: none"
                        ></div>
                    </div>

                    <!-- Text content -->
                    <div class="min-w-0 flex-1">
                        <div class="mb-0.5 text-xs font-bold uppercase tracking-widest text-yellow-400" *transloco="let t">
                            {{ t('achievements.unlocked') }}
                        </div>
                        <div class="text-base font-bold text-white">{{ ach.name }}</div>
                        @if (ach.description) {
                            <div class="mt-0.5 text-xs text-surface-400 line-clamp-2">{{ ach.description }}</div>
                        }
                        @if (ach.xpReward > 0) {
                            <div class="mt-1 text-xs font-semibold text-green-400">+{{ ach.xpReward }} XP</div>
                        }
                    </div>

                    <!-- Close -->
                    <button
                        class="shrink-0 border-none bg-transparent text-surface-500 hover:text-white cursor-pointer transition-colors"
                        (click)="dismiss()"
                        type="button"
                    >
                        <i class="pi pi-times"></i>
                    </button>
                </div>
            </div>
        }
    `
})
export class AchievementToast implements OnInit, OnDestroy {
    private readonly pushService = inject(PushService);
    private sub?: Subscription;
    private dismissTimer?: ReturnType<typeof setTimeout>;

    protected readonly current = signal<PushAchievementUnlocked | null>(null);
    private readonly queue: PushAchievementUnlocked[] = [];

    ngOnInit(): void {
        this.sub = this.pushService
            .on<PushAchievementUnlocked>("achievement:unlocked")
            .subscribe((ev) => {
                this.queue.push(ev);
                if (!this.current()) {
                    this.showNext();
                }
            });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        if (this.dismissTimer) clearTimeout(this.dismissTimer);
    }

    protected dismiss(): void {
        if (this.dismissTimer) clearTimeout(this.dismissTimer);
        this.current.set(null);
        setTimeout(() => this.showNext(), 500);
    }

    private showNext(): void {
        const next = this.queue.shift();
        if (next) {
            this.current.set(next);
            this.dismissTimer = setTimeout(() => this.dismiss(), 6000);
        }
    }

    protected rarityGlow(rarity: string): string {
        return RARITY_GLOW[rarity] ?? RARITY_GLOW["bronze"];
    }

    protected rarityBorder(rarity: string): string {
        return RARITY_BORDER[rarity] ?? RARITY_BORDER["bronze"];
    }

    protected rarityIconColor(rarity: string): string {
        return RARITY_ICON_COLOR[rarity] ?? RARITY_ICON_COLOR["bronze"];
    }
}
