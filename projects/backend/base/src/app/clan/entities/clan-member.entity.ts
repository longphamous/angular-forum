import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { ClanEntity } from "./clan.entity";

export type ClanMemberRole = "owner" | "admin" | "moderator" | "member";

@Entity("clan_members")
export class ClanMemberEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clan_id", type: "uuid" })
    clanId!: string;

    @ManyToOne(() => ClanEntity, (c) => c.members, { onDelete: "CASCADE" })
    @JoinColumn({ name: "clan_id" })
    clan!: ClanEntity;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 20, default: "member" })
    role!: ClanMemberRole;

    @CreateDateColumn({ name: "joined_at", type: "timestamptz" })
    joinedAt!: Date;
}
