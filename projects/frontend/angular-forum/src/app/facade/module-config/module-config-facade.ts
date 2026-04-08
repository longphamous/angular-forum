import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { API_CONFIG, ApiConfig } from "../../core/config/api.config";

export interface ModuleConfig {
    key: string;
    label: string;
    parentKey: string | null;
    enabled: boolean;
    icon: string | null;
    sortOrder: number;
}

@Injectable({ providedIn: "root" })
export class ModuleConfigFacade {
    readonly modules: Signal<ModuleConfig[]>;
    readonly loading: Signal<boolean>;

    private readonly _modules = signal<ModuleConfig[]>([]);
    private readonly _loading = signal(false);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly http = inject(HttpClient);
    private loaded = false;

    constructor() {
        this.modules = this._modules.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    load(): void {
        if (this.loaded) return;
        this._loading.set(true);
        this.http.get<ModuleConfig[]>(`${this.apiConfig.baseUrl}/module-config`).subscribe({
            next: (modules) => {
                this._modules.set(modules);
                this._loading.set(false);
                this.loaded = true;
            },
            error: () => {
                this._loading.set(false);
            }
        });
    }

    isEnabled(key: string): boolean {
        const modules = this._modules();
        const mod = modules.find((m) => m.key === key);
        if (!mod) return true; // Default: enabled if not configured
        if (!mod.enabled) return false;
        // Check parent
        if (mod.parentKey) {
            const parent = modules.find((m) => m.key === mod.parentKey);
            if (parent && !parent.enabled) return false;
        }
        return true;
    }

    toggle(key: string, enabled: boolean): Observable<ModuleConfig> {
        return this.http
            .patch<ModuleConfig>(`${this.apiConfig.baseUrl}/module-config/${key}`, { enabled })
            .pipe(
                tap(() => {
                    // Reload all to get cascaded changes
                    this.loaded = false;
                    this.load();
                })
            );
    }

    getChildren(parentKey: string): ModuleConfig[] {
        return this._modules().filter((m) => m.parentKey === parentKey);
    }

    getParents(): ModuleConfig[] {
        return this._modules().filter((m) => !m.parentKey);
    }
}
