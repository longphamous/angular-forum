import { KeyValuePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import {
    CLASS_CONFIG,
    EQUIPMENT_SLOTS,
    type AllocatePointsPayload,
    type CharacterClass,
    type EquipmentInventoryItem,
    type EquipmentSlot,
    type StatName,
    SLOT_CONFIG,
    STAT_CONFIG,
    STAT_NAMES
} from "../../../core/models/rpg/character";
import { RpgFacade } from "../../../facade/rpg/rpg-facade";

const CHARACTER_CLASSES: CharacterClass[] = ["warrior", "mage", "rogue", "ranger", "paladin"];

@Component({
    selector: "rpg-page",
    standalone: true,
    imports: [
        KeyValuePipe,
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        ToastModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: "./rpg-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        /* ── Stat bar ───────────────────────────────────────────── */
        .stat-bar-track {
            background: rgba(0, 0, 0, 0.06);
            border-radius: 999px;
            overflow: hidden;
            height: 0.5rem;
        }
        :host-context(.app-dark) .stat-bar-track {
            background: rgba(255, 255, 255, 0.08);
        }
        .stat-bar-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Equipment slot ─────────────────────────────────────── */
        .equip-slot {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            background: var(--glass-bg-subtle);
            border: 1px solid var(--glass-border);
            transition: background 0.2s;
        }
        .equip-slot:hover {
            background: var(--glass-bg);
        }
        .equip-slot-icon {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.625rem;
            font-size: 1.1rem;
        }
        .equip-slot-empty {
            border: 2px dashed var(--glass-border);
            color: var(--text-color-secondary);
        }

        /* ── Class badge ────────────────────────────────────────── */
        .class-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            border-radius: 999px;
            background: var(--glass-bg-subtle);
            border: 1px solid var(--glass-border);
            font-size: 0.75rem;
            font-weight: 600;
        }

        /* ── Point allocator ────────────────────────────────────── */
        .point-btn {
            width: 1.75rem;
            height: 1.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            border: 1px solid var(--glass-border);
            background: var(--glass-bg-subtle);
            color: var(--text-color);
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 700;
            transition: background 0.15s;
        }
        .point-btn:hover:not(:disabled) {
            background: var(--glass-bg);
        }
        .point-btn:disabled {
            opacity: 0.3;
            cursor: default;
        }

        /* ── Rarity colors ──────────────────────────────────────── */
        .rarity-common {
            color: var(--text-color-secondary);
        }
        .rarity-uncommon {
            color: #22c55e;
        }
        .rarity-rare {
            color: #3b82f6;
        }
        .rarity-epic {
            color: #a855f7;
        }
        .rarity-legendary {
            color: #f59e0b;
        }

        /* ── Drag & Drop ───────────────────────────────────────── */
        .inv-draggable {
            cursor: grab;
            user-select: none;
        }
        .inv-draggable:active {
            cursor: grabbing;
        }
        .inv-dragging {
            opacity: 0.4;
            transform: scale(0.95);
        }
        .equip-slot-drop-target {
            border: 2px dashed var(--primary-color) !important;
            background: color-mix(in srgb, var(--primary-color) 8%, transparent) !important;
            transition:
                border 0.15s,
                background 0.15s;
        }
        .equip-slot-drop-invalid {
            border: 2px dashed #ef4444 !important;
            background: rgba(239, 68, 68, 0.06) !important;
        }
    `
})
export class RpgPage implements OnInit {
    readonly facade = inject(RpgFacade);
    private readonly messageService = inject(MessageService);
    private readonly transloco = inject(TranslocoService);

    readonly statNames = STAT_NAMES;
    readonly statConfig = STAT_CONFIG;
    readonly classConfig = CLASS_CONFIG;
    readonly slotConfig = SLOT_CONFIG;
    readonly equipmentSlots = EQUIPMENT_SLOTS;
    readonly classOptions = CHARACTER_CLASSES;

    // ── Character creation form ──────────────────────────────────────────
    readonly showCreate = signal(false);
    charName = "";
    charClass: CharacterClass = "warrior";

    // ── Point allocation (pending, not yet committed) ────────────────────
    readonly pendingPoints = signal<Record<StatName, number>>({
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        charisma: 0,
        endurance: 0,
        luck: 0
    });

    readonly totalPending = computed(() => Object.values(this.pendingPoints()).reduce((s, v) => s + v, 0));

    readonly remainingPoints = computed(() => {
        const char = this.facade.character();
        return (char?.unspentPoints ?? 0) - this.totalPending();
    });

    readonly showInventory = signal(false);

    readonly inventoryForSlot = computed(() => {
        const slot = this.selectedSlot();
        if (!slot) return this.facade.equipmentInventory();
        return this.facade.equipmentInventory().filter((i) => i.item.equipmentSlot === slot);
    });

    readonly selectedSlot = signal<EquipmentSlot | null>(null);

    ngOnInit(): void {
        this.facade.loadMyCharacter();
        this.facade.loadEquipmentInventory();
    }

    statPercent(value: number): number {
        return Math.min(100, (value / 50) * 100);
    }

    statBarColor(stat: StatName): string {
        const colors: Record<StatName, string> = {
            strength: "#ef4444",
            dexterity: "#22c55e",
            intelligence: "#3b82f6",
            charisma: "#ec4899",
            endurance: "#f59e0b",
            luck: "#a855f7"
        };
        return colors[stat];
    }

    addPoint(stat: StatName): void {
        if (this.remainingPoints() <= 0) return;
        const current = { ...this.pendingPoints() };
        current[stat]++;
        this.pendingPoints.set(current);
    }

    removePoint(stat: StatName): void {
        const current = { ...this.pendingPoints() };
        if (current[stat] <= 0) return;
        current[stat]--;
        this.pendingPoints.set(current);
    }

    commitPoints(): void {
        const payload: AllocatePointsPayload = {};
        for (const stat of STAT_NAMES) {
            const val = this.pendingPoints()[stat];
            if (val > 0) payload[stat] = val;
        }
        this.facade.allocatePoints(payload).subscribe(() => {
            this.pendingPoints.set({
                strength: 0,
                dexterity: 0,
                intelligence: 0,
                charisma: 0,
                endurance: 0,
                luck: 0
            });
        });
    }

    createCharacter(): void {
        if (!this.charName.trim()) return;
        this.facade.createOrUpdate({ name: this.charName.trim(), characterClass: this.charClass }).subscribe(() => {
            this.showCreate.set(false);
        });
    }

    unequip(slot: EquipmentSlot): void {
        this.facade.unequipSlot(slot).subscribe({
            error: (err: HttpErrorResponse) => {
                const msg = err.error?.message;
                this.messageService.add({
                    severity: "error",
                    summary: this.transloco.translate("rpg.unequipFailed"),
                    detail: msg && /requires level/i.test(msg)
                        ? this.transloco.translate("rpg.equipLevelRequired", { level: msg.match(/\d+/)?.[0] ?? "?" })
                        : this.transloco.translate("rpg.unequipError")
                });
            }
        });
    }

    openInventoryForSlot(slot: EquipmentSlot): void {
        this.selectedSlot.set(slot);
        this.showInventory.set(true);
    }

    openFullInventory(): void {
        this.selectedSlot.set(null);
        this.showInventory.set(true);
    }

    canEquip(invItem: EquipmentInventoryItem): boolean {
        const requiredLevel = invItem.item.requiredLevel;
        if (!requiredLevel) return true;
        return (this.facade.character()?.level ?? 0) >= requiredLevel;
    }

    equipFromInventory(invItem: EquipmentInventoryItem): void {
        this.facade.equipItem(invItem.inventoryId).subscribe({
            next: () => {
                this.showInventory.set(false);
            },
            error: (err: HttpErrorResponse) => {
                const msg = err.error?.message;
                this.messageService.add({
                    severity: "error",
                    summary: this.transloco.translate("rpg.equipFailed"),
                    detail: msg && /requires level/i.test(msg)
                        ? this.transloco.translate("rpg.equipLevelRequired", { level: msg.match(/\d+/)?.[0] ?? "?" })
                        : this.transloco.translate("rpg.equipError")
                });
            }
        });
    }

    isEquippedItem(invItem: EquipmentInventoryItem): boolean {
        return this.facade.character()?.equipment.some((e) => e.inventoryId === invItem.inventoryId) ?? false;
    }

    // ── Drag & Drop ──────────────────────────────────────────────────────

    readonly draggingItem = signal<EquipmentInventoryItem | null>(null);
    readonly dragOverSlot = signal<EquipmentSlot | null>(null);

    onDragStart(event: DragEvent, invItem: EquipmentInventoryItem): void {
        this.draggingItem.set(invItem);
        event.dataTransfer?.setData("text/plain", invItem.inventoryId);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
        }
    }

    onDragEnd(): void {
        this.draggingItem.set(null);
        this.dragOverSlot.set(null);
    }

    onSlotDragOver(event: DragEvent, slot: EquipmentSlot): void {
        event.preventDefault();
        if (event.dataTransfer) {
            const item = this.draggingItem();
            event.dataTransfer.dropEffect = item?.item.equipmentSlot === slot ? "move" : "none";
        }
        this.dragOverSlot.set(slot);
    }

    onSlotDragLeave(): void {
        this.dragOverSlot.set(null);
    }

    onSlotDrop(event: DragEvent, slot: EquipmentSlot): void {
        event.preventDefault();
        this.dragOverSlot.set(null);
        const item = this.draggingItem();
        if (!item || item.item.equipmentSlot !== slot) return;
        this.draggingItem.set(null);
        if (!this.canEquip(item)) {
            this.messageService.add({
                severity: "error",
                summary: this.transloco.translate("rpg.equipFailed"),
                detail: this.transloco.translate("rpg.equipLevelRequired", { level: item.item.requiredLevel ?? "?" })
            });
            return;
        }
        this.equipFromInventory(item);
    }

    isSlotCompatible(slot: EquipmentSlot): boolean {
        const item = this.draggingItem();
        return !!item && item.item.equipmentSlot === slot;
    }

    slotDropClass(slot: EquipmentSlot): string {
        if (!this.draggingItem()) return "";
        if (this.dragOverSlot() !== slot) return "";
        return this.isSlotCompatible(slot) ? "equip-slot-drop-target" : "equip-slot-drop-invalid";
    }

    getEquipped(slot: EquipmentSlot) {
        return this.facade.character()?.equipment.find((e) => e.slot === slot) ?? null;
    }

    rarityClass(rarity: string | null): string {
        switch (rarity) {
            case "uncommon":
                return "rarity-uncommon";
            case "rare":
                return "rarity-rare";
            case "epic":
                return "rarity-epic";
            case "legendary":
                return "rarity-legendary";
            default:
                return "rarity-common";
        }
    }
}
