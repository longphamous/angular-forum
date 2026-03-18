import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { LinkCategoryEntity } from "./entities/link-category.entity";
import { LinkCommentEntity } from "./entities/link-comment.entity";
import { LinkEntryEntity } from "./entities/link-entry.entity";
import { LinkRatingEntity } from "./entities/link-rating.entity";
import { LinkDatabaseController } from "./link-database.controller";
import { LinkDatabaseService } from "./link-database.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([LinkCategoryEntity, LinkEntryEntity, LinkCommentEntity, LinkRatingEntity, UserEntity])
    ],
    controllers: [LinkDatabaseController],
    providers: [LinkDatabaseService],
    exports: [LinkDatabaseService]
})
export class LinkDatabaseModule {}
