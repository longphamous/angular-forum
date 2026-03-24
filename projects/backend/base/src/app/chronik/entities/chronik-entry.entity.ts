import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { ChronikEntryType, ChronikVisibility } from "../models/chronik.model";

@Entity("chronik_entries")
export class ChronikEntryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "author_id", type: "varchar" })
    authorId!: string;

    @Column({ type: "varchar", default: "text" })
    type!: ChronikEntryType;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "image_url", type: "text", nullable: true })
    imageUrl!: string | null;

    @Column({ name: "image_media_id", type: "uuid", nullable: true })
    imageMediaId?: string;

    @Column({ name: "link_url", type: "text", nullable: true })
    linkUrl!: string | null;

    @Column({ name: "link_title", type: "varchar", nullable: true })
    linkTitle!: string | null;

    @Column({ name: "link_description", type: "text", nullable: true })
    linkDescription!: string | null;

    @Column({ name: "link_image_url", type: "text", nullable: true })
    linkImageUrl!: string | null;

    @Column({ name: "link_domain", type: "varchar", nullable: true })
    linkDomain!: string | null;

    @Column({ type: "varchar", default: "public" })
    visibility!: ChronikVisibility;

    @Column({ name: "like_count", type: "int", default: 0 })
    likeCount!: number;

    @Column({ name: "comment_count", type: "int", default: 0 })
    commentCount!: number;

    @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "author_id" })
    author!: UserEntity;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
