import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module";
import { UserEntity } from "../user/entities/user.entity";
import { BlogController } from "./blog.controller";
import { BlogService } from "./blog.service";
import { BlogCategoryEntity } from "./entities/blog-category.entity";
import { BlogCommentEntity } from "./entities/blog-comment.entity";
import { BlogPostEntity } from "./entities/blog-post.entity";

@Module({
    imports: [MediaModule, TypeOrmModule.forFeature([BlogPostEntity, BlogCategoryEntity, BlogCommentEntity, UserEntity])],
    controllers: [BlogController],
    providers: [BlogService],
    exports: [BlogService]
})
export class BlogModule {}
