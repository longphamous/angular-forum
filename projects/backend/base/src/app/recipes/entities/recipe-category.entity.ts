import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { RecipeEntity } from "./recipe.entity";

@Entity("recipe_categories")
export class RecipeCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ unique: true, length: 100 })
    slug!: string;

    @Column({ nullable: true, type: "text" })
    description!: string | null;

    @Column({ length: 50, default: "pi pi-folder" })
    icon!: string;

    @Column({ type: "int", default: 0 })
    position!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany(() => RecipeEntity, (r) => r.category)
    recipes!: RecipeEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
