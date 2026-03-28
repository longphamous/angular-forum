import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type { Ticket } from "../../../../core/models/ticket/ticket";

@Component({
    selector: "board-card",
    standalone: true,
    imports: [RouterLink, TranslocoModule, TagModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="surface-card cursor-grab rounded-lg border border-surface-200 p-3 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700" *transloco="let t">
            <div class="mb-2 flex items-center gap-1.5">
                <i [class]="typeIcon(ticket().type) + ' text-surface-400 text-xs'"></i>
                <span class="text-surface-400 font-mono text-xs">#{{ ticket().ticketNumber }}</span>
                @if (ticket().storyPoints != null) {
                <span class="bg-surface-100 dark:bg-surface-700 ml-auto rounded-full px-1.5 py-0.5 text-xs">{{ ticket().storyPoints }}</span>
                }
            </div>
            <a [routerLink]="['/tickets', ticket().id]" class="text-surface-900 dark:text-surface-0 text-sm font-medium leading-tight hover:underline">
                {{ ticket().title }}
            </a>
            <div class="mt-2 flex flex-wrap items-center gap-1">
                <p-tag [severity]="prioritySeverity(ticket().priority)" [value]="t('tickets.priority.' + ticket().priority)" styleClass="text-xs" />
                @for (label of ticket().labels; track label.id) {
                <span class="rounded px-1.5 py-0.5 text-xs text-white" [style.background-color]="label.color">{{ label.name }}</span>
                }
            </div>
            @if (ticket().assigneeName) {
            <div class="text-surface-400 mt-2 text-xs">
                <i class="pi pi-user mr-1"></i>{{ ticket().assigneeName }}
            </div>
            }
        </div>
    `
})
export class BoardCard {
    readonly ticket = input.required<Ticket>();

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            epic: "pi pi-bolt", story: "pi pi-bookmark", bug: "pi pi-bug",
            task: "pi pi-check-square", sub_task: "pi pi-minus", support: "pi pi-question-circle", feature: "pi pi-star"
        };
        return map[type] ?? "pi pi-ticket";
    }

    prioritySeverity(p: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            low: "secondary", normal: "info", high: "warn", critical: "danger"
        };
        return map[p] ?? "info";
    }
}
