import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("market_comments")
export class MarketCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "listing_id", type: "uuid" })
    listingId!: string;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "parent_id", type: "uuid", nullable: true })
    parentId!: string | null;

    @Column({ name: "is_edited", type: "boolean", default: false })
    isEdited!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
