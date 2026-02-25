import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MenuModule } from "primeng/menu";

@Component({
    standalone: true,
    selector: "app-notifications-widget",
    imports: [ButtonModule, MenuModule],
    template: `<div class="card">
        <div class="mb-6 flex items-center justify-between">
            <div class="text-xl font-semibold">Notifications</div>
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

        <span class="text-muted-color mb-4 block font-medium">TODAY</span>
        <ul class="mx-0 mt-0 mb-6 list-none p-0">
            <li class="border-surface flex items-center border-b py-2">
                <div
                    class="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-400/10"
                >
                    <i class="pi pi-dollar text-xl! text-blue-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Richard Jones
                    <span class="text-surface-700 dark:text-surface-100"
                        >has purchased a blue t-shirt for <span class="text-primary font-bold">$79.00</span></span
                    >
                </span>
            </li>
            <li class="flex items-center py-2">
                <div
                    class="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-400/10"
                >
                    <i class="pi pi-download text-xl! text-orange-500"></i>
                </div>
                <span class="text-surface-700 dark:text-surface-100 leading-normal"
                    >Your request for withdrawal of <span class="text-primary font-bold">$2500.00</span> has been
                    initiated.</span
                >
            </li>
        </ul>

        <span class="text-muted-color mb-4 block font-medium">YESTERDAY</span>
        <ul class="m-0 mb-6 list-none p-0">
            <li class="border-surface flex items-center border-b py-2">
                <div
                    class="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-400/10"
                >
                    <i class="pi pi-dollar text-xl! text-blue-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Keyser Wick
                    <span class="text-surface-700 dark:text-surface-100"
                        >has purchased a black jacket for <span class="text-primary font-bold">$59.00</span></span
                    >
                </span>
            </li>
            <li class="border-surface flex items-center border-b py-2">
                <div
                    class="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-400/10"
                >
                    <i class="pi pi-question text-xl! text-pink-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Jane Davis
                    <span class="text-surface-700 dark:text-surface-100"
                        >has posted a new questions about your product.</span
                    >
                </span>
            </li>
        </ul>
        <span class="text-muted-color mb-4 block font-medium">LAST WEEK</span>
        <ul class="m-0 list-none p-0">
            <li class="border-surface flex items-center border-b py-2">
                <div
                    class="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-400/10"
                >
                    <i class="pi pi-arrow-up text-xl! text-green-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Your revenue has increased by <span class="text-primary font-bold">%25</span>.</span
                >
            </li>
            <li class="border-surface flex items-center border-b py-2">
                <div
                    class="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-400/10"
                >
                    <i class="pi pi-heart text-xl! text-purple-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    ><span class="text-primary font-bold">12</span> users have added your products to their
                    wishlist.</span
                >
            </li>
        </ul>
    </div>`
})
export class NotificationsWidget {
    items = [
        { label: "Add New", icon: "pi pi-fw pi-plus" },
        { label: "Remove", icon: "pi pi-fw pi-trash" }
    ];
}
