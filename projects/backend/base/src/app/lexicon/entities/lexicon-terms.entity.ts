import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("lexicon_terms")
export class LexiconTermsEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true, length: 5 })
    language!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "updated_by", type: "uuid" })
    updatedBy!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
