import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { ForumFacade } from "../../../facade/forum/forum-facade";

@Component({
    selector: "forum-list",
    imports: [RouterModule, ButtonModule, TagModule, SkeletonModule, MessageModule, DatePipe],
    templateUrl: "./forum-list.component.html",
    styleUrl: "./forum-list.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumListComponent implements OnInit {
    readonly facade = inject(ForumFacade);

    ngOnInit(): void {
        this.facade.loadCategories();
    }
}
