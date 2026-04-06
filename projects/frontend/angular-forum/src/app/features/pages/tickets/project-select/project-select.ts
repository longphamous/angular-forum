import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import { TicketFacade } from "../../../../facade/ticket/ticket-facade";

@Component({
    selector: "project-select",
    standalone: true,
    imports: [
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        DatePickerModule,
        DialogModule,
        InputTextModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule
    ],
    providers: [MessageService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-6 p-6" *transloco="let t">
            <p-toast />

            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-surface-900 dark:text-surface-0 m-0 text-2xl font-bold">{{ title }}</h1>
                    <p class="text-surface-500 mt-1">{{ t("tickets.selectProjectHint") }}</p>
                </div>
                <p-button [label]="t('tickets.project.create')" (onClick)="openCreateDialog()" icon="pi pi-plus" />
            </div>

            @if (facade.projects().length === 0) {
                <div class="surface-card rounded-xl p-8 text-center shadow">
                    <i class="pi pi-folder-open text-surface-300 mb-3 text-4xl"></i>
                    <p class="text-surface-700 dark:text-surface-200 mb-1 text-lg font-semibold">
                        {{ t("tickets.project.noProjectsTitle") }}
                    </p>
                    <p class="text-surface-400 mb-4">{{ t("tickets.project.noProjectsDescription") }}</p>
                    <p-button
                        [label]="t('tickets.project.createFirst')"
                        (onClick)="openCreateDialog()"
                        icon="pi pi-plus"
                    />
                </div>
            } @else {
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @for (project of facade.projects(); track project.id) {
                        <a
                            class="surface-card flex flex-col gap-3 rounded-xl p-5 shadow transition-shadow hover:shadow-lg"
                            [routerLink]="['/' + targetRoute, project.id]"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-folder text-primary"></i>
                                    <span class="text-surface-900 dark:text-surface-0 text-lg font-semibold">{{
                                        project.name
                                    }}</span>
                                </div>
                                <p-tag
                                    [severity]="
                                        project.status === 'active'
                                            ? 'success'
                                            : project.status === 'completed'
                                              ? 'info'
                                              : 'secondary'
                                    "
                                    [value]="project.status"
                                    styleClass="text-xs"
                                />
                            </div>
                            @if (project.description) {
                                <p class="text-surface-500 line-clamp-2 text-sm">{{ project.description }}</p>
                            }
                            <div class="text-surface-400 flex gap-4 text-xs">
                                <span
                                    ><i class="pi pi-ticket mr-1"></i>{{ project.ticketCount }}
                                    {{ t("tickets.sprint.issues") }}</span
                                >
                                <span
                                    ><i class="pi pi-circle-fill mr-1 text-blue-400"></i>{{ project.openTicketCount }}
                                    {{ t("tickets.status.open") }}</span
                                >
                            </div>
                        </a>
                    }
                </div>
            }

            <!-- Create Project Dialog -->
            <p-dialog
                [(visible)]="createVisible"
                [header]="t('tickets.project.create')"
                [modal]="true"
                [style]="{ width: '500px' }"
            >
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-600 dark:text-surface-400 text-sm font-semibold"
                            >{{ t("tickets.project.name") }} *</label
                        >
                        <input class="w-full" [(ngModel)]="projectName" pInputText type="text" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-600 dark:text-surface-400 text-sm font-semibold">{{
                            t("common.description")
                        }}</label>
                        <textarea class="w-full" [(ngModel)]="projectDescription" [rows]="3" pTextarea></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-surface-600 dark:text-surface-400 text-sm font-semibold">{{
                                t("tickets.project.startDate")
                            }}</label>
                            <p-datepicker
                                [(ngModel)]="projectStartDate"
                                [showClear]="true"
                                dateFormat="dd.mm.yy"
                                styleClass="w-full"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-surface-600 dark:text-surface-400 text-sm font-semibold">{{
                                t("tickets.project.endDate")
                            }}</label>
                            <p-datepicker
                                [(ngModel)]="projectEndDate"
                                [showClear]="true"
                                dateFormat="dd.mm.yy"
                                styleClass="w-full"
                            />
                        </div>
                    </div>
                </div>
                <ng-template #footer>
                    <div class="flex justify-end gap-2">
                        <p-button
                            [label]="t('common.button.cancel')"
                            (onClick)="createVisible.set(false)"
                            severity="secondary"
                            text
                        />
                        <p-button
                            [disabled]="!projectName.trim()"
                            [label]="t('tickets.project.create')"
                            (onClick)="submitCreate()"
                            icon="pi pi-plus"
                        />
                    </div>
                </ng-template>
            </p-dialog>
        </div>
    `
})
export class ProjectSelect implements OnInit {
    readonly facade = inject(TicketFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);

    title = "";
    targetRoute = "";

    // Create dialog
    readonly createVisible = signal(false);
    projectName = "";
    projectDescription = "";
    projectStartDate: Date | null = null;
    projectEndDate: Date | null = null;

    ngOnInit(): void {
        this.targetRoute = this.route.snapshot.data["targetRoute"] ?? "board";
        this.title = this.route.snapshot.data["pageTitle"] ?? "Select Project";
        this.facade.loadProjects();
    }

    openCreateDialog(): void {
        this.projectName = "";
        this.projectDescription = "";
        this.projectStartDate = null;
        this.projectEndDate = null;
        this.createVisible.set(true);
    }

    submitCreate(): void {
        const name = this.projectName.trim();
        if (!name) return;

        this.facade
            .createProject({
                name,
                description: this.projectDescription || undefined,
                startDate: this.projectStartDate?.toISOString().split("T")[0],
                endDate: this.projectEndDate?.toISOString().split("T")[0]
            })
            .subscribe({
                next: (project) => {
                    this.createVisible.set(false);
                    this.facade.loadProjects();
                    this.messageService.add({
                        severity: "success",
                        summary: this.t.translate("tickets.project.created")
                    });
                    // Navigate directly to the new project's board
                    this.router.navigate(["/" + this.targetRoute, project.id]);
                }
            });
    }
}
