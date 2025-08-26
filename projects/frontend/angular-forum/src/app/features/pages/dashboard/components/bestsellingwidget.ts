import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MenuModule } from "primeng/menu";

@Component({
    standalone: true,
    selector: "app-best-selling-widget",
    imports: [CommonModule, ButtonModule, MenuModule],
    template: ` <div class="card">
        <div class="mb-6 flex items-center justify-between">
            <div class="text-xl font-semibold">Best Selling Products</div>
            <div>
                <button
                    class="p-button-rounded p-button-text p-button-plain"
                    (click)="menu.toggle($event)"
                    icon="pi pi-ellipsis-v"
                    pButton
                    type="button"
                ></button>
                <p-menu #menu [model]="items" [popup]="true"></p-menu>
            </div>
        </div>
        <ul class="m-0 list-none p-0">
            <li class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 mb-1 mr-2 font-medium md:mb-0"
                        >Space T-Shirt</span
                    >
                    <div class="text-muted-color mt-1">Clothing</div>
                </div>
                <div class="mt-2 flex items-center md:mt-0">
                    <div
                        class="bg-surface-300 dark:bg-surface-500 rounded-border w-40 overflow-hidden lg:w-24"
                        style="height: 8px"
                    >
                        <div class="h-full bg-orange-500" style="width: 50%"></div>
                    </div>
                    <span class="ml-4 font-medium text-orange-500">%50</span>
                </div>
            </li>
            <li class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 mb-1 mr-2 font-medium md:mb-0"
                        >Portal Sticker</span
                    >
                    <div class="text-muted-color mt-1">Accessories</div>
                </div>
                <div class="ml-0 mt-2 flex items-center md:ml-20 md:mt-0">
                    <div
                        class="bg-surface-300 dark:bg-surface-500 rounded-border w-40 overflow-hidden lg:w-24"
                        style="height: 8px"
                    >
                        <div class="h-full bg-cyan-500" style="width: 16%"></div>
                    </div>
                    <span class="ml-4 font-medium text-cyan-500">%16</span>
                </div>
            </li>
            <li class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 mb-1 mr-2 font-medium md:mb-0"
                        >Supernova Sticker</span
                    >
                    <div class="text-muted-color mt-1">Accessories</div>
                </div>
                <div class="ml-0 mt-2 flex items-center md:ml-20 md:mt-0">
                    <div
                        class="bg-surface-300 dark:bg-surface-500 rounded-border w-40 overflow-hidden lg:w-24"
                        style="height: 8px"
                    >
                        <div class="h-full bg-pink-500" style="width: 67%"></div>
                    </div>
                    <span class="ml-4 font-medium text-pink-500">%67</span>
                </div>
            </li>
            <li class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 mb-1 mr-2 font-medium md:mb-0"
                        >Wonders Notebook</span
                    >
                    <div class="text-muted-color mt-1">Office</div>
                </div>
                <div class="ml-0 mt-2 flex items-center md:ml-20 md:mt-0">
                    <div
                        class="bg-surface-300 dark:bg-surface-500 rounded-border w-40 overflow-hidden lg:w-24"
                        style="height: 8px"
                    >
                        <div class="h-full bg-green-500" style="width: 35%"></div>
                    </div>
                    <span class="text-primary ml-4 font-medium">%35</span>
                </div>
            </li>
            <li class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 mb-1 mr-2 font-medium md:mb-0"
                        >Mat Black Case</span
                    >
                    <div class="text-muted-color mt-1">Accessories</div>
                </div>
                <div class="ml-0 mt-2 flex items-center md:ml-20 md:mt-0">
                    <div
                        class="bg-surface-300 dark:bg-surface-500 rounded-border w-40 overflow-hidden lg:w-24"
                        style="height: 8px"
                    >
                        <div class="h-full bg-purple-500" style="width: 75%"></div>
                    </div>
                    <span class="ml-4 font-medium text-purple-500">%75</span>
                </div>
            </li>
            <li class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <span class="text-surface-900 dark:text-surface-0 mb-1 mr-2 font-medium md:mb-0"
                        >Robots T-Shirt</span
                    >
                    <div class="text-muted-color mt-1">Clothing</div>
                </div>
                <div class="ml-0 mt-2 flex items-center md:ml-20 md:mt-0">
                    <div
                        class="bg-surface-300 dark:bg-surface-500 rounded-border w-40 overflow-hidden lg:w-24"
                        style="height: 8px"
                    >
                        <div class="h-full bg-teal-500" style="width: 40%"></div>
                    </div>
                    <span class="ml-4 font-medium text-teal-500">%40</span>
                </div>
            </li>
        </ul>
    </div>`
})
export class BestSellingWidget {
    menu = null;

    items = [
        { label: "Add New", icon: "pi pi-fw pi-plus" },
        { label: "Remove", icon: "pi pi-fw pi-trash" }
    ];
}
