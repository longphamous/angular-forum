import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketWorkflowEntity } from "./ticket-workflow.entity";
import { TicketWorkflowStatusEntity } from "./ticket-workflow-status.entity";

@Entity("ticket_workflow_transitions")
export class TicketWorkflowTransitionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "workflow_id", type: "uuid" })
    workflowId!: string;

    @ManyToOne(() => TicketWorkflowEntity, (w) => w.transitions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "workflow_id" })
    workflow?: TicketWorkflowEntity;

    @Column({ name: "from_status_id", type: "uuid" })
    fromStatusId!: string;

    @ManyToOne(() => TicketWorkflowStatusEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "from_status_id" })
    fromStatus?: TicketWorkflowStatusEntity;

    @Column({ name: "to_status_id", type: "uuid" })
    toStatusId!: string;

    @ManyToOne(() => TicketWorkflowStatusEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "to_status_id" })
    toStatus?: TicketWorkflowStatusEntity;

    @Column({ length: 100, nullable: true })
    name?: string;
}
