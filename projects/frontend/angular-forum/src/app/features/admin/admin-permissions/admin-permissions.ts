import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { MultiSelectModule } from "primeng/multiselect";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { Group, PagePermission } from "../../../core/models/group/group";
import { GroupFacade } from "../../../facade/group/group-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        DialogModule,
        FormsModule,
        MessageModule,
        MultiSelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TooltipModule
    ],
    selector: "app-admin-permissions",
    templateUrl: "./admin-permissions.html"
})
export class AdminPermissions implements OnInit {
    protected readonly facade = inject(GroupFacade);

    protected readonly showEditDialog = signal(false);
    protected readonly editingPermission = signal<PagePermission | null>(null);
    protected readonly editingGroupIds = signal<string[]>([]);
    protected readonly saving = signal(false);
    protected readonly saveError = signal<string | null>(null);

    ngOnInit(): void {
        this.facade.loadPagePermissions();
        this.facade.loadGroups();
    }

    protected groupNames(perm: PagePermission): string {
        if (!perm.groups?.length) return "–";
        return perm.groups.map((g) => g.name).join(", ");
    }

    protected openEditDialog(perm: PagePermission): void {
        this.editingPermission.set(perm);
        this.editingGroupIds.set(perm.groups?.map((g) => g.id) ?? []);
        this.saveError.set(null);
        this.showEditDialog.set(true);
    }

    protected savePermission(): void {
        const perm = this.editingPermission();
        if (!perm) return;
        this.saving.set(true);
        this.saveError.set(null);
        this.facade.setPermissionGroups(perm.id, this.editingGroupIds()).subscribe({
            next: (updated) => {
                this.facade.updatePagePermissionLocally(updated);
                this.saving.set(false);
                this.showEditDialog.set(false);
            },
            error: () => {
                this.saveError.set("Fehler beim Speichern.");
                this.saving.set(false);
            }
        });
    }

    protected groupOptions(): Group[] {
        return this.facade.groups();
    }
}
