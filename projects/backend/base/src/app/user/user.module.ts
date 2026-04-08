import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { GamificationModule } from "../gamification/gamification.module";
import { GroupEntity } from "../group/entities/group.entity";
import { MediaModule } from "../media/media.module";
import { ModerationModule } from "../moderation/moderation.module";
import { RpgModule } from "../rpg/rpg.module";
import { UserEntity } from "./entities/user.entity";
import { PresenceInterceptor } from "./presence.interceptor";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
    imports: [
        AuthModule,
        GamificationModule,
        MediaModule,
        ModerationModule,
        RpgModule,
        TypeOrmModule.forFeature([UserEntity, GroupEntity])
    ],
    controllers: [UserController],
    providers: [UserService, { provide: APP_INTERCEPTOR, useClass: PresenceInterceptor }],
    exports: [UserService]
})
export class UserModule {}
