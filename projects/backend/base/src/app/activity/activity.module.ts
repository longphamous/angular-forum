import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { ActivityController } from "./activity.controller";
import { ActivityService } from "./activity.service";
import { ActivityEntity } from "./entities/activity.entity";

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ActivityEntity, UserEntity])],
    controllers: [ActivityController],
    providers: [ActivityService],
    exports: [ActivityService]
})
export class ActivityModule {}
