import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CategoryController } from "./controllers/category.controller";
import { ForumController } from "./controllers/forum.controller";
import { PostController } from "./controllers/post.controller";
import { ThreadController } from "./controllers/thread.controller";
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
        TypeOrmModule.forFeature([
            ForumCategoryEntity,
            ForumEntity,
            ForumThreadEntity,
            ForumPostEntity,
            ForumPostReactionEntity
        ])
    ],
    controllers: [CategoryController, ForumController, ThreadController, PostController],
    providers: [CategoryService, ForumService, ThreadService, PostService],
    exports: [CategoryService, ForumService, ThreadService, PostService]
})
export class ForumModule {}
