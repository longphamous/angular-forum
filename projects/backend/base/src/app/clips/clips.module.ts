import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module";
import { UserEntity } from "../user/entities/user.entity";
import { ClipStatsController } from "./clip-stats.controller";
import { ClipStatsService } from "./clip-stats.service";
import { ClipsController } from "./clips.controller";
import { ClipsService } from "./clips.service";
import { ClipEntity } from "./entities/clip.entity";
import { ClipCommentEntity } from "./entities/clip-comment.entity";
import { ClipFollowEntity } from "./entities/clip-follow.entity";
import { ClipLikeEntity } from "./entities/clip-like.entity";
import { ClipViewEventEntity } from "./entities/clip-view-event.entity";

@Module({
    imports: [MediaModule, TypeOrmModule.forFeature([ClipEntity, ClipCommentEntity, ClipLikeEntity, ClipFollowEntity, ClipViewEventEntity, UserEntity])],
    controllers: [ClipStatsController, ClipsController],
    providers: [ClipStatsService, ClipsService],
    exports: [ClipStatsService, ClipsService]
})
export class ClipsModule {}
