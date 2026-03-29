import { IsEnum, IsNotEmpty } from "class-validator";

import type { ClanMemberRole } from "../entities/clan-member.entity";

export class ManageMemberDto {
    @IsEnum(["admin", "moderator", "member"])
    @IsNotEmpty()
    role!: ClanMemberRole;
}
