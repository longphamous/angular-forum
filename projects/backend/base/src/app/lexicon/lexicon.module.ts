import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamificationModule } from "../gamification/gamification.module";
import { MediaModule } from "../media/media.module";
import { UserEntity } from "../user/entities/user.entity";
import { LexiconArticleEntity } from "./entities/lexicon-article.entity";
import { LexiconArticleVersionEntity } from "./entities/lexicon-article-version.entity";
import { LexiconCategoryEntity } from "./entities/lexicon-category.entity";
import { LexiconCommentEntity } from "./entities/lexicon-comment.entity";
import { LexiconReportEntity } from "./entities/lexicon-report.entity";
import { LexiconTermsEntity } from "./entities/lexicon-terms.entity";
import { LexiconController } from "./lexicon.controller";
import { LexiconService } from "./lexicon.service";

@Module({
    imports: [
        GamificationModule,
        MediaModule,
        TypeOrmModule.forFeature([
            LexiconCategoryEntity,
            LexiconArticleEntity,
            LexiconArticleVersionEntity,
            LexiconCommentEntity,
            LexiconReportEntity,
            LexiconTermsEntity,
            UserEntity
        ])
    ],
    controllers: [LexiconController],
    providers: [LexiconService],
    exports: [LexiconService]
})
export class LexiconModule {}
