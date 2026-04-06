import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { HashtagEntity } from "./hashtag.entity";

export type HashtagContentType = "post" | "thread" | "blog" | "chronik" | "lexicon";

@Entity("hashtag_usages")
@Unique(["hashtagId", "contentType", "contentId"])
export class HashtagUsageEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "hashtag_id", type: "uuid" })
    hashtagId!: string;

    @ManyToOne(() => HashtagEntity, (h) => h.usages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "hashtag_id" })
    hashtag!: HashtagEntity;

    @Column({ name: "content_type", type: "varchar", length: 20 })
    contentType!: HashtagContentType;

    @Column({ name: "content_id", type: "uuid" })
    contentId!: string;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
