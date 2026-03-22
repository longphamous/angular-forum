import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";

@Entity("steam_profiles")
export class SteamProfileEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid", unique: true })
    userId!: string;

    @OneToOne(() => UserEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user?: UserEntity;

    @Column({ name: "steam_id", type: "varchar", length: 20, unique: true })
    steamId!: string;

    @Column({ name: "persona_name", type: "varchar", length: 100 })
    personaName!: string;

    @Column({ name: "avatar_url", type: "text", nullable: true })
    avatarUrl!: string | null;

    @Column({ name: "profile_url", type: "text", nullable: true })
    profileUrl!: string | null;

    @Column({ name: "online_status", type: "int", default: 0 })
    onlineStatus!: number;

    @Column({ name: "current_game", type: "varchar", length: 200, nullable: true })
    currentGame!: string | null;

    @Column({ name: "game_count", type: "int", default: 0 })
    gameCount!: number;

    @Column({ name: "is_public", type: "boolean", default: true })
    isPublic!: boolean;

    @Column({ name: "sync_friends", type: "boolean", default: true })
    syncFriends!: boolean;

    @Column({ name: "last_synced", type: "timestamptz", nullable: true })
    lastSynced!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
