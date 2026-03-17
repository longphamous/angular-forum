import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
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
        CheckboxModule,
        MessageModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-admin-permissions",
    templateUrl: "./admin-permissions.html"
})
export class AdminPermissions implements OnInit {
    protected readonly facade = inject(GroupFacade);
    private readonly translocoService = inject(TranslocoService);

    protected readonly showEditDialog = signal(false);
    protected readonly editingPermission = signal<PagePermission | null>(null);
    protected readonly editingGroupIds = signal<string[]>([]);
    protected readonly saving = signal(false);
    protected readonly saveError = signal<string | null>(null);
    protected readonly collapsedCategories = signal<Set<string>>(new Set());

    readonly groupedPermissions = computed(() => {
        const perms = this.facade.pagePermissions();
        const groups = new Map<string, PagePermission[]>();
        const order = [
            "Community",
            "Forum",
            "Anime",
            "Gamification",
            "Marktplatz",
            "Benutzer",
            "Administration",
            "Allgemein"
        ];
        for (const perm of perms) {
            const cat = perm.category || "Allgemein";
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat)!.push(perm);
        }
        return order
            .filter((cat) => groups.has(cat))
            .map((cat) => ({ category: cat, permissions: groups.get(cat)! }))
            .concat(
                [...groups.entries()]
                    .filter(([cat]) => !order.includes(cat))
                    .map(([category, permissions]) => ({ category, permissions }))
            );
    });

    ngOnInit(): void {
        this.facade.loadPagePermissions();
        this.facade.loadGroups();
    }

    protected categoryIcon(cat: string): string {
        const icons: Record<string, string> = {
            Community: "pi pi-users",
            Forum: "pi pi-comments",
            Anime: "pi pi-play",
            Gamification: "pi pi-trophy",
            Marktplatz: "pi pi-shopping-cart",
            Benutzer: "pi pi-user",
            Administration: "pi pi-cog",
            Allgemein: "pi pi-th-large"
        };
        return icons[cat] ?? "pi pi-folder";
    }

    protected toggleCategory(cat: string): void {
        const current = this.collapsedCategories();
        const next = new Set(current);
        if (next.has(cat)) {
            next.delete(cat);
        } else {
            next.add(cat);
        }
        this.collapsedCategories.set(next);
    }

    protected isCategoryCollapsed(cat: string): boolean {
        return this.collapsedCategories().has(cat);
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
                this.saveError.set(this.translocoService.translate("common.saveError"));
                this.saving.set(false);
            }
        });
    }

    protected isGroupSelected(groupId: string): boolean {
        return this.editingGroupIds().includes(groupId);
    }

    protected toggleGroup(groupId: string): void {
        const current = this.editingGroupIds();
        if (current.includes(groupId)) {
            this.editingGroupIds.set(current.filter((id) => id !== groupId));
        } else {
            this.editingGroupIds.set([...current, groupId]);
        }
    }

    protected groupOptions(): Group[] {
        return this.facade.groups();
    }
}
