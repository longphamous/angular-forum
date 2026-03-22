import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type ProfileApprovalType = "avatar" | "avatar_url" | "cover" | "signature";
export type ProfileApprovalStatus = "pending" | "approved" | "rejected";

@Entity("profile_approvals")
export class ProfileApprovalEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 20 })
    type!: ProfileApprovalType;

    @Column({ name: "old_value", type: "text", nullable: true })
    oldValue!: string | null;

    @Column({ name: "new_value", type: "text" })
    newValue!: string;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: ProfileApprovalStatus;

    @Column({ name: "reviewed_by", type: "uuid", nullable: true })
    reviewedBy!: string | null;

    @Column({ name: "review_note", type: "text", nullable: true })
    reviewNote!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
    reviewedAt!: Date | null;
}
