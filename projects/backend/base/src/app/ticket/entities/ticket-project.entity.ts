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

import { TicketEntity } from "./ticket.entity";
import { TicketWorkflowEntity } from "./ticket-workflow.entity";

export type ProjectStatus = "active" | "archived" | "completed";

@Entity("ticket_projects")
export class TicketProjectEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 200 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ type: "varchar", length: 20, default: "active" })
    status!: ProjectStatus;

    @Column({ name: "owner_id", type: "uuid" })
    ownerId!: string;

    @Column({ name: "start_date", type: "date", nullable: true })
    startDate?: Date;

    @Column({ name: "end_date", type: "date", nullable: true })
    endDate?: Date;

    @Column({ name: "workflow_id", type: "uuid", nullable: true })
    workflowId?: string;

    @ManyToOne(() => TicketWorkflowEntity, { onDelete: "SET NULL" })
    @JoinColumn({ name: "workflow_id" })
    workflow?: TicketWorkflowEntity;

    @OneToMany(() => TicketEntity, (t) => t.project)
    tickets?: TicketEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
