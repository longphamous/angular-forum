import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("gallery_ratings")
@Unique(["mediaId", "userId"])
export class GalleryRatingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "media_id", type: "uuid" })
    mediaId!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "int" })
    rating!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
