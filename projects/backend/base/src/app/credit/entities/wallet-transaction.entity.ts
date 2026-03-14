import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("wallet_transactions")
export class WalletTransactionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "from_user_id", type: "uuid", nullable: true })
    fromUserId!: string | null;

    @Column({ name: "to_user_id", type: "uuid" })
    toUserId!: string;

    @Column({ type: "int" })
    amount!: number;

    @Column({ type: "varchar", length: 50 })
    type!: string;

    @Column({ type: "varchar", length: 255 })
    description!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
