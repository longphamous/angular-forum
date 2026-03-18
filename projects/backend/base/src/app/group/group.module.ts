import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { GroupEntity } from "./entities/group.entity";
import { PagePermissionEntity } from "./entities/page-permission.entity";
import { GroupController } from "./group.controller";
import { GroupService } from "./group.service";
import { PagePermissionController } from "./page-permission.controller";
import { PagePermissionService } from "./page-permission.service";

@Module({
    imports: [TypeOrmModule.forFeature([GroupEntity, PagePermissionEntity, UserEntity])],
    controllers: [GroupController, PagePermissionController],
    providers: [GroupService, PagePermissionService],
    exports: [GroupService, PagePermissionService]
})
export class GroupModule {}
