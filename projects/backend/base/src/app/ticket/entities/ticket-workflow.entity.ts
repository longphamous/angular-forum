import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { TicketProjectEntity } from "./ticket-project.entity";
import { TicketWorkflowStatusEntity } from "./ticket-workflow-status.entity";
import { TicketWorkflowTransitionEntity } from "./ticket-workflow-transition.entity";

@Entity("ticket_workflows")
export class TicketWorkflowEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid", nullable: true })
    projectId?: string;

    @ManyToOne(() => TicketProjectEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @Column({ length: 200 })
    name!: string;

    @Column({ name: "is_default", default: false })
    isDefault!: boolean;

    @OneToMany(() => TicketWorkflowStatusEntity, (s) => s.workflow, { cascade: true })
    statuses?: TicketWorkflowStatusEntity[];

    @OneToMany(() => TicketWorkflowTransitionEntity, (t) => t.workflow, { cascade: true })
    transitions?: TicketWorkflowTransitionEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
