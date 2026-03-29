import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { TicketCategoryEntity } from "./ticket-category.entity";
import { TicketCommentEntity } from "./ticket-comment.entity";
import { TicketLabelEntity } from "./ticket-label.entity";
import { TicketProjectEntity } from "./ticket-project.entity";
import { TicketSprintEntity } from "./ticket-sprint.entity";
import { TicketWorkflowStatusEntity } from "./ticket-workflow-status.entity";

export type TicketStatus = "open" | "in_progress" | "waiting" | "follow_up" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "critical";
export type TicketType = "epic" | "story" | "bug" | "task" | "sub_task" | "support" | "feature";

@Entity("tickets")
export class TicketEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    /** Human-readable ticket number, auto-incremented per project */
    @Column({ name: "ticket_number", type: "int" })
    ticketNumber!: number;

    @Column({ length: 300 })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "varchar", length: 20, default: "open" })
    status!: TicketStatus;

    @Column({ type: "varchar", length: 20, default: "normal" })
    priority!: TicketPriority;

    @Column({ type: "varchar", length: 20, default: "support" })
    type!: TicketType;

    // ── Hierarchy ─────────────────────────────────────────────────────────────

    @Column({ name: "parent_id", type: "uuid", nullable: true })
    parentId?: string;

    @ManyToOne(() => TicketEntity, (t) => t.children, { onDelete: "SET NULL" })
    @JoinColumn({ name: "parent_id" })
    parent?: TicketEntity;

    @OneToMany(() => TicketEntity, (t) => t.parent)
    children?: TicketEntity[];

    @Column({ name: "story_points", type: "int", nullable: true })
    storyPoints?: number;

    // ── Relations ──────────────────────────────────────────────────────────────

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ name: "assignee_id", type: "uuid", nullable: true })
    assigneeId?: string;

    @Column({ name: "category_id", type: "uuid", nullable: true })
    categoryId?: string;

    @ManyToOne(() => TicketCategoryEntity, (c) => c.tickets, { onDelete: "SET NULL" })
    @JoinColumn({ name: "category_id" })
    category?: TicketCategoryEntity;

    @Column({ name: "project_id", type: "uuid", nullable: true })
    projectId?: string;

    @ManyToOne(() => TicketProjectEntity, (p) => p.tickets, { onDelete: "SET NULL" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @ManyToMany(() => TicketLabelEntity, { eager: false })
    @JoinTable({
        name: "ticket_label_assignments",
        joinColumn: { name: "ticket_id" },
        inverseJoinColumn: { name: "label_id" }
    })
    labels?: TicketLabelEntity[];

    @OneToMany(() => TicketCommentEntity, (c) => c.ticket)
    comments?: TicketCommentEntity[];

    // ── Workflow ─────────────────────────────────────────────────────────────

    @Column({ name: "workflow_status_id", type: "uuid", nullable: true })
    workflowStatusId?: string;

    @ManyToOne(() => TicketWorkflowStatusEntity, { onDelete: "SET NULL" })
    @JoinColumn({ name: "workflow_status_id" })
    workflowStatus?: TicketWorkflowStatusEntity;

    // ── Sprint ───────────────────────────────────────────────────────────────

    @Column({ name: "sprint_id", type: "uuid", nullable: true })
    sprintId?: string;

    @ManyToOne(() => TicketSprintEntity, (s) => s.tickets, { onDelete: "SET NULL" })
    @JoinColumn({ name: "sprint_id" })
    sprint?: TicketSprintEntity;

    @Column({ name: "backlog_position", type: "int", nullable: true })
    backlogPosition?: number;

    // ── Scheduling / Follow-Up ─────────────────────────────────────────────────

    @Column({ name: "due_date", type: "timestamptz", nullable: true })
    dueDate?: Date;

    @Column({ name: "follow_up_date", type: "timestamptz", nullable: true })
    followUpDate?: Date;

    @Column({ name: "is_pinned", default: false })
    isPinned!: boolean;

    // ── Rating ─────────────────────────────────────────────────────────────────

    @Column({ type: "int", nullable: true })
    rating?: number;

    @Column({ name: "rating_comment", type: "text", nullable: true })
    ratingComment?: string;

    // ── Custom fields ──────────────────────────────────────────────────────────

    @Column({ name: "custom_fields", type: "jsonb", nullable: true })
    customFields?: Record<string, unknown>;

    // ── Time Tracking ────────────────────────────────────────────────────────

    @Column({ name: "original_estimate_minutes", type: "int", nullable: true })
    originalEstimateMinutes?: number;

    @Column({ name: "remaining_estimate_minutes", type: "int", nullable: true })
    remainingEstimateMinutes?: number;

    @Column({ name: "time_spent_minutes", type: "int", default: 0 })
    timeSpentMinutes!: number;

    // ── Metadata ───────────────────────────────────────────────────────────────

    @Column({ name: "first_response_at", type: "timestamptz", nullable: true })
    firstResponseAt?: Date;

    @Column({ name: "comment_count", type: "int", default: 0 })
    commentCount!: number;

    @Column({ name: "resolved_at", type: "timestamptz", nullable: true })
    resolvedAt?: Date;

    @Column({ name: "closed_at", type: "timestamptz", nullable: true })
    closedAt?: Date;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt?: Date;
}
