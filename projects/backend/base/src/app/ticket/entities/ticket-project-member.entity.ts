import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketProjectEntity } from "./ticket-project.entity";

export type ProjectMemberRole = "admin" | "developer" | "viewer";

@Entity("ticket_project_members")
export class TicketProjectMemberEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId!: string;

    @ManyToOne(() => TicketProjectEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "project_id" })
    project?: TicketProjectEntity;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 30, default: "developer" })
    role!: ProjectMemberRole;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
