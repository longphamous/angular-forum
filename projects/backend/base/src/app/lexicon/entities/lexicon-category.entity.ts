import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

export interface LexiconCustomFieldDefinition {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "boolean" | "url";
    required: boolean;
    options?: string[];
    validationPattern?: string;
}

@Entity("lexicon_categories")
export class LexiconCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ unique: true, length: 100 })
    slug!: string;

    @Column({ nullable: true, type: "text" })
    description!: string | null;

    @Column({ name: "parent_id", nullable: true, type: "uuid" })
    parentId!: string | null;

    @ManyToOne(() => LexiconCategoryEntity, (c) => c.children, { nullable: true })
    parent!: LexiconCategoryEntity | null;

    @OneToMany(() => LexiconCategoryEntity, (c) => c.parent)
    children!: LexiconCategoryEntity[];

    @Column({ default: 0 })
    position!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @Column({ name: "custom_fields", type: "jsonb", default: [] })
    customFields!: LexiconCustomFieldDefinition[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
