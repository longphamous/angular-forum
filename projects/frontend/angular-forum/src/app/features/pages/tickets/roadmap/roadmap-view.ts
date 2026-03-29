import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { RoadmapFacade } from "../../../../facade/ticket/roadmap-facade";

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

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("projectId") ?? "";
        this.projectId.set(id);
        if (id) this.facade.loadRoadmap(id);
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
}
