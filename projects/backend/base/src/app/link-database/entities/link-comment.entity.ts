import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { LinkEntryEntity } from "./link-entry.entity";

@Entity("link_comments")
export class LinkCommentEntity {
    @PrimaryGeneratedColumn("uuid") id!: string;
    @Column({ name: "link_id", type: "uuid" }) linkId!: string;
    @ManyToOne(() => LinkEntryEntity) link!: LinkEntryEntity;
    @Column({ name: "author_id", type: "uuid" }) authorId!: string;
    @ManyToOne(() => UserEntity) author!: UserEntity;
    @Column({ type: "text" }) content!: string;
    @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
