import { ChangeDetectionStrategy, Component, inject, input, OnInit } from "@angular/core";

import { OnlinePresenceService } from "../../../core/services/online-presence.service";

@Component({
    selector: "online-indicator",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (presenceService.isOnline(userId())) {
            <span
                class="online-dot"
                [class.online-dot-lg]="size() === 'lg'"
                [class.online-dot-sm]="size() === 'sm'"
            ></span>
        }
    `,
    styles: [
        `
            :host {
                display: inline-block;
                line-height: 0;
            }
            .online-dot {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #22c55e;
                border: 2px solid var(--surface-card, white);
                box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
                animation: pulse-online 2s ease-in-out infinite;
            }
            .online-dot-sm {
                width: 8px;
                height: 8px;
                border-width: 1.5px;
            }
            .online-dot-lg {
                width: 14px;
                height: 14px;
                border-width: 3px;
            }
            @keyframes pulse-online {
                0%,
                100% {
                    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
                }
                50% {
                    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
                }
            }
        `
    ]
})
export class OnlineIndicator implements OnInit {
    readonly userId = input.required<string>();
    readonly size = input<"sm" | "md" | "lg">("md");

    protected readonly presenceService = inject(OnlinePresenceService);

    ngOnInit(): void {
        this.presenceService.init();
    }
}
