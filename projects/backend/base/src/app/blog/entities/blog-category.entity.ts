import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { BlogPostEntity } from "./blog-post.entity";

@Entity("blog_categories")
export class BlogCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true, length: 100 })
    name!: string;

    @Column({ unique: true, length: 100 })
    slug!: string;

    @Column({ nullable: true, type: "text" })
    description!: string | null;

    @Column({ nullable: true, type: "varchar", length: 20 })
    color!: string | null;

    @OneToMany(() => BlogPostEntity, (p) => p.category)
    posts!: BlogPostEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
