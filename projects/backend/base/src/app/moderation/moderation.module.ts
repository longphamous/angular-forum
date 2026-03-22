import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { ProfileApprovalEntity } from "./entities/profile-approval.entity";
import { ModerationController } from "./moderation.controller";
import { ModerationService } from "./moderation.service";

@Module({
    imports: [TypeOrmModule.forFeature([ProfileApprovalEntity, UserEntity])],
    controllers: [ModerationController],
    providers: [ModerationService],
    exports: [ModerationService]
})
export class ModerationModule {}
