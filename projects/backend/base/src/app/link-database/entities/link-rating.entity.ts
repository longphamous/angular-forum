import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { LinkEntryEntity } from "./link-entry.entity";

@Entity("link_ratings")
export class LinkRatingEntity {
    @PrimaryGeneratedColumn("uuid") id!: string;
    @Column({ name: "link_id", type: "uuid" }) linkId!: string;
    @ManyToOne(() => LinkEntryEntity) link!: LinkEntryEntity;
    @Column({ name: "user_id", type: "uuid" }) userId!: string;
    @ManyToOne(() => UserEntity) user!: UserEntity;
    @Column({ type: "integer" }) score!: number;
    @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
