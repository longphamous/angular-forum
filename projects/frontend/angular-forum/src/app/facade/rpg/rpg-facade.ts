import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { RPG_ROUTES } from "../../core/api/rpg.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type {
    AllocatePointsPayload,
    Character,
    CreateCharacterPayload,
    EquipmentInventoryItem
} from "../../core/models/rpg/character";

@Injectable({ providedIn: "root" })
export class RpgFacade {
    readonly character: Signal<Character | null>;
    readonly equipmentInventory: Signal<EquipmentInventoryItem[]>;
    readonly loading: Signal<boolean>;

    private readonly _character = signal<Character | null>(null);
    private readonly _equipmentInventory = signal<EquipmentInventoryItem[]>([]);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.character = this._character.asReadonly();
        this.equipmentInventory = this._equipmentInventory.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadMyCharacter(): void {
        this._loading.set(true);
        this.http.get<Character>(`${this.apiConfig.baseUrl}${RPG_ROUTES.myCharacter()}`).subscribe({
            next: (c) => {
                this._character.set(c);
                this._loading.set(false);
            },
            error: () => {
                this._character.set(null);
                this._loading.set(false);
            }
        });
    }

    loadCharacter(userId: string): void {
        this._loading.set(true);
        this.http.get<Character>(`${this.apiConfig.baseUrl}${RPG_ROUTES.character(userId)}`).subscribe({
            next: (c) => {
                this._character.set(c);
                this._loading.set(false);
            },
            error: () => {
                this._character.set(null);
                this._loading.set(false);
            }
        });
    }

    createOrUpdate(payload: CreateCharacterPayload): Observable<Character> {
        return this.http
            .post<Character>(`${this.apiConfig.baseUrl}${RPG_ROUTES.createOrUpdate()}`, payload)
            .pipe(tap((c) => this._character.set(c)));
    }

    allocatePoints(payload: AllocatePointsPayload): Observable<Character> {
        return this.http
            .patch<Character>(`${this.apiConfig.baseUrl}${RPG_ROUTES.allocatePoints()}`, payload)
            .pipe(tap((c) => this._character.set(c)));
    }

    loadEquipmentInventory(): void {
        this.http
            .get<EquipmentInventoryItem[]>(`${this.apiConfig.baseUrl}${RPG_ROUTES.equipmentInventory()}`)
            .subscribe({
                next: (items) => this._equipmentInventory.set(items),
                error: () => this._equipmentInventory.set([])
            });
    }

    equipItem(inventoryId: string): Observable<Character> {
        return this.http.post<Character>(`${this.apiConfig.baseUrl}${RPG_ROUTES.equip(inventoryId)}`, {}).pipe(
            tap((c) => {
                this._character.set(c);
                this.loadEquipmentInventory();
            })
        );
    }

    unequipSlot(slot: string): Observable<Character> {
        return this.http
            .delete<Character>(`${this.apiConfig.baseUrl}${RPG_ROUTES.unequip(slot)}`)
            .pipe(tap((c) => this._character.set(c)));
    }
}
