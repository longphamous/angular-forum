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

@Entity("clan_comments")
export class ClanCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clan_id", type: "uuid" })
    clanId!: string;

    @ManyToOne(() => ClanEntity, (c) => c.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "clan_id" })
    clan!: ClanEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ type: "text" })
    content!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
