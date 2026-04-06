import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { TooltipModule } from "primeng/tooltip";

import type { Ticket } from "../../../../core/models/ticket/ticket";

@Component({
    selector: "board-card",
    standalone: true,
    imports: [DatePipe, TranslocoModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div
            class="surface-card border-surface-200 dark:border-surface-700 group cursor-pointer overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
            *transloco="let t"
            (click)="cardClick.emit(ticket())"
        >
            <div class="p-3">
                <!-- Top row: type icon + ticket key + menu -->
                <div class="mb-1.5 flex items-center gap-1.5">
                    <i [class]="typeIcon(ticket().type)" [style.color]="typeColor(ticket().type)"></i>
                    <span class="text-surface-400 font-mono text-xs font-medium"
                        >{{ ticket().projectName ? ticket().projectName!.substring(0, 3).toUpperCase() : "TKT" }}-{{
                            ticket().ticketNumber
                        }}</span
                    >
                    <span class="flex-1"></span>
                    <button
                        class="text-surface-300 hover:text-surface-500 flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                        (click)="$event.stopPropagation()"
                    >
                        <i class="pi pi-ellipsis-h text-xs"></i>
                    </button>
                </div>

                <!-- Title -->
                <div class="text-surface-900 dark:text-surface-0 mb-3 line-clamp-2 text-sm leading-snug font-medium">
                    {{ ticket().title }}
                </div>

                <!-- Labels -->
                @if (ticket().labels.length > 0) {
                    <div class="mb-2 flex flex-wrap gap-1">
                        @for (label of ticket().labels.slice(0, 3); track label.id) {
                            <span
                                class="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                                [style.background-color]="label.color"
                                >{{ label.name }}</span
                            >
                        }
                        @if (ticket().labels.length > 3) {
                            <span class="text-surface-400 text-[10px]">+{{ ticket().labels.length - 3 }}</span>
                        }
                    </div>
                }

                <!-- Bottom row: due date, priority, story points, avatar -->
                <div class="flex items-center gap-2">
                    @if (ticket().dueDate) {
                        <span
                            class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
                            [class]="
                                isDueOverdue(ticket().dueDate!)
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                            "
                        >
                            <i class="pi pi-calendar text-[10px]"></i>
                            {{ ticket().dueDate | date: "MMM d, y" }}
                        </span>
                    }

                    @if (ticket().priority && ticket().priority !== "normal") {
                        <i
                            class="text-sm"
                            [class]="priorityIcon(ticket().priority)"
                            [pTooltip]="t('tickets.priority.' + ticket().priority)"
                            [style.color]="priorityColor(ticket().priority)"
                        ></i>
                    }

                    @if (ticket().storyPoints != null) {
                        <span
                            class="bg-surface-100 dark:bg-surface-700 text-surface-500 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            >{{ ticket().storyPoints }}</span
                        >
                    }

                    <span class="flex-1"></span>

                    <!-- Assignee avatar -->
                    @if (ticket().assigneeName) {
                        <span
                            class="bg-primary/20 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                            [pTooltip]="ticket().assigneeName!"
                            >{{ initials(ticket().assigneeName!) }}</span
                        >
                    } @else {
                        <span
                            class="bg-surface-200 dark:bg-surface-600 flex h-6 w-6 items-center justify-center rounded-full"
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
    readonly cardClick = output<Ticket>();

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            epic: "pi pi-bolt text-xs",
            story: "pi pi-bookmark text-xs",
            bug: "pi pi-bug text-xs",
            task: "pi pi-check-square text-xs",
            sub_task: "pi pi-minus text-xs",
            support: "pi pi-question-circle text-xs",
            feature: "pi pi-star text-xs"
        };
        return map[type] ?? "pi pi-ticket text-xs";
    }

    typeColor(type: string): string {
        const map: Record<string, string> = {
            epic: "#8B5CF6",
            story: "#10B981",
            bug: "#EF4444",
            task: "#3B82F6",
            sub_task: "#6B7280",
            support: "#06B6D4",
            feature: "#F59E0B"
        };
        return map[type] ?? "#6B7280";
    }

    priorityIcon(p: string): string {
        const map: Record<string, string> = {
            critical: "pi pi-angle-double-up",
            high: "pi pi-angle-up",
            low: "pi pi-angle-down"
        };
        return map[p] ?? "";
    }

    priorityColor(p: string): string {
        const map: Record<string, string> = {
            low: "#6B7280",
            normal: "#3B82F6",
            high: "#F59E0B",
            critical: "#EF4444"
        };
        return map[p] ?? "#6B7280";
    }

    isDueOverdue(dueDate: string): boolean {
        return new Date(dueDate) < new Date();
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
