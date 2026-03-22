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
import { RecipeEntity } from "./recipe.entity";

@Entity("recipe_comments")
export class RecipeCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "recipe_id", type: "uuid" })
    recipeId!: string;

    @ManyToOne(() => RecipeEntity, (r) => r.comments, { onDelete: "CASCADE" })
    recipe!: RecipeEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    author!: UserEntity;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "parent_id", nullable: true, type: "uuid" })
    parentId!: string | null;

    @ManyToOne(() => RecipeCommentEntity, (c) => c.replies, { nullable: true, onDelete: "CASCADE" })
    parent!: RecipeCommentEntity | null;

    @OneToMany(() => RecipeCommentEntity, (c) => c.parent)
    replies!: RecipeCommentEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
