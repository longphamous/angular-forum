import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type { RoadmapEpic } from "../../../../core/models/ticket/roadmap";
import { RoadmapFacade } from "../../../../facade/ticket/roadmap-facade";

interface MonthColumn {
    key: string;
    label: string;
    start: Date;
    end: Date;
}

@Component({
    selector: "roadmap-view",
    standalone: true,
    imports: [RouterLink, TranslocoModule, ProgressBarModule, SkeletonModule, TagModule, TooltipModule],
    templateUrl: "./roadmap-view.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoadmapView implements OnInit {
    readonly facade = inject(RoadmapFacade);
    private readonly route = inject(ActivatedRoute);
    readonly projectId = signal("");

    readonly months = computed<MonthColumn[]>(() => {
        const epics = this.facade.epics();
        if (!epics.length) return this.generateMonths(new Date(), 6);

        let earliest = new Date();
        let latest = new Date();
        latest.setMonth(latest.getMonth() + 3);

        for (const epic of epics) {
            if (epic.startDate) {
                const d = new Date(epic.startDate);
                if (d < earliest) earliest = d;
            }
            if (epic.dueDate) {
                const d = new Date(epic.dueDate);
                if (d > latest) latest = d;
            }
        }

        const monthCount = Math.max(4, this.monthDiff(earliest, latest) + 2);
        return this.generateMonths(earliest, monthCount);
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) this.facade.loadRoadmap(id);
    }

    getBarStyle(epic: RoadmapEpic, monthIndex: number): { left: string; width: string } | null {
        const monthList = this.months();
        if (!epic.startDate && !epic.dueDate) return null;

        const start = epic.startDate ? new Date(epic.startDate) : new Date();
        const end = epic.dueDate ? new Date(epic.dueDate) : new Date(start.getTime() + 30 * 86400000);
        const month = monthList[monthIndex];

        // Check if epic overlaps this month
        if (start > month.end || end < month.start) return null;

        const monthDuration = month.end.getTime() - month.start.getTime();
        const barStart = Math.max(0, start.getTime() - month.start.getTime()) / monthDuration;
        const barEnd = Math.min(1, (end.getTime() - month.start.getTime()) / monthDuration);

        if (barEnd <= barStart) return null;

        return {
            left: `${barStart * 100}%`,
            width: `${(barEnd - barStart) * 100}%`
        };
    }

    statusColor(status: string): string {
        const map: Record<string, string> = {
            open: "#6B7280", in_progress: "#F59E0B", waiting: "#6B7280",
            follow_up: "#6B7280", resolved: "#10B981", closed: "#10B981"
        };
        return map[status] ?? "#6B7280";
    }

    prioritySeverity(p: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            low: "secondary", normal: "info", high: "warn", critical: "danger"
        };
        return map[p] ?? "info";
    }

    statusSeverity(s: string): "success" | "info" | "warn" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "secondary"> = {
            open: "info", in_progress: "warn", resolved: "success", closed: "secondary"
        };
        return map[s] ?? "info";
    }

    private generateMonths(start: Date, count: number): MonthColumn[] {
        const months: MonthColumn[] = [];
        const d = new Date(start.getFullYear(), start.getMonth(), 1);

        for (let i = 0; i < count; i++) {
            const monthStart = new Date(d);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const label = monthStart.toLocaleDateString("default", { month: "short", year: "2-digit" });
            months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label, start: monthStart, end: monthEnd });
            d.setMonth(d.getMonth() + 1);
        }

        return months;
    }

    private monthDiff(a: Date, b: Date): number {
        return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    }
}
