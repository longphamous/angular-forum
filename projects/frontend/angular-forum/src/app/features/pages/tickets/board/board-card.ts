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
        <div
            class="surface-card border-surface-200 dark:border-surface-700 cursor-grab overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
            *transloco="let t"
            [class.border-l-4]="true"
            [style.border-left-color]="priorityColor(ticket().priority)"
        >
            <div class="p-3">
                <div class="mb-1.5 flex items-center gap-1.5">
                    <i
                        [class]="typeIcon(ticket().type) + ' text-surface-400 text-xs'"
                        [pTooltip]="t('tickets.type.' + ticket().type)"
                    ></i>
                    <span class="text-surface-400 font-mono text-xs">#{{ ticket().ticketNumber }}</span>
                    <span class="flex-1"></span>
                    @if (ticket().storyPoints != null) {
                        <span class="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs font-medium"
                            >{{ ticket().storyPoints }} SP</span
                        >
                    }
                </div>
                <a
                    class="text-surface-900 dark:text-surface-0 line-clamp-2 block text-sm leading-snug font-medium hover:underline"
                    [routerLink]="['/tickets', ticket().id]"
                >
                    {{ ticket().title }}
                </a>
                @if (ticket().labels.length > 0) {
                    <div class="mt-2 flex flex-wrap gap-1">
                        @for (label of ticket().labels; track label.id) {
                            <span
                                class="rounded px-1.5 py-0.5 text-[10px] text-white"
                                [style.background-color]="label.color"
                                >{{ label.name }}</span
                            >
                        }
                    </div>
                }
                <div class="mt-2 flex items-center justify-between">
                    <p-tag
                        [severity]="prioritySeverity(ticket().priority)"
                        [value]="t('tickets.priority.' + ticket().priority)"
                        styleClass="text-[10px]"
                    />
                    @if (ticket().assigneeName) {
                        <span
                            class="bg-primary/20 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                            [pTooltip]="ticket().assigneeName!"
                            >{{ initials(ticket().assigneeName!) }}</span
                        >
                    } @else {
                        <span
                            class="bg-surface-200 dark:bg-surface-600 flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                        >
                            <i class="pi pi-user text-surface-400 text-[10px]"></i>
                        </span>
                    }
                </div>
            </div>
        </div>
    `
})
export class BoardCard {
    readonly ticket = input.required<Ticket>();

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            epic: "pi pi-bolt",
            story: "pi pi-bookmark",
            bug: "pi pi-bug",
            task: "pi pi-check-square",
            sub_task: "pi pi-minus",
            support: "pi pi-question-circle",
            feature: "pi pi-star"
        };
        return map[type] ?? "pi pi-ticket";
    }

    prioritySeverity(p: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            low: "secondary",
            normal: "info",
            high: "warn",
            critical: "danger"
        };
        return map[p] ?? "info";
    }

    priorityColor(p: string): string {
        const map: Record<string, string> = {
            low: "#9CA3AF",
            normal: "#3B82F6",
            high: "#F59E0B",
            critical: "#EF4444"
        };
        return map[p] ?? "#9CA3AF";
    }

    initials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
}
