import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { TicketEntity } from "./ticket.entity";

@Entity("ticket_categories")
export class TicketCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    icon?: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    color?: string;

    @Column({ type: "int", default: 0 })
    position!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany(() => TicketEntity, (t) => t.category)
    tickets?: TicketEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
