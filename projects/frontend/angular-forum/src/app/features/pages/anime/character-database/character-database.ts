import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";

import { AnimeFacade } from "../../../../facade/anime/anime-facade";

@Component({
    selector: "character-database",
    imports: [TableModule, ButtonModule, SkeletonModule, InputTextModule, FormsModule, TranslocoModule],
    templateUrl: "./character-database.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterDatabase implements OnInit {
    readonly facade = inject(AnimeFacade);
    readonly pageSize = 20;
    readonly search = signal("");
    private readonly router = inject(Router);

    tableFirst = 0;
    private currentRows = this.pageSize;

    ngOnInit(): void {
        this.loadCurrentPage(1, this.pageSize);
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize;
        const page = Math.floor(first / rows) + 1;
        this.tableFirst = first;
        this.currentRows = rows;
        this.loadCurrentPage(page, rows);
    }

    onSearch(): void {
        this.tableFirst = 0;
        this.loadCurrentPage(1, this.currentRows);
    }

    navigateToDetail(id: number): void {
        void this.router.navigate(["/anime/characters", id]);
    }

    private loadCurrentPage(page: number, rows: number): void {
        const searchVal = this.search().trim() || undefined;
        this.facade.loadCharacters(page, rows, searchVal);
    }
}
