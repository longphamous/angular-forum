import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";

import { AdminFacade } from "../../../facade/admin/admin-facade";
import { AuthFacade } from "../../../facade/auth/auth-facade";

export interface DashboardBox {
    id: string;
    visible: boolean;
}

const STORAGE_KEY = "admin-dashboard-boxes";

const DEFAULT_BOXES: DashboardBox[] = [
    { id: "notices", visible: true },
    { id: "recentThreads", visible: true },
    { id: "newestMembers", visible: true },
    { id: "topPosters", visible: true },
    { id: "logSummary", visible: true },
    { id: "forumStructure", visible: true },
    { id: "quickActions", visible: true }
];

@Component({
    selector: "admin-overview",
    imports: [
        ButtonModule,
        CdkDrag,
        CdkDropList,
        DatePipe,
        DialogModule,
        MessageModule,
        RouterModule,
        SkeletonModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./admin-overview.html",
    styleUrl: "./admin-overview.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOverview implements OnInit {
    readonly facade = inject(AdminFacade);
    readonly authFacade = inject(AuthFacade);

    readonly boxes = signal<DashboardBox[]>(DEFAULT_BOXES);
    readonly configDialogVisible = signal(false);
    readonly configBoxes = signal<DashboardBox[]>([]);

    readonly visibleBoxes = computed(() => this.boxes().filter((b) => b.visible));

    ngOnInit(): void {
        this.facade.loadCategories();
        this.facade.loadUsers();
        this.facade.loadDashboardData();
        this.loadBoxConfig();
    }

    openConfig(): void {
        this.configBoxes.set(this.boxes().map((b) => ({ ...b })));
        this.configDialogVisible.set(true);
    }

    toggleBoxVisibility(id: string): void {
        this.configBoxes.update((list) => list.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)));
    }

    onConfigDrop(event: CdkDragDrop<DashboardBox[]>): void {
        const list = [...this.configBoxes()];
        moveItemInArray(list, event.previousIndex, event.currentIndex);
        this.configBoxes.set(list);
    }

    saveConfig(): void {
        this.boxes.set(this.configBoxes());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.configBoxes()));
        this.configDialogVisible.set(false);
    }

    cancelConfig(): void {
        this.configDialogVisible.set(false);
    }

    boxLabel(id: string): string {
        const labels: Record<string, string> = {
            notices: "adminOverview.systemNotices",
            recentThreads: "adminOverview.recentThreads",
            newestMembers: "adminOverview.newestMembers",
            topPosters: "adminOverview.topPosters",
            logSummary: "adminOverview.logSummary",
            forumStructure: "adminOverview.forumStructure",
            quickActions: "adminOverview.quickActions"
        };
        return labels[id] ?? id;
    }

    boxIcon(id: string): string {
        const icons: Record<string, string> = {
            notices: "pi pi-bell",
            recentThreads: "pi pi-list",
            newestMembers: "pi pi-user-plus",
            topPosters: "pi pi-chart-bar",
            logSummary: "pi pi-file",
            forumStructure: "pi pi-sitemap",
            quickActions: "pi pi-bolt"
        };
        return icons[id] ?? "pi pi-box";
    }

    private loadBoxConfig(): void {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed: DashboardBox[] = JSON.parse(stored);
                const knownIds = DEFAULT_BOXES.map((b) => b.id);
                const merged = knownIds.map(
                    (id) => parsed.find((b) => b.id === id) ?? DEFAULT_BOXES.find((b) => b.id === id)!
                );
                this.boxes.set(merged);
            } catch {
                this.boxes.set(DEFAULT_BOXES);
            }
        }
    }
}
