import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export type CharacterClass = "warrior" | "mage" | "rogue" | "ranger" | "paladin";
export type EquipmentSlot = "head" | "chest" | "legs" | "feet" | "weapon" | "shield" | "accessory";

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ["head", "chest", "legs", "feet", "weapon", "shield", "accessory"];

export const STAT_NAMES = ["strength", "dexterity", "intelligence", "charisma", "endurance", "luck"] as const;
export type StatName = (typeof STAT_NAMES)[number];

/** Points awarded per level-up */
export const POINTS_PER_LEVEL = 3;

@Entity("user_characters")
export class UserCharacterEntity {
    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 50 })
    name!: string;

    @Column({ name: "character_class", type: "varchar", length: 20, default: "warrior" })
    characterClass!: CharacterClass;

    // ── Base stats (allocated by user) ────────────────────────────────────────

    @Column({ type: "int", default: 1 })
    strength!: number;

    @Column({ type: "int", default: 1 })
    dexterity!: number;

    @Column({ type: "int", default: 1 })
    intelligence!: number;

    @Column({ type: "int", default: 1 })
    charisma!: number;

    @Column({ type: "int", default: 1 })
    endurance!: number;

    @Column({ type: "int", default: 1 })
    luck!: number;

    // ── Unspent attribute points ──────────────────────────────────────────────

    @Column({ name: "unspent_points", type: "int", default: 0 })
    unspentPoints!: number;

    @Column({ type: "int", default: 0 })
    glory!: number;

    // ── Equipment (inventory item IDs per slot, nullable) ─────────────────────

    @Column({ name: "slot_head", type: "uuid", nullable: true })
    slotHead!: string | null;

    @Column({ name: "slot_chest", type: "uuid", nullable: true })
    slotChest!: string | null;

    @Column({ name: "slot_legs", type: "uuid", nullable: true })
    slotLegs!: string | null;

    @Column({ name: "slot_feet", type: "uuid", nullable: true })
    slotFeet!: string | null;

    @Column({ name: "slot_weapon", type: "uuid", nullable: true })
    slotWeapon!: string | null;

    @Column({ name: "slot_shield", type: "uuid", nullable: true })
    slotShield!: string | null;

    @Column({ name: "slot_accessory", type: "uuid", nullable: true })
    slotAccessory!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
