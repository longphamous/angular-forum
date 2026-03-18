import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

@Entity("market_reports")
export class MarketReportEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "listing_id", type: "uuid" })
    listingId!: string;

    @Column({ name: "reporter_id", type: "uuid" })
    reporterId!: string;

    @Column({ type: "text" })
    reason!: string;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: ReportStatus;

    @Column({ name: "moderator_note", type: "text", nullable: true })
    moderatorNote!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
