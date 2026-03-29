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
            <!-- Poster frame -->
            <div class="poster-frame">
                <!-- Header -->
                <div class="poster-header">
                    <span class="wanted-text">WANTED</span>
                </div>

                <!-- Photo area -->
                <div class="poster-photo">
                    @if (poster().avatarUrl) {
                    <img [src]="poster().avatarUrl" [alt]="poster().displayName" class="poster-avatar" />
                    } @else {
                    <div class="poster-avatar-placeholder">
                        <span>{{ initials(poster().displayName) }}</span>
                    </div>
                    }
                </div>

                <!-- Dead or Alive -->
                <div class="poster-doa">
                    <span>DEAD OR ALIVE</span>
                </div>

                <!-- Name -->
                <a [routerLink]="['/users', poster().userId]" class="poster-name">
                    {{ poster().displayName }}
                </a>

                <!-- Epithet -->
                <div class="poster-epithet">"{{ poster().epithet }}"</div>

                <!-- Bounty -->
                <div class="poster-bounty">
                    <span class="bounty-symbol">B</span>
                    <span class="bounty-amount">{{ poster().bounty | number }}</span>
                </div>

                <!-- Rank badge -->
                @if (showRank() && poster().rank > 0) {
                <div class="poster-rank">#{{ poster().rank }}</div>
                }

                <!-- Marine logo area -->
                <div class="poster-footer">
                    <span>MARINE</span>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .wanted-poster {
            display: inline-block;
            perspective: 1000px;
        }

        .poster-frame {
            width: 280px;
            background: linear-gradient(180deg, #F5E6C8 0%, #E8D5A8 30%, #DCC590 100%);
            border: 4px solid #8B6914;
            border-radius: 4px;
            padding: 12px 16px 16px;
            box-shadow: 4px 4px 12px rgba(0,0,0,0.3), inset 0 0 30px rgba(139,105,20,0.1);
            position: relative;
            font-family: 'Georgia', 'Times New Roman', serif;
            text-align: center;

            /* Aged paper effect */
            background-image:
                radial-gradient(ellipse at 20% 80%, rgba(139,105,20,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(139,105,20,0.06) 0%, transparent 50%);
        }

        .poster-header {
            margin-bottom: 8px;
        }

        .wanted-text {
            font-size: 2.2rem;
            font-weight: 900;
            color: #1a1a1a;
            letter-spacing: 8px;
            text-transform: uppercase;
            line-height: 1;
            text-shadow: 1px 1px 0 rgba(139,105,20,0.3);
        }

        .poster-photo {
            width: 220px;
            height: 180px;
            margin: 0 auto 8px;
            border: 3px solid #5C4A1E;
            background: #2a2a2a;
            overflow: hidden;
            position: relative;
        }

        .poster-avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: sepia(15%) contrast(1.05);
        }

        .poster-avatar-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4a3f2f, #6b5d45);
            color: #E8D5A8;
            font-size: 3rem;
            font-weight: bold;
        }

        .poster-doa {
            font-size: 0.65rem;
            color: #5C4A1E;
            letter-spacing: 6px;
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        .poster-name {
            display: block;
            font-size: 1.3rem;
            font-weight: 900;
            color: #1a1a1a;
            text-decoration: none;
            letter-spacing: 2px;
            line-height: 1.2;
            margin-bottom: 2px;
        }

        .poster-name:hover {
            color: #8B6914;
        }

        .poster-epithet {
            font-size: 0.75rem;
            color: #5C4A1E;
            font-style: italic;
            margin-bottom: 8px;
        }

        .poster-bounty {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 4px;
            margin-bottom: 6px;
        }

        .bounty-symbol {
            font-size: 1.1rem;
            font-weight: 900;
            color: #1a1a1a;
            text-decoration: line-through;
        }

        .bounty-amount {
            font-size: 1.4rem;
            font-weight: 900;
            color: #1a1a1a;
            letter-spacing: 1px;
        }

        .poster-rank {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #8B0000;
            color: #F5E6C8;
            font-size: 0.75rem;
            font-weight: 900;
            padding: 2px 8px;
            border-radius: 2px;
            letter-spacing: 1px;
        }

        .poster-footer {
            font-size: 0.6rem;
            color: #8B6914;
            letter-spacing: 8px;
            font-weight: 700;
            border-top: 2px solid #8B6914;
            padding-top: 6px;
            margin-top: 4px;
        }
    `]
})
export class WantedPosterComponent {
    readonly poster = input.required<WantedPoster>();
    readonly showRank = input(true);

    initials(name: string): string {
        return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    }
}
