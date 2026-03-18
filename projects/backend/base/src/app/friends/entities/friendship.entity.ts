import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity("friendships")
@Unique(["requesterId", "addresseeId"])
export class FriendshipEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "requester_id", type: "uuid" })
    requesterId!: string;

    @Column({ name: "addressee_id", type: "uuid" })
    addresseeId!: string;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: "pending" | "accepted" | "declined" | "blocked";

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
