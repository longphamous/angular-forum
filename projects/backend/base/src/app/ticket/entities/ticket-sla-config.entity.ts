import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { TicketProjectEntity } from "./ticket-project.entity";

@Entity("ticket_sla_configs")
export class TicketSlaConfigEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId!: string;

    @ManyToOne(() => TicketProjectEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @Column({ type: "varchar", length: 20 })
    priority!: string;

    @Column({ name: "first_response_hours", type: "int", default: 24 })
    firstResponseHours!: number;

    @Column({ name: "resolution_hours", type: "int", default: 72 })
    resolutionHours!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
