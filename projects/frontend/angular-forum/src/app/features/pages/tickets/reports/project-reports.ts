import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";

import { SprintFacade } from "../../../../facade/ticket/sprint-facade";
import { ReportingFacade } from "../../../../facade/ticket/reporting-facade";

@Component({
    selector: "project-reports",
    standalone: true,
    imports: [DecimalPipe, FormsModule, RouterLink, TranslocoModule, ButtonModule, ChartModule, SelectModule, SkeletonModule, TabsModule, TagModule],
    templateUrl: "./project-reports.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectReports implements OnInit {
    readonly reportingFacade = inject(ReportingFacade);
    readonly sprintFacade = inject(SprintFacade);
    private readonly route = inject(ActivatedRoute);

    readonly projectId = signal("");
    readonly activeTab = signal("0");
    readonly selectedSprintId = signal("");

    readonly burndownChartData = computed(() => {
        const data = this.reportingFacade.burndown();
        if (!data.length) return null;
        return {
            labels: data.map((p) => p.date),
            datasets: [
                { label: "Remaining", data: data.map((p) => p.remaining), borderColor: "#EF4444", tension: 0.3, fill: false },
                { label: "Ideal", data: data.map((p) => p.ideal), borderColor: "#9CA3AF", borderDash: [5, 5], tension: 0, fill: false }
            ]
        };
    });

    readonly velocityChartData = computed(() => {
        const data = this.reportingFacade.velocity();
        if (!data.length) return null;
        return {
            labels: data.map((v) => v.sprintName),
            datasets: [
                { label: "Completed", data: data.map((v) => v.completedPoints), backgroundColor: "#10B981" },
                { label: "Committed", data: data.map((v) => v.committedPoints), backgroundColor: "#6B7280" }
            ]
        };
    });

    readonly chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" as const } } };

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) {
            this.sprintFacade.loadSprints(id);
            this.reportingFacade.loadVelocity(id);
            this.reportingFacade.loadSlaBreaches(id);
        }
    }

    onSprintSelect(sprintId: string): void {
        this.selectedSprintId.set(sprintId);
        if (sprintId) {
            this.reportingFacade.loadBurndown(sprintId);
            this.reportingFacade.loadSprintReport(sprintId);
        }
    }

    slaSeverity(status: string): "success" | "warn" | "danger" {
        const map: Record<string, "success" | "warn" | "danger"> = { ok: "success", at_risk: "warn", breached: "danger" };
        return map[status] ?? "success";
    }
}
