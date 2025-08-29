import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    OnInit,
    ViewChild
} from "@angular/core";
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
import { Table, TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToggleButtonModule } from "primeng/togglebutton";

import { Customer, CustomerService, Representative } from "../../service/customer.service";
import { Status } from "../anime-top-list/anime-top-list";

@Component({
    selector: "anime-database",
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
    templateUrl: "./anime-database.html",
    styleUrl: "./anime-database.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeDatabase implements OnInit {
    @ViewChild("filter") filter!: ElementRef;

    customers1: Customer[] = [];

    representatives: Representative[] = [];

    statuses: Status[] = [];

    activityValues: number[] = [0, 100];

    isExpanded: boolean = false;

    balanceFrozen: boolean = false;

    loading: boolean = true;

    customerService: CustomerService = inject(CustomerService);
    cd: ChangeDetectorRef = inject(ChangeDetectorRef);

    ngOnInit() {
        this.customerService.getCustomersLarge().subscribe((customers) => {
            this.customers1 = customers;
            this.loading = false;

            this.customers1.forEach((customer) => {
                if (customer.date) {
                    customer.date = new Date(customer.date);
                }
            });
            this.cd.markForCheck();
        });

        this.representatives = [
            { name: "Amy Elsner", image: "amyelsner.png" },
            { name: "Anna Fali", image: "annafali.png" },
            { name: "Asiya Javayant", image: "asiyajavayant.png" },
            { name: "Bernardo Dominic", image: "bernardodominic.png" },
            { name: "Elwin Sharvill", image: "elwinsharvill.png" },
            { name: "Ioni Bowcher", image: "ionibowcher.png" },
            { name: "Ivan Magalhaes", image: "ivanmagalhaes.png" },
            { name: "Onyama Limba", image: "onyamalimba.png" },
            { name: "Stephen Shaw", image: "stephenshaw.png" },
            { name: "XuXue Feng", image: "xuxuefeng.png" }
        ];

        this.statuses = [
            { label: "Unqualified", value: "unqualified" },
            { label: "Qualified", value: "qualified" },
            { label: "New", value: "new" },
            { label: "Negotiation", value: "negotiation" },
            { label: "Renewal", value: "renewal" },
            { label: "Proposal", value: "proposal" }
        ];
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, "contains");
    }

    clear(table: Table) {
        table.clear();
        this.filter.nativeElement.value = "";
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
