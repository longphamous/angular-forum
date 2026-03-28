import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { LevelOrb } from "../../../core/components/level-badge/level-badge";

export interface UserCardData {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    coverUrl?: string;
    role: string;
    bio?: string;
    postCount: number;
    level: number;
    levelName: string;
    xp: number;
    createdAt: string;
}

@Component({
    selector: "user-popover-card",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, ButtonModule, LevelOrb, RouterModule, TagModule, TooltipModule, TranslocoModule],
    styles: `
        :host {
            display: block;
            width: 280px;
        }

        .upc {
            border-radius: 0.75rem;
            overflow: hidden;
            background: var(--surface-overlay);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            border: 1px solid var(--surface-border);
        }

        .upc-cover {
            height: 72px;
            background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 60%, #000) 100%);
            position: relative;
        }

        .upc-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .upc-avatar-wrap {
            display: flex;
            justify-content: center;
            margin-top: -28px;
            position: relative;
            z-index: 1;
        }

        .upc-body {
            padding: 0 1rem 1rem;
            text-align: center;
        }

        .upc-name {
            font-size: 0.9375rem;
            font-weight: 700;
            color: var(--text-color);
            margin: 0.5rem 0 0.125rem;
        }

        .upc-username {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        .upc-bio {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            margin-top: 0.5rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.5;
        }

        .upc-actions {
            display: flex;
            justify-content: center;
            gap: 0.375rem;
            margin-top: 0.75rem;
        }

        .upc-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.25rem;
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid var(--surface-border);
        }

        .upc-stat {
            text-align: center;
        }

        .upc-stat-label {
            font-size: 0.625rem;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .upc-stat-value {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--text-color);
            margin-top: 0.125rem;
        }
    `,
    template: `
        @if (user(); as u) {
            <div class="upc" *transloco="let t">
                <!-- Cover -->
                <div class="upc-cover">
                    @if (u.coverUrl) {
                        <img [src]="u.coverUrl" alt="" />
                    }
                </div>

                <div class="upc-body">
                    <!-- Avatar -->
                    <div class="upc-avatar-wrap">
                        <div style="position: relative; display: inline-block;">
                            <p-avatar
                                [image]="u.avatarUrl ?? undefined"
                                [label]="u.avatarUrl ? undefined : u.displayName.charAt(0).toUpperCase()"
                                shape="circle"
                                size="xlarge"
                                styleClass="border-4 shadow-md"
                                [style]="{ 'border-color': 'var(--surface-overlay)' }"
                            />
                            <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); z-index: 2;">
                                <level-orb [level]="u.level" [levelName]="u.levelName" size="sm" />
                            </div>
                        </div>
                    </div>

                    <!-- Name + Role -->
                    <div class="upc-name">{{ u.displayName }}</div>
                    <div class="upc-username">&#64;{{ u.username }}</div>
                    <div style="margin-top: 0.375rem">
                        <p-tag
                            [value]="t('userProfile.roles.' + u.role)"
                            [severity]="u.role === 'admin' ? 'danger' : u.role === 'moderator' ? 'warn' : 'info'"
                            styleClass="text-xs"
                        />
                    </div>

                    <!-- Bio -->
                    @if (u.bio) {
                        <div class="upc-bio">{{ u.bio }}</div>
                    }

                    <!-- Quick Actions -->
                    @if (!compact()) {
                        <div class="upc-actions">
                            <p-button [routerLink]="['/users', u.id]" icon="pi pi-user" size="small" [rounded]="true" [text]="true" [pTooltip]="t('userProfile.viewProfile')" />
                            <p-button [routerLink]="['/messages']" icon="pi pi-envelope" size="small" [rounded]="true" [text]="true" [pTooltip]="t('userProfile.sendMessage')" />
                        </div>
                    }

                    <!-- Stats -->
                    <div class="upc-stats">
                        <div class="upc-stat">
                            <div class="upc-stat-label">{{ t('userProfile.posts') }}</div>
                            <div class="upc-stat-value">{{ u.postCount }}</div>
                        </div>
                        <div class="upc-stat">
                            <div class="upc-stat-label">Level</div>
                            <div class="upc-stat-value">{{ u.level }}</div>
                        </div>
                        <div class="upc-stat">
                            <div class="upc-stat-label">XP</div>
                            <div class="upc-stat-value">{{ u.xp }}</div>
                        </div>
                    </div>
                </div>
            </div>
        }
    `
})
export class UserPopoverCard {
    readonly user = input.required<UserCardData>();
    readonly compact = input(false);
}
