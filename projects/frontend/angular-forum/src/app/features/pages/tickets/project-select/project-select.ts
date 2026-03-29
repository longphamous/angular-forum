import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { TicketFacade } from "../../../../facade/ticket/ticket-facade";

@Component({
    selector: "project-select",
    standalone: true,
    imports: [RouterLink, TranslocoModule, ButtonModule, SkeletonModule, TagModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-6 p-6" *transloco="let t">
            <div>
                <h1 class="text-surface-900 dark:text-surface-0 m-0 text-2xl font-bold">{{ title }}</h1>
                <p class="text-surface-500 mt-1">{{ t('tickets.selectProjectHint') }}</p>
            </div>

            @if (facade.projects().length === 0) {
            <div class="surface-card rounded-xl p-8 text-center shadow">
                <i class="pi pi-folder-open text-surface-300 mb-3 text-4xl"></i>
                <p class="text-surface-400">{{ t('tickets.noProjects') }}</p>
                <p-button [label]="t('tickets.goToAdmin')" [routerLink]="['/admin/tickets']" icon="pi pi-cog" severity="secondary" styleClass="mt-3" />
            </div>
            } @else {
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (project of facade.projects(); track project.id) {
                <a
                    [routerLink]="['/' + targetRoute, project.id]"
                    class="surface-card flex flex-col gap-3 rounded-xl p-5 shadow transition-shadow hover:shadow-lg"
                >
                    <div class="flex items-center justify-between">
                        <span class="text-surface-900 dark:text-surface-0 text-lg font-semibold">{{ project.name }}</span>
                        <p-tag
                            [value]="project.status"
                            [severity]="project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'secondary'"
                            styleClass="text-xs"
                        />
                    </div>
                    @if (project.description) {
                    <p class="text-surface-500 line-clamp-2 text-sm">{{ project.description }}</p>
                    }
                    <div class="text-surface-400 flex gap-4 text-xs">
                        <span><i class="pi pi-ticket mr-1"></i>{{ project.ticketCount }} {{ t('tickets.sprint.issues') }}</span>
                        <span><i class="pi pi-circle-fill mr-1 text-blue-400"></i>{{ project.openTicketCount }} {{ t('tickets.status.open') }}</span>
                    </div>
                </a>
                }
            </div>
            }
        </div>
    `
})
export class ProjectSelect implements OnInit {
    readonly facade = inject(TicketFacade);
    private readonly route = inject(ActivatedRoute);

    title = "";
    targetRoute = "";

    ngOnInit(): void {
        this.targetRoute = this.route.snapshot.data["targetRoute"] ?? "board";
        this.title = this.route.snapshot.data["pageTitle"] ?? "Select Project";
        this.facade.loadProjects();
    }
}
