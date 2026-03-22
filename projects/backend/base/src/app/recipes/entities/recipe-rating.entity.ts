import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { RecipeEntity } from "./recipe.entity";

@Entity("recipe_ratings")
@Unique(["userId", "recipeId"])
export class RecipeRatingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => UserEntity)
    user!: UserEntity;

    @Column({ name: "recipe_id", type: "uuid" })
    recipeId!: string;

    @ManyToOne(() => RecipeEntity, { onDelete: "CASCADE" })
    recipe!: RecipeEntity;

    @Column({ type: "int" })
    rating!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
