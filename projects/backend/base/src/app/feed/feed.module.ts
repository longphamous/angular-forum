import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ForumEntity } from "../forum/entities/forum.entity";
import { ForumPostEntity } from "../forum/entities/post.entity";
import { ForumThreadEntity } from "../forum/entities/thread.entity";
import { GamificationModule } from "../gamification/gamification.module";
import { UserEntity } from "../user/entities/user.entity";
import { FeaturedThreadEntity } from "./entities/featured-thread.entity";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

@Module({
    imports: [
        GamificationModule,
        TypeOrmModule.forFeature([FeaturedThreadEntity, ForumThreadEntity, ForumPostEntity, ForumEntity, UserEntity])
    ],
    controllers: [FeedController],
    providers: [FeedService]
})
export class FeedModule {}
