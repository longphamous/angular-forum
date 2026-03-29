import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

import type { ProjectMemberRole } from "../entities/ticket-project-member.entity";

export class ManageProjectMemberDto {
    @IsUUID()
    @IsNotEmpty()
    userId!: string;

    @IsEnum(["admin", "developer", "viewer"])
    @IsNotEmpty()
    role!: ProjectMemberRole;
}
