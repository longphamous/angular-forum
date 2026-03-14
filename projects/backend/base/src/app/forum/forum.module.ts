import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditModule } from "../credit/credit.module";
import { GamificationModule } from "../gamification/gamification.module";
import { CategoryController } from "./controllers/category.controller";
import { ForumController } from "./controllers/forum.controller";
import { PostController } from "./controllers/post.controller";
import { ThreadController } from "./controllers/thread.controller";
import { UserEntity } from "../user/entities/user.entity";
import { ForumCategoryEntity } from "./entities/category.entity";
import { ForumEntity } from "./entities/forum.entity";
import { ForumPostEntity } from "./entities/post.entity";
import { ForumPostReactionEntity } from "./entities/post-reaction.entity";
import { ForumThreadEntity } from "./entities/thread.entity";
import { CategoryService } from "./services/category.service";
import { ForumService } from "./services/forum.service";
import { PostService } from "./services/post.service";
import { ThreadService } from "./services/thread.service";

@Module({
    imports: [
        CreditModule,
        GamificationModule,
        TypeOrmModule.forFeature([
            ForumCategoryEntity,
            ForumEntity,
            ForumThreadEntity,
            ForumPostEntity,
            ForumPostReactionEntity,
            UserEntity
        ])
    ],
    controllers: [CategoryController, ForumController, ThreadController, PostController],
    providers: [CategoryService, ForumService, ThreadService, PostService],
    exports: [CategoryService, ForumService, ThreadService, PostService]
})
export class ForumModule {}
