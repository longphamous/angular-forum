import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { ClanCategoryEntity } from "./clan-category.entity";
import { ClanCommentEntity } from "./clan-comment.entity";
import { ClanMemberEntity } from "./clan-member.entity";
import { ClanPageEntity } from "./clan-page.entity";

export type ClanJoinType = "open" | "invite" | "application" | "moderated";
export type ClanStatus = "active" | "inactive" | "disbanded";

@Entity("clans")
export class ClanEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "category_id", type: "uuid", nullable: true })
    categoryId?: string;

    @ManyToOne(() => ClanCategoryEntity, (c) => c.clans, { onDelete: "SET NULL" })
    @JoinColumn({ name: "category_id" })
    category?: ClanCategoryEntity;

    @Column({ length: 200 })
    name!: string;

    @Column({ type: "varchar", length: 200, unique: true })
    slug!: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    tag?: string;

    @Column({ name: "tag_color", type: "varchar", length: 20, default: "#3B82F6" })
    tagColor!: string;

    @Column({ name: "tag_brackets", type: "varchar", length: 10, default: "[]" })
    tagBrackets!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ name: "avatar_url", type: "varchar", length: 500, nullable: true })
    avatarUrl?: string;

    @Column({ name: "banner_url", type: "varchar", length: 500, nullable: true })
    bannerUrl?: string;

    @Column({ name: "owner_id", type: "uuid" })
    ownerId!: string;

    @Column({ name: "join_type", type: "varchar", length: 20, default: "open" })
    joinType!: ClanJoinType;

    @Column({ name: "member_count", type: "int", default: 1 })
    memberCount!: number;

    @Column({ name: "show_activity", default: true })
    showActivity!: boolean;

    @Column({ name: "show_members", default: true })
    showMembers!: boolean;

    @Column({ name: "show_comments", default: true })
    showComments!: boolean;

    @Column({ name: "application_template", type: "text", nullable: true })
    applicationTemplate?: string;

    @Column({ name: "custom_fields", type: "jsonb", nullable: true })
    customFields?: Record<string, unknown>;

    @Column({ type: "varchar", length: 20, default: "active" })
    status!: ClanStatus;

    // ── Relations ──────────────────────────────────────────────────────────────

    @OneToMany(() => ClanMemberEntity, (m) => m.clan)
    members?: ClanMemberEntity[];

    @OneToMany(() => ClanPageEntity, (p) => p.clan)
    pages?: ClanPageEntity[];

    @OneToMany(() => ClanCommentEntity, (c) => c.clan)
    comments?: ClanCommentEntity[];

    // ── Timestamps ─────────────────────────────────────────────────────────────

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
