import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { GroupEntity } from "../../group/entities/group.entity";

export type UserRole = "admin" | "moderator" | "member" | "guest";
export type UserStatus = "active" | "inactive" | "banned" | "pending";

@Entity("users")
export class UserEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true, length: 50 })
    username!: string;

    @Column({ unique: true, length: 255 })
    email!: string;

    @Column({ name: "password_hash" })
    passwordHash!: string;

    @Column({ name: "display_name", length: 100 })
    displayName!: string;

    @Column({ name: "avatar_url", nullable: true, type: "text" })
    avatarUrl?: string;

    @Column({ nullable: true, type: "text" })
    bio?: string;

    @Column({
        type: "enum",
        enum: ["admin", "moderator", "member", "guest"],
        default: "member"
    })
    role!: UserRole;

    @Column({
        type: "enum",
        enum: ["active", "inactive", "banned", "pending"],
        default: "active"
    })
    status!: UserStatus;

    @Column({ name: "last_login_at", nullable: true, type: "timestamptz" })
    lastLoginAt?: Date;

    @ManyToMany(() => GroupEntity, (group) => group.users)
    groups?: GroupEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
