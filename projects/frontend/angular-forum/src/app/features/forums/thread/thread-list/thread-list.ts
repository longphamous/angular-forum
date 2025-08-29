import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoPipe } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DataViewModule } from "primeng/dataview";
import { IconFieldModule } from "primeng/iconfield";
import { InputTextModule } from "primeng/inputtext";
import { MenubarModule } from "primeng/menubar";
import { OrderListModule } from "primeng/orderlist";
import { PickListModule } from "primeng/picklist";
import { SelectButtonModule } from "primeng/selectbutton";
import { TagModule } from "primeng/tag";

import { Product, ProductService } from "../../../pages/service/product.service";

@Component({
    selector: "thread-list",
    imports: [
        CommonModule,
        MenubarModule,
        IconFieldModule,
        InputTextModule,
        DataViewModule,
        FormsModule,
        SelectButtonModule,
        PickListModule,
        OrderListModule,
        TagModule,
        ButtonModule,
        TranslocoPipe
    ],
    templateUrl: "./thread-list.html",
    styleUrl: "./thread-list.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadList implements OnInit {
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
