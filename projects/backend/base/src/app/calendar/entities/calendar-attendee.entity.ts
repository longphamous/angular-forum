import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type AttendeeStatus = "pending" | "accepted" | "declined" | "maybe";

@Entity("calendar_attendees")
export class CalendarAttendeeEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: AttendeeStatus;

    @Column({ type: "int", default: 0 })
    companions!: number;

    @Column({ name: "decline_reason", type: "text", nullable: true })
    declineReason!: string | null;

    @Column({ name: "responded_at", type: "timestamptz", nullable: true })
    respondedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
