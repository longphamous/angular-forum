import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { CardModule } from "primeng/card";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";

import { AdminFacade } from "../../../facade/admin/admin-facade";

@Component({
    selector: "admin-overview",
    imports: [CardModule, SkeletonModule, MessageModule],
    templateUrl: "./admin-overview.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOverview implements OnInit {
    readonly facade = inject(AdminFacade);

    ngOnInit(): void {
        this.facade.loadCategories();
    }
}
