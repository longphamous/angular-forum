import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import { ModuleConfig, ModuleConfigFacade } from "../../../facade/module-config/module-config-facade";

interface ModuleGroup {
    module: ModuleConfig;
    children: ModuleConfig[];
}

@Component({
    selector: "admin-modules",
    imports: [ButtonModule, FormsModule, SkeletonModule, ToggleSwitchModule, TranslocoModule],
    templateUrl: "./admin-modules.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminModules {
    protected readonly facade = inject(ModuleConfigFacade);

    protected readonly groups = computed((): ModuleGroup[] => {
        const parents = this.facade.getParents();
        return parents.map((p) => ({
            module: p,
            children: this.facade.getChildren(p.key)
        }));
    });

    protected readonly standaloneModules = computed((): ModuleConfig[] => {
        return this.facade.getParents().filter((p) => this.facade.getChildren(p.key).length === 0);
    });

    protected readonly groupedModules = computed((): ModuleGroup[] => {
        return this.facade.getParents()
            .filter((p) => this.facade.getChildren(p.key).length > 0)
            .map((p) => ({ module: p, children: this.facade.getChildren(p.key) }));
    });

    protected onToggle(key: string, enabled: boolean): void {
        this.facade.toggle(key, enabled).subscribe();
    }
}
