import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DataViewModule } from "primeng/dataview";
import { IconFieldModule } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { MenubarModule } from "primeng/menubar";
import { OrderListModule } from "primeng/orderlist";
import { PickListModule } from "primeng/picklist";
import { SelectButtonModule } from "primeng/selectbutton";
import { TagModule } from "primeng/tag";

import { Product, ProductService } from "../../pages/service/product.service";

@Component({
    selector: "forum-list",
    imports: [
        CommonModule,
        MenubarModule,
        IconFieldModule,
        InputTextModule,
        InputIcon,
        DataViewModule,
        FormsModule,
        SelectButtonModule,
        PickListModule,
        OrderListModule,
        TagModule,
        ButtonModule
    ],
    templateUrl: "./forum-list.component.html",
    styleUrl: "./forum-list.component.scss"
})
export class ForumListComponent implements OnInit {
    nestedMenuItems = [
        {
            label: "Community",
            icon: "pi pi-fw pi-globe",
            items: [
                {
                    label: "Dasbhaord",
                    icon: "pi pi-fw pi-home"
                },
                {
                    label: "Unresolved Thread",
                    icon: "pi pi-fw pi-folder"
                }
            ]
        },
        {
            label: "Lexicon",
            icon: "pi pi-fw pi-book"
        },
        {
            label: "Blog",
            icon: "pi pi-fw pi-envelope",
            items: [
                {
                    label: "Tracker",
                    icon: "pi pi-fw pi-compass"
                },
                {
                    label: "Map",
                    icon: "pi pi-fw pi-map-marker"
                },
                {
                    label: "Manage",
                    icon: "pi pi-fw pi-pencil"
                }
            ]
        },
        {
            label: "Profile",
            icon: "pi pi-fw pi-user",
            items: [
                {
                    label: "Your Profile",
                    icon: "pi pi-fw pi-user"
                },
                {
                    label: "Settings",
                    icon: "pi pi-fw pi-cog"
                }
            ]
        },
        {
            label: "Quit",
            icon: "pi pi-fw pi-sign-out"
        }
    ];

    layout: "list" | "grid" = "list";

    options = ["list", "grid"];

    products: Product[] = [];

    productService: ProductService = inject(ProductService);

    ngOnInit(): void {
        this.productService.getProductsSmall().then((data) => (this.products = data.slice(0, 6)));
    }

    getSeverity(product: Product) {
        switch (product.inventoryStatus) {
            case "INSTOCK":
                return "success";

            case "LOWSTOCK":
                return "warn";

            case "OUTOFSTOCK":
                return "danger";

            default:
                return "info";
        }
    }
}
