import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketProjectEntity } from "./ticket-project.entity";

export type CustomFieldType = "text" | "number" | "date" | "select" | "boolean" | "user" | "url";

@Entity("ticket_custom_field_defs")
export class TicketCustomFieldDefEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId!: string;

    @ManyToOne(() => TicketProjectEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @Column({ length: 200 })
    name!: string;

    @Column({ name: "field_key", length: 100 })
    fieldKey!: string;

    @Column({ name: "field_type", type: "varchar", length: 20, default: "text" })
    fieldType!: CustomFieldType;

    @Column({ type: "jsonb", nullable: true })
    options?: string[];

    @Column({ default: false })
    required!: boolean;

    @Column({ name: "applicable_types", type: "varchar", array: true, default: "{}" })
    applicableTypes!: string[];

    @Column({ type: "int", default: 0 })
    position!: number;
}
