import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export interface RecurrenceRule {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    until?: string | null;
    count?: number | null;
    byDay?: string[];
}

@Entity("calendar_events")
export class CalendarEventEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    location!: string | null;

    @Column({ name: "start_date", type: "timestamptz" })
    startDate!: Date;

    @Column({ name: "end_date", type: "timestamptz" })
    endDate!: Date;

    @Column({ name: "all_day", type: "boolean", default: false })
    allDay!: boolean;

    @Column({ name: "is_public", type: "boolean", default: true })
    isPublic!: boolean;

    @Column({ name: "max_attendees", type: "int", nullable: true })
    maxAttendees!: number | null;

    @Column({ name: "created_by_user_id", type: "uuid" })
    createdByUserId!: string;

    @Column({ name: "thread_id", type: "uuid", nullable: true })
    threadId!: string | null;

    @Column({ name: "recurrence_rule", type: "jsonb", nullable: true })
    recurrenceRule!: RecurrenceRule | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    color!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
