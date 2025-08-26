import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-stats-widget",
    imports: [CommonModule],
    template: `<div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="mb-4 flex justify-between">
                    <div>
                        <span class="text-muted-color mb-4 block font-medium">Orders</span>
                        <div class="text-surface-900 dark:text-surface-0 text-xl font-medium">152</div>
                    </div>
                    <div
                        class="rounded-border flex items-center justify-center bg-blue-100 dark:bg-blue-400/10"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-shopping-cart text-xl! text-blue-500"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">24 new </span>
                <span class="text-muted-color">since last visit</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="mb-4 flex justify-between">
                    <div>
                        <span class="text-muted-color mb-4 block font-medium">Revenue</span>
                        <div class="text-surface-900 dark:text-surface-0 text-xl font-medium">$2.100</div>
                    </div>
                    <div
                        class="rounded-border flex items-center justify-center bg-orange-100 dark:bg-orange-400/10"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-dollar text-xl! text-orange-500"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">%52+ </span>
                <span class="text-muted-color">since last week</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="mb-4 flex justify-between">
                    <div>
                        <span class="text-muted-color mb-4 block font-medium">Customers</span>
                        <div class="text-surface-900 dark:text-surface-0 text-xl font-medium">28441</div>
                    </div>
                    <div
                        class="rounded-border flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-users text-xl! text-cyan-500"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">520 </span>
                <span class="text-muted-color">newly registered</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="mb-4 flex justify-between">
                    <div>
                        <span class="text-muted-color mb-4 block font-medium">Comments</span>
                        <div class="text-surface-900 dark:text-surface-0 text-xl font-medium">152 Unread</div>
                    </div>
                    <div
                        class="rounded-border flex items-center justify-center bg-purple-100 dark:bg-purple-400/10"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-comment text-xl! text-purple-500"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">85 </span>
                <span class="text-muted-color">responded</span>
            </div>
        </div>`
})
export class StatsWidget {}
