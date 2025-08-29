import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { ProgressBarModule } from "primeng/progressbar";
import { RatingModule } from "primeng/rating";
import { RippleModule } from "primeng/ripple";
import { SelectModule } from "primeng/select";
import { SliderModule } from "primeng/slider";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToggleButtonModule } from "primeng/togglebutton";

import { Product, ProductService } from "../../service/product.service";

export interface Status {
    label: string;
    value: string;
}

@Component({
    selector: "anime-top-list",
    imports: [
        TableModule,
        MultiSelectModule,
        SelectModule,
        InputIconModule,
        TagModule,
        InputTextModule,
        SliderModule,
        ProgressBarModule,
        ToggleButtonModule,
        ToastModule,
        CommonModule,
        FormsModule,
        ButtonModule,
        RatingModule,
        RippleModule,
        IconFieldModule
    ],
    templateUrl: "./anime-top-list.html",
    styleUrl: "./anime-top-list.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeTopList implements OnInit {
    statuses: Status[] = [];

    products: Product[] = [];

    activityValues: number[] = [0, 100];

    isExpanded: boolean = false;

    balanceFrozen: boolean = false;

    loading: boolean = true;

    productService: ProductService = inject(ProductService);
    cd: ChangeDetectorRef = inject(ChangeDetectorRef);

    ngOnInit() {
        this.productService.getProductsWithOrdersSmall().then((data) => {
            this.products = data;
            this.cd.markForCheck();
        });

        this.statuses = [
            { label: "Unqualified", value: "unqualified" },
            { label: "Qualified", value: "qualified" },
            { label: "New", value: "new" },
            { label: "Negotiation", value: "negotiation" },
            { label: "Renewal", value: "renewal" },
            { label: "Proposal", value: "proposal" }
        ];
    }

    getSeverity(status: string) {
        switch (status) {
            case "qualified":
            case "instock":
            case "INSTOCK":
            case "DELIVERED":
            case "delivered":
                return "success";

            case "negotiation":
            case "lowstock":
            case "LOWSTOCK":
            case "PENDING":
            case "pending":
                return "warn";

            case "unqualified":
            case "outofstock":
            case "OUTOFSTOCK":
            case "CANCELLED":
            case "cancelled":
                return "danger";

            default:
                return "info";
        }
    }
}
