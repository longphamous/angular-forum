import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketWorkflowEntity } from "./ticket-workflow.entity";

export type WorkflowStatusCategory = "todo" | "in_progress" | "done";

@Entity("ticket_workflow_statuses")
export class TicketWorkflowStatusEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "workflow_id", type: "uuid" })
    workflowId!: string;

    @ManyToOne(() => TicketWorkflowEntity, (w) => w.statuses, { onDelete: "CASCADE" })
    @JoinColumn({ name: "workflow_id" })
    workflow?: TicketWorkflowEntity;

    @Column({ length: 100 })
    name!: string;

    @Column({ length: 50 })
    slug!: string;

    @Column({ length: 20, default: "#6B7280" })
    color!: string;

    @Column({ type: "varchar", length: 20, default: "todo" })
    category!: WorkflowStatusCategory;

    @Column({ type: "int", default: 0 })
    position!: number;
}
