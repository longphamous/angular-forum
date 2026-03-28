import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("ticket_labels")
export class TicketLabelEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "varchar", length: 20 })
    color!: string;

    @Column({ name: "category_id", type: "uuid", nullable: true })
    categoryId?: string;
}
