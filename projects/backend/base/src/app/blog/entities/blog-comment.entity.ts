import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { BlogPostEntity } from "./blog-post.entity";

@Entity("blog_comments")
export class BlogCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "post_id", type: "uuid" })
    postId!: string;

    @ManyToOne(() => BlogPostEntity, (p) => p.comments, { onDelete: "CASCADE" })
    post!: BlogPostEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    author!: UserEntity;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "parent_id", nullable: true, type: "uuid" })
    parentId!: string | null;

    @ManyToOne(() => BlogCommentEntity, (c) => c.replies, { nullable: true, onDelete: "CASCADE" })
    parent!: BlogCommentEntity | null;

    @OneToMany(() => BlogCommentEntity, (c) => c.parent)
    replies!: BlogCommentEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
