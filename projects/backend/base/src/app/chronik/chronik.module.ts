import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NotificationsModule } from "../notifications/notifications.module";
import { UserEntity } from "../user/entities/user.entity";
import { ChronikController } from "./chronik.controller";
import { ChronikService } from "./chronik.service";
import { ChronikCommentEntity } from "./entities/chronik-comment.entity";
import { ChronikCommentLikeEntity } from "./entities/chronik-comment-like.entity";
import { ChronikEntryEntity } from "./entities/chronik-entry.entity";
import { ChronikFollowingEntity } from "./entities/chronik-following.entity";
import { ChronikHiddenEntity } from "./entities/chronik-hidden.entity";
import { ChronikLikeEntity } from "./entities/chronik-like.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ChronikEntryEntity,
            ChronikLikeEntity,
            ChronikCommentEntity,
            ChronikCommentLikeEntity,
            ChronikHiddenEntity,
            ChronikFollowingEntity,
            UserEntity
        ]),
        NotificationsModule
    ],
    controllers: [ChronikController],
    providers: [ChronikService],
    exports: [ChronikService]
})
export class ChronikModule {}
