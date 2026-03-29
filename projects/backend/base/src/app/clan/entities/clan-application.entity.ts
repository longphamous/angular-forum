import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { ClanEntity } from "./clan.entity";

export type ClanApplicationType = "application" | "invitation";
export type ClanApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

@Entity("clan_applications")
export class ClanApplicationEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clan_id", type: "uuid" })
    clanId!: string;

    @ManyToOne(() => ClanEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "clan_id" })
    clan!: ClanEntity;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "invited_by_id", type: "uuid", nullable: true })
    invitedById?: string;

    @Column({ type: "varchar", length: 20, default: "application" })
    type!: ClanApplicationType;

    @Column({ type: "text", nullable: true })
    message?: string;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: ClanApplicationStatus;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
