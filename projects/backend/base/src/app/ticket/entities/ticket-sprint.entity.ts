import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { TicketProjectEntity } from "./ticket-project.entity";
import { TicketEntity } from "./ticket.entity";

export type SprintStatus = "planning" | "active" | "completed";

@Entity("ticket_sprints")
export class TicketSprintEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId!: string;

    @ManyToOne(() => TicketProjectEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @Column({ length: 200 })
    name!: string;

    @Column({ type: "text", nullable: true })
    goal?: string;

    @Column({ type: "varchar", length: 20, default: "planning" })
    status!: SprintStatus;

    @Column({ name: "start_date", type: "date", nullable: true })
    startDate?: Date;

    @Column({ name: "end_date", type: "date", nullable: true })
    endDate?: Date;

    @Column({ name: "completed_at", type: "timestamptz", nullable: true })
    completedAt?: Date;

    @OneToMany(() => TicketEntity, (t) => t.sprint)
    tickets?: TicketEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
