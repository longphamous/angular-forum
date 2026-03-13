import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable } from "rxjs";

import { GROUP_ROUTES, PAGE_PERMISSION_ROUTES } from "../../core/api/group.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { Group, PagePermission } from "../../core/models/group/group";
import { UserProfile } from "../../core/models/user/user";

export interface CreateGroupPayload {
    description?: string;
    name: string;
}

export interface UpdateGroupPayload {
    description?: string;
    name?: string;
}

export interface CreatePagePermissionPayload {
    groupIds?: string[];
    name: string;
    route: string;
}

@Injectable({ providedIn: "root" })
export class GroupFacade {
    readonly groups: Signal<Group[]>;
    readonly groupsLoading: Signal<boolean>;
    readonly groupsError: Signal<string | null>;
    readonly pagePermissions: Signal<PagePermission[]>;
    readonly pagePermissionsLoading: Signal<boolean>;

    private readonly _groups = signal<Group[]>([]);
    private readonly _groupsLoading = signal(false);
    private readonly _groupsError = signal<string | null>(null);
    private readonly _pagePermissions = signal<PagePermission[]>([]);
    private readonly _pagePermissionsLoading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.groups = this._groups.asReadonly();
        this.groupsLoading = this._groupsLoading.asReadonly();
        this.groupsError = this._groupsError.asReadonly();
        this.pagePermissions = this._pagePermissions.asReadonly();
        this.pagePermissionsLoading = this._pagePermissionsLoading.asReadonly();
    }

    // ── Groups ────────────────────────────────────────────────────────────────

    loadGroups(): void {
        this._groupsLoading.set(true);
        this._groupsError.set(null);
        this.http.get<Group[]>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.list()}`).subscribe({
            next: (groups) => {
                this._groups.set(groups);
                this._groupsLoading.set(false);
            },
            error: () => {
                this._groupsError.set("Fehler beim Laden der Gruppen.");
                this._groupsLoading.set(false);
            }
        });
    }

    createGroup(payload: CreateGroupPayload): Observable<Group> {
        return this.http.post<Group>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.list()}`, payload);
    }

    updateGroup(id: string, payload: UpdateGroupPayload): Observable<Group> {
        return this.http.patch<Group>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.detail(id)}`, payload);
    }

    deleteGroup(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.detail(id)}`);
    }

    setGroupUsers(groupId: string, userIds: string[]): Observable<Group> {
        return this.http.put<Group>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.users(groupId)}`, { userIds });
    }

    setUserGroups(userId: string, groupIds: string[]): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.userGroups(userId)}`, { groupIds });
    }

    getUsersInGroup(groupId: string): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.apiConfig.baseUrl}${GROUP_ROUTES.users(groupId)}`);
    }

    updateGroupLocally(group: Group): void {
        this._groups.update((list) => {
            const idx = list.findIndex((g) => g.id === group.id);
            if (idx >= 0) {
                const updated = [...list];
                updated[idx] = group;
                return updated;
            }
            return [group, ...list];
        });
    }

    removeGroupLocally(id: string): void {
        this._groups.update((list) => list.filter((g) => g.id !== id));
    }

    // ── Page Permissions ──────────────────────────────────────────────────────

    loadPagePermissions(): void {
        this._pagePermissionsLoading.set(true);
        this.http.get<PagePermission[]>(`${this.apiConfig.baseUrl}${PAGE_PERMISSION_ROUTES.list()}`).subscribe({
            next: (perms) => {
                this._pagePermissions.set(perms);
                this._pagePermissionsLoading.set(false);
            },
            error: () => {
                this._pagePermissionsLoading.set(false);
            }
        });
    }

    setPermissionGroups(permId: string, groupIds: string[]): Observable<PagePermission> {
        return this.http.put<PagePermission>(
            `${this.apiConfig.baseUrl}${PAGE_PERMISSION_ROUTES.groups(permId)}`,
            { groupIds }
        );
    }

    createPagePermission(payload: CreatePagePermissionPayload): Observable<PagePermission> {
        return this.http.post<PagePermission>(`${this.apiConfig.baseUrl}${PAGE_PERMISSION_ROUTES.list()}`, payload);
    }

    deletePagePermission(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${PAGE_PERMISSION_ROUTES.detail(id)}`);
    }

    updatePagePermissionLocally(perm: PagePermission): void {
        this._pagePermissions.update((list) => {
            const idx = list.findIndex((p) => p.id === perm.id);
            if (idx >= 0) {
                const updated = [...list];
                updated[idx] = perm;
                return updated;
            }
            return [...list, perm];
        });
    }
}
