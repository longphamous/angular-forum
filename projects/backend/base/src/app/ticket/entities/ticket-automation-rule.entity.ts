import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { TicketProjectEntity } from "./ticket-project.entity";

export type AutomationTriggerType = "status_changed" | "ticket_created" | "field_changed" | "assigned";
export type AutomationActionType = "set_field" | "transition" | "assign" | "notify" | "add_label";

@Entity("ticket_automation_rules")
export class TicketAutomationRuleEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId!: string;

    @ManyToOne(() => TicketProjectEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @Column({ length: 200 })
    name!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @Column({ name: "trigger_type", type: "varchar", length: 50 })
    triggerType!: AutomationTriggerType;

    @Column({ name: "trigger_config", type: "jsonb", default: {} })
    triggerConfig!: Record<string, unknown>;

    @Column({ name: "action_type", type: "varchar", length: 50 })
    actionType!: AutomationActionType;

    @Column({ name: "action_config", type: "jsonb", default: {} })
    actionConfig!: Record<string, unknown>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
