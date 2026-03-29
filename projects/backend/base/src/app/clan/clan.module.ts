import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NotificationsModule } from "../notifications/notifications.module";
import { UserEntity } from "../user/entities/user.entity";
import { ClanAdminController } from "./controllers/clan-admin.controller";
import { ClanMemberController } from "./controllers/clan-member.controller";
import { ClanController } from "./controllers/clan.controller";
import { ClanApplicationEntity } from "./entities/clan-application.entity";
import { ClanCategoryEntity } from "./entities/clan-category.entity";
import { ClanCommentEntity } from "./entities/clan-comment.entity";
import { ClanMemberEntity } from "./entities/clan-member.entity";
import { ClanPageEntity } from "./entities/clan-page.entity";
import { ClanEntity } from "./entities/clan.entity";
import { ClanAdminService } from "./services/clan-admin.service";
import { ClanMemberService } from "./services/clan-member.service";
import { ClanService } from "./services/clan.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ClanEntity,
            ClanCategoryEntity,
            ClanMemberEntity,
            ClanApplicationEntity,
            ClanPageEntity,
            ClanCommentEntity,
            UserEntity
        ]),
        NotificationsModule
    ],
    controllers: [ClanController, ClanMemberController, ClanAdminController],
    providers: [ClanService, ClanMemberService, ClanAdminService],
    exports: [ClanService, ClanMemberService]
})
export class ClanModule {}
