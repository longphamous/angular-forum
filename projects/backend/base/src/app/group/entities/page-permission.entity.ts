import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { GroupEntity } from "./group.entity";

@Entity("page_permissions")
export class PagePermissionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true, length: 300 })
    route!: string;

    @Column({ length: 200 })
    name!: string;

    @ManyToMany(() => GroupEntity)
    @JoinTable({
        name: "page_permission_groups",
        joinColumn: { name: "page_permission_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "group_id", referencedColumnName: "id" }
    })
    groups?: GroupEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
