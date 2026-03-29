import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";

import type { WantedPoster } from "../../models/gamification/bounty";

@Component({
    selector: "wanted-poster",
    standalone: true,
    imports: [DecimalPipe, RouterLink, TranslocoModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="wanted-poster" *transloco="let t">
            <div class="poster-outer">
                <div
                    class="poster-frame"
                    [class.poster-top1]="poster().rank === 1"
                    [class.poster-top3]="poster().rank <= 3 && poster().rank > 0"
                >
                    <!-- Decorative corner nails -->
                    <div class="nail nail-tl"></div>
                    <div class="nail nail-tr"></div>
                    <div class="nail nail-bl"></div>
                    <div class="nail nail-br"></div>

                    <!-- Header -->
                    <div class="poster-header">
                        <div class="header-line"></div>
                        <span class="wanted-text">WANTED</span>
                        <div class="header-line"></div>
                    </div>

                    <!-- Photo area -->
                    <div class="poster-photo">
                        @if (poster().avatarUrl) {
                        <img class="poster-avatar" [alt]="poster().displayName" [src]="poster().avatarUrl" />
                        } @else {
                        <div class="poster-avatar-placeholder">
                            <span>{{ initials(poster().displayName) }}</span>
                        </div>
                        }
                        <div class="photo-overlay"></div>
                    </div>

                    <!-- Dead or Alive banner -->
                    <div class="poster-doa">
                        <span class="doa-dash">&#x2501;&#x2501;</span>
                        <span class="doa-text">DEAD OR ALIVE</span>
                        <span class="doa-dash">&#x2501;&#x2501;</span>
                    </div>

                    <!-- Name -->
                    <a class="poster-name" [routerLink]="['/users', poster().userId]">
                        {{ poster().displayName }}
                    </a>

                    <!-- Epithet -->
                    <div class="poster-epithet">
                        <span class="epithet-deco">&#x2726;</span>
                        "{{ poster().epithet }}"
                        <span class="epithet-deco">&#x2726;</span>
                    </div>

                    <!-- Bounty -->
                    <div class="poster-bounty">
                        <div class="bounty-label">BOUNTY</div>
                        <div class="bounty-value">
                            <span class="bounty-symbol">&#x20B4;</span>
                            <span class="bounty-amount">{{ poster().bounty | number }}</span>
                        </div>
                    </div>

                    <!-- Rank badge -->
                    @if (showRank() && poster().rank > 0) {
                    <div
                        class="poster-rank"
                        [class.rank-gold]="poster().rank === 1"
                        [class.rank-silver]="poster().rank === 2"
                        [class.rank-bronze]="poster().rank === 3"
                    >
                        <span class="rank-hash">#</span>{{ poster().rank }}
                    </div>
                    }

                    <!-- Footer -->
                    <div class="poster-footer">
                        <div class="footer-line"></div>
                        <span class="footer-text">MARINE</span>
                        <div class="footer-line"></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .wanted-poster {
                display: inline-block;
                filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
            }

            .poster-outer {
                transform: rotate(-0.5deg);
                transition: transform 0.3s ease;
            }
            .poster-outer:hover {
                transform: rotate(0deg) scale(1.03);
            }

            .poster-frame {
                width: 300px;
                padding: 16px 20px 20px;
                position: relative;
                font-family: "Georgia", "Times New Roman", serif;
                text-align: center;
                background:
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 28px,
                        rgba(139, 105, 20, 0.03) 28px,
                        rgba(139, 105, 20, 0.03) 29px
                    ),
                    radial-gradient(ellipse at 30% 70%, rgba(160, 120, 40, 0.12) 0%, transparent 60%),
                    radial-gradient(ellipse at 70% 30%, rgba(160, 120, 40, 0.08) 0%, transparent 60%),
                    linear-gradient(175deg, #f5e6c8 0%, #e8d5a8 25%, #dcc590 50%, #d4bd80 75%, #ccad6a 100%);
                border: 5px solid #7a5c18;
                border-radius: 3px;
                box-shadow:
                    inset 0 0 40px rgba(139, 105, 20, 0.15),
                    inset 0 0 80px rgba(139, 105, 20, 0.05),
                    0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .poster-top1 {
                border-color: #d4a017;
                box-shadow:
                    inset 0 0 40px rgba(212, 160, 23, 0.2),
                    0 0 30px rgba(212, 160, 23, 0.3),
                    0 0 60px rgba(212, 160, 23, 0.1);
            }
            .poster-top3 {
                border-width: 6px;
            }

            .nail {
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, #c9a84c, #7a5c18);
                box-shadow:
                    inset 0 1px 2px rgba(255, 255, 255, 0.3),
                    0 1px 2px rgba(0, 0, 0, 0.3);
            }
            .nail-tl {
                top: 8px;
                left: 8px;
            }
            .nail-tr {
                top: 8px;
                right: 8px;
            }
            .nail-bl {
                bottom: 8px;
                left: 8px;
            }
            .nail-br {
                bottom: 8px;
                right: 8px;
            }

            .poster-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
            }
            .header-line {
                flex: 1;
                height: 2px;
                background: linear-gradient(90deg, transparent, #7a5c18, transparent);
            }
            .wanted-text {
                font-size: 2.5rem;
                font-weight: 900;
                color: #1a1a1a;
                letter-spacing: 10px;
                line-height: 1;
                text-shadow:
                    2px 2px 0 rgba(139, 105, 20, 0.2),
                    0 0 10px rgba(139, 105, 20, 0.1);
            }

            .poster-photo {
                width: 230px;
                height: 190px;
                margin: 0 auto 10px;
                border: 4px solid #5c4a1e;
                background: #1a1510;
                overflow: hidden;
                position: relative;
                box-shadow:
                    inset 0 0 20px rgba(0, 0, 0, 0.5),
                    0 2px 8px rgba(0, 0, 0, 0.3);
            }
            .poster-avatar {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: sepia(20%) contrast(1.1) saturate(0.9);
            }
            .poster-avatar-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #3a3020 0%, #5a4a30 50%, #4a3f2f 100%);
                color: #d4bd80;
                font-size: 3.5rem;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }
            .photo-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, transparent 60%, rgba(26, 21, 16, 0.4) 100%);
                pointer-events: none;
            }

            .poster-doa {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                margin-bottom: 6px;
            }
            .doa-text {
                font-size: 0.7rem;
                color: #5c4a1e;
                letter-spacing: 5px;
                font-weight: 800;
            }
            .doa-dash {
                color: #8b6914;
                font-size: 0.5rem;
                opacity: 0.6;
            }

            .poster-name {
                display: block;
                font-size: 1.4rem;
                font-weight: 900;
                color: #1a1a1a;
                text-decoration: none;
                letter-spacing: 3px;
                line-height: 1.2;
                margin-bottom: 2px;
                text-shadow: 1px 1px 0 rgba(212, 189, 128, 0.5);
            }
            .poster-name:hover {
                color: #7a5c18;
            }

            .poster-epithet {
                font-size: 0.8rem;
                color: #6b5520;
                font-style: italic;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            .epithet-deco {
                color: #8b6914;
                font-style: normal;
                font-size: 0.65rem;
                vertical-align: middle;
            }

            .poster-bounty {
                margin-bottom: 8px;
            }
            .bounty-label {
                font-size: 0.55rem;
                color: #7a5c18;
                letter-spacing: 6px;
                font-weight: 700;
                margin-bottom: 2px;
            }
            .bounty-value {
                display: flex;
                align-items: baseline;
                justify-content: center;
                gap: 4px;
            }
            .bounty-symbol {
                font-size: 1.2rem;
                font-weight: 900;
                color: #1a1a1a;
            }
            .bounty-amount {
                font-size: 1.6rem;
                font-weight: 900;
                color: #1a1a1a;
                letter-spacing: 2px;
                text-shadow: 1px 1px 0 rgba(212, 189, 128, 0.4);
            }

            .poster-rank {
                position: absolute;
                top: 10px;
                right: 12px;
                background: linear-gradient(135deg, #8b0000, #6b0000);
                color: #f5e6c8;
                font-size: 0.85rem;
                font-weight: 900;
                padding: 3px 10px;
                border-radius: 2px;
                letter-spacing: 1px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            }
            .rank-gold {
                background: linear-gradient(135deg, #d4a017, #b8860b);
                color: #1a1a1a;
                box-shadow: 0 2px 10px rgba(212, 160, 23, 0.5);
            }
            .rank-silver {
                background: linear-gradient(135deg, #a8a8a8, #808080);
                color: #1a1a1a;
            }
            .rank-bronze {
                background: linear-gradient(135deg, #cd7f32, #a0652a);
                color: #1a1a1a;
            }
            .rank-hash {
                font-size: 0.7rem;
                opacity: 0.7;
            }

            .poster-footer {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 6px;
            }
            .footer-line {
                flex: 1;
                height: 2px;
                background: linear-gradient(90deg, transparent, #7a5c18, transparent);
            }
            .footer-text {
                font-size: 0.65rem;
                color: #7a5c18;
                letter-spacing: 10px;
                font-weight: 800;
            }
        `
    ]
})
export class WantedPosterComponent {
    readonly poster = input.required<WantedPoster>();
    readonly showRank = input(true);

    initials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
}
