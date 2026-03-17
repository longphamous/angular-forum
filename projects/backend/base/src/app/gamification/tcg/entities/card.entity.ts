import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("tcg_cards")
export class CardEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ name: "image_url", type: "text", nullable: true })
    imageUrl!: string | null;

    @Column({ type: "varchar", length: 20 })
    rarity!: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

    @Column({ length: 100 })
    series!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    element!: "fire" | "water" | "earth" | "wind" | "light" | "dark" | "neutral" | null;

    @Column({ type: "int", default: 0 })
    attack!: number;

    @Column({ type: "int", default: 0 })
    defense!: number;

    @Column({ type: "int", default: 0 })
    hp!: number;

    @Column({ type: "varchar", name: "artist_credit", length: 100, nullable: true })
    artistCredit!: string | null;

    @Column({ name: "flavor_text", type: "text", nullable: true })
    flavorText!: string | null;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
