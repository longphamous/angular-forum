import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { RecipeCategoryEntity } from "./recipe-category.entity";
import { RecipeCommentEntity } from "./recipe-comment.entity";

export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeStatus = "draft" | "published";

export interface RecipeIngredient {
    name: string;
    amount: string;
    unit: string;
    group?: string;
}

export interface RecipeStep {
    description: string;
    imageUrl?: string;
    order: number;
}

export interface RecipeNutrition {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
}

@Entity("recipes")
export class RecipeEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 200 })
    title!: string;

    @Column({ unique: true, length: 200 })
    slug!: string;

    @Column({ nullable: true, type: "text" })
    description!: string | null;

    @Column({ name: "category_id", nullable: true, type: "uuid" })
    categoryId!: string | null;

    @ManyToOne(() => RecipeCategoryEntity, (c) => c.recipes, { nullable: true })
    category!: RecipeCategoryEntity | null;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    author!: UserEntity;

    @Column({ name: "cover_image_url", nullable: true, type: "text" })
    coverImageUrl!: string | null;

    @Column({ nullable: true, type: "int" })
    servings!: number | null;

    @Column({ name: "prep_time", nullable: true, type: "int" })
    prepTime!: number | null;

    @Column({ name: "cook_time", nullable: true, type: "int" })
    cookTime!: number | null;

    @Column({ type: "varchar", length: 20, default: "medium" })
    difficulty!: RecipeDifficulty;

    @Column({ name: "dietary_tags", type: "jsonb", default: [] })
    dietaryTags!: string[];

    @Column({ type: "jsonb", default: [] })
    ingredients!: RecipeIngredient[];

    @Column({ type: "jsonb", default: [] })
    steps!: RecipeStep[];

    @Column({ type: "jsonb", nullable: true })
    nutrition!: RecipeNutrition | null;

    @Column({ type: "jsonb", default: [] })
    tags!: string[];

    @Column({ type: "varchar", length: 20, default: "draft" })
    status!: RecipeStatus;

    @Column({ name: "view_count", default: 0 })
    viewCount!: number;

    @Column({ name: "favorite_count", default: 0 })
    favoriteCount!: number;

    @Column({ name: "allow_comments", default: true })
    allowComments!: boolean;

    @Column({ name: "published_at", nullable: true, type: "timestamptz" })
    publishedAt!: Date | null;

    @OneToMany(() => RecipeCommentEntity, (c) => c.recipe)
    comments!: RecipeCommentEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt!: Date | null;
}
